"use client";

import {useRef,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {getSession,listSessions,saveSession} from "@/lib/mentor/history";
import {MAX_CHAT_IMAGE_BYTES,MAX_CHAT_REQUEST_MESSAGES,MAX_CHAT_TEXT_LENGTH,type ChatImage,type ChatSession,type MentorChatRequest} from "@/lib/mentor/types";

const historyKey=["vamm-mentor-chat-sessions"];
const configKey=["vamm-mentor-chat-availability"];
type Phase="save-user"|"request"|"save-assistant";
interface Intent {phase:Phase;candidate:ChatSession;expected:number|null;saved?:ChatSession;request?:MentorChatRequest;reply?:ChatSession}
interface Issue {message:string;conflict:boolean}
const imageTypes=["image/png","image/jpeg","image/webp"] as const;
const imageOnlyQuestion="Help me interpret this chart screenshot and explain its uncertainties.";

export async function readChatImage(file:File):Promise<ChatImage>{
 if(!imageTypes.includes(file.type as typeof imageTypes[number])||!file.size||file.size>MAX_CHAT_IMAGE_BYTES)throw new Error("Choose a PNG, JPEG, or WebP image no larger than 2 MiB.");
 const bytes=new Uint8Array(await file.arrayBuffer());
 const png=bytes.length>=8&&[137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
 const jpeg=bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 if(!((file.type==="image/png"&&png)||(file.type==="image/jpeg"&&jpeg)||(file.type==="image/webp"&&webp)))throw new Error("The image contents do not match its PNG, JPEG, or WebP type.");
 const dataUrl=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==="string"?resolve(reader.result):reject(new Error("The image could not be read."));reader.onerror=()=>reject(new Error("The image could not be read."));reader.readAsDataURL(file)});
 const name=[...file.name].filter(character=>character.charCodeAt(0)>31&&character.charCodeAt(0)!==127).join("").trim().slice(0,200)||"chart-screenshot";
 return{name,mimeType:file.type as ChatImage["mimeType"],dataUrl};
}

function requestFor(session:ChatSession,image:ChatImage|null):MentorChatRequest{
 return{messages:session.messages.slice(-MAX_CHAT_REQUEST_MESSAGES).map(({role,content})=>({role,content})),...(image?{image}:{})};
}
function latestImage(session:ChatSession):ChatImage|null{return [...session.messages].reverse().find(message=>message.role==="user")?.image??null}
function serverIssue(code:unknown):string{
 if(code==="NOT_CONFIGURED")return"The Mentor is not configured on this site yet. Your question is saved; you can retry after it becomes available.";
 if(code==="MODEL_AUTH_FAILED")return"This site’s configured model credentials were rejected. Your question is saved. The site owner must update the model configuration before you retry.";
 if(code==="MODEL_ACCESS_DENIED")return"The configured model is not accessible to this site. Your question is saved. The site owner must check model access before you retry.";
 if(code==="MODEL_NOT_FOUND")return"This site’s configured model is unavailable. Your question is saved. The site owner must check the model name before you retry.";
 if(code==="MODEL_QUOTA_EXCEEDED")return"The model provider’s quota or billing limit has been reached. Your question is saved. Retry after the site owner restores provider capacity.";
 if(code==="MODEL_RATE_LIMITED")return"The model provider is busy or rate-limiting requests. Your question is saved. Wait a moment, then choose Retry reply.";
 if(code==="MODEL_REQUEST_REJECTED")return"The model provider rejected this screenshot or model request. Your question is saved. Start a new chat to revise the question or screenshot.";
 if(code==="RATE_LIMITED")return"The Mentor has reached its request limit. Your question is saved. Wait a moment, then choose Retry reply.";
 if(code==="MODEL_TIMEOUT")return"The Mentor took too long to respond. Your question is saved. A manual retry sends another model request.";
 if(code==="MODEL_REFUSAL")return"The Mentor could not answer that request. Your question is saved. You can start a new chat with a different question.";
 return"The Mentor could not return an answer. Your question is saved. A manual retry sends another model request.";
}

export function useMentorChat(){
 const client=useQueryClient();
 const history=useQuery({queryKey:historyKey,queryFn:async()=>{const result=await listSessions();if(!result.ok)throw new Error(result.error.message);return result.data},retry:false,refetchOnWindowFocus:false});
 const availability=useQuery({queryKey:configKey,queryFn:async({signal})=>{const response=await fetch("/api/mentor-chat",{method:"GET",credentials:"same-origin",cache:"no-store",signal});if(!response.ok)throw new Error("Mentor availability could not be checked.");const data:unknown=await response.json();if(!data||typeof data!=="object"||typeof(data as {configured?:unknown}).configured!=="boolean")throw new Error("Mentor availability could not be checked.");return(data as {configured:boolean}).configured},retry:false,refetchOnWindowFocus:false});
 const[session,setSession]=useState<ChatSession|null>(null);const[draft,setDraft]=useState("");const[image,setImage]=useState<ChatImage|null>(null);const[busy,setBusy]=useState(false);const[reading,setReading]=useState(false);const[issue,setIssue]=useState<Issue|null>(null);const[unsavedReply,setUnsavedReply]=useState<string|null>(null);const[phase,setPhase]=useState<Phase|null>(null);const[imageError,setImageError]=useState<string|null>(null);const[imageReading,setImageReading]=useState(false);
 const lock=useRef(false);const intent=useRef<Intent|null>(null);const imageSequence=useRef(0);const[hasIntent,setHasIntent]=useState(false);const[retryPhase,setRetryPhase]=useState<Phase|null>(null);
 function remember(saved:ChatSession){setSession(saved);client.setQueryData<ChatSession[]>(historyKey,current=>[saved,...(current??[]).filter(item=>item.id!==saved.id)].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)))}
 async function run(current:Intent){
  if(lock.current)return;lock.current=true;setBusy(true);setIssue(null);
  try{
   if(current.phase==="save-user"){
    setPhase("save-user");const result=await saveSession(current.candidate,current.expected);
    if(!result.ok){setIssue({message:result.error.message,conflict:result.error.code==="CONFLICT"});return}
    current.saved=result.data;current.phase="request";setRetryPhase("request");remember(result.data);setDraft("");
    current.request=requestFor(result.data,current.candidate.messages.at(-1)?.image??null);
   }
   if(current.phase==="request"){
    setPhase("request");
    if(availability.data!==true){setIssue({message:serverIssue("NOT_CONFIGURED"),conflict:false});return}
    const controller=new AbortController();const timeout=window.setTimeout(()=>controller.abort(),25_000);let response:Response;let payload:unknown;
    try{response=await fetch("/api/mentor-chat",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(current.request),signal:controller.signal});payload=await response.json()}finally{window.clearTimeout(timeout)}
    const data=payload as {ok?:unknown;data?:{content?:unknown;origin?:unknown};error?:{code?:unknown}};
    if(!response.ok||!data||data.ok!==true||typeof data.data?.content!=="string"||!data.data.content.trim()||data.data.content.length>MAX_CHAT_TEXT_LENGTH||data.data.origin!=="model"){
     setIssue({message:serverIssue(data?.error?.code),conflict:false});return;
    }
    const saved=current.saved!;const stamp=new Date(Math.max(Date.now(),Date.parse(saved.updatedAt))).toISOString();
    current.reply={...saved,updatedAt:stamp,messages:[...saved.messages,{id:crypto.randomUUID(),role:"assistant",content:data.data.content.trim(),createdAt:stamp,origin:"model"}]};
    current.phase="save-assistant";setRetryPhase("save-assistant");setUnsavedReply(data.data.content.trim());
   }
   if(current.phase==="save-assistant"){
    setPhase("save-assistant");const result=await saveSession(current.reply!,current.saved!.revision);
    if(!result.ok){setIssue({message:`The reply is visible but not saved. ${result.error.message}`,conflict:result.error.code==="CONFLICT"});return}
    remember(result.data);setUnsavedReply(null);intent.current=null;setHasIntent(false);setRetryPhase(null);
   }
  }catch{setIssue({message:current.phase==="request"?"The connection failed. Your question is saved. A manual retry sends another model request.":"Chat history could not be saved. Your question and any unsaved reply remain in this tab. Retry the same action.",conflict:false})}
  finally{lock.current=false;setBusy(false);setPhase(null)}
 }
 const unanswered=session?.messages.at(-1)?.role==="user";
 function send(){
  if(lock.current||reading||imageReading||history.isPending||history.error||availability.data!==true||availability.isFetching||intent.current||unanswered)return;
  const content=draft.trim()||(image?imageOnlyQuestion:"");if(!content||content.length>MAX_CHAT_TEXT_LENGTH)return;
  const stamp=new Date(Math.max(Date.now(),session?Date.parse(session.updatedAt):0)).toISOString();
  const candidate:ChatSession={...(session??{id:crypto.randomUUID(),title:content.slice(0,90),createdAt:stamp,revision:0,messages:[]}),updatedAt:stamp,messages:[...(session?.messages??[]),{id:crypto.randomUUID(),role:"user",content,createdAt:stamp,...(image?{image}:{})}]};
  const next:Intent={phase:"save-user",candidate,expected:session?.revision??null};intent.current=next;setHasIntent(true);setRetryPhase("save-user");void run(next);
 }
 function retry(){
  if(lock.current||reading||issue?.conflict)return;
  if((!intent.current||intent.current.phase==="request")&&(availability.data!==true||availability.isFetching))return;
  if(intent.current){void run(intent.current);return}
  if(session&&unanswered){const next:Intent={phase:"request",candidate:session,expected:session.revision,saved:session,request:requestFor(session,latestImage(session))};intent.current=next;setHasIntent(true);setRetryPhase("request");void run(next)}
 }
 function mayLeave(){return!(draft.trim()||unsavedReply||intent.current?.phase==="save-user")||window.confirm("Leave this chat and discard its unsaved draft or reply? Messages already saved on this device will remain in history.")}
 function newChat(){if(lock.current||reading||!mayLeave())return false;imageSequence.current++;intent.current=null;setHasIntent(false);setRetryPhase(null);setSession(null);setDraft("");setImage(null);setImageReading(false);setIssue(null);setUnsavedReply(null);setImageError(null);return true}
 async function openSession(id:string){
  if(lock.current||reading||!mayLeave())return false;lock.current=true;setReading(true);
  try{const result=await getSession(id);if(!result.ok){setIssue({message:result.error.message,conflict:false});return false}if(!result.data){setIssue({message:"This chat could not be found. Refresh chat history to check the latest records.",conflict:false});return false}imageSequence.current++;intent.current=null;setHasIntent(false);setRetryPhase(null);setSession(result.data);setDraft("");setImage(latestImage(result.data));setImageReading(false);setImageError(null);setIssue(null);setUnsavedReply(null);return true}catch{setIssue({message:"This chat could not be opened. Your existing history has not been reset.",conflict:false});return false}finally{lock.current=false;setReading(false)}
 }
 async function reloadHistory(){
  if(lock.current||reading)return;lock.current=true;setReading(true);
  try{
   const result=await history.refetch();if(result.isError){setIssue({message:"Chat history could not be refreshed. Nothing has been reset.",conflict:false});return}
   const fresh=result.data?.find(item=>item.id===session?.id);if(fresh)setSession(fresh);
   if(issue?.conflict&&intent.current&&fresh){
    const current=intent.current;const saved=current.saved;
    if(current.reply&&fresh.messages.some(message=>message.id===current.reply!.messages.at(-1)!.id)){intent.current=null;setHasIntent(false);setRetryPhase(null);setUnsavedReply(null);setIssue(null)}
    else if(saved&&JSON.stringify(saved.messages)===JSON.stringify(fresh.messages)){current.saved=fresh;if(current.reply)current.reply={...current.reply,revision:fresh.revision};setIssue(null)}
    else setIssue({message:"This chat was continued in another tab. Review its latest messages or start a new chat. Any unsaved reply below has not replaced its history.",conflict:true});
   }else if(!intent.current)setIssue(null);
  }finally{lock.current=false;setReading(false)}
 }
 async function attach(file:File){
  if(lock.current||reading||intent.current||unanswered)return;const sequence=++imageSequence.current;setImageReading(true);setImageError(null);
  try{const selected=await readChatImage(file);if(sequence===imageSequence.current)setImage(selected)}catch(error){if(sequence===imageSequence.current)setImageError(error instanceof Error?error.message:"The image could not be read.")}finally{if(sequence===imageSequence.current)setImageReading(false)}
 }
 function removeImage(){if(lock.current||intent.current||unanswered)return;imageSequence.current++;setImage(null);setImageReading(false);setImageError(null)}
 return{sessions:history.data??[],session,draft,setDraft,image,attach,removeImage,imageReading,imageError,busy,reading,phase,issue,unsavedReply,loading:history.isPending,historyError:history.error?.message??null,configured:availability.data??null,configError:availability.error?"Mentor availability could not be checked.":null,checkingConfig:availability.isFetching,checkAvailability:()=>availability.refetch(),send,retry,newChat,openSession,reloadHistory,unanswered:!!unanswered,hasIntent,
  canRetry:!busy&&!reading&&!issue?.conflict&&((hasIntent&&retryPhase!=="request")||(availability.data===true&&!availability.isFetching)),
  canSend:!busy&&!reading&&!imageReading&&!history.isPending&&!history.error&&availability.data===true&&!availability.isFetching&&!hasIntent&&!unanswered&&!!(draft.trim()||image)&&draft.trim().length<=MAX_CHAT_TEXT_LENGTH};
}
export type MentorChatController=ReturnType<typeof useMentorChat>;
