// @vitest-environment jsdom
import {type ReactNode} from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,render,renderHook,screen,waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {getSession,listSessions,saveSession} from "@/lib/mentor/history";
import {listMentorAnswers} from "@/lib/learning/mentor-history";
import type {ChatSession} from "@/lib/mentor/types";
import {readChatImage,useMentorChat} from "@/hooks/use-mentor-chat";
import {MentorChatWorkspace} from "@/components/mentor/chat-workspace";
vi.mock("@/lib/mentor/history",()=>({getSession:vi.fn(),listSessions:vi.fn(),saveSession:vi.fn()}));
vi.mock("@/lib/learning/mentor-history",()=>({listMentorAnswers:vi.fn()}));
const fetchMock=vi.fn<typeof fetch>();const clients:QueryClient[]=[];let records:Map<string,ChatSession>;let configured=true;
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});
const model=()=>json({ok:true,data:{content:"Consider several possible scenarios; this is not a live price.",origin:"model"}});
const posts=()=>fetchMock.mock.calls.filter(([,options])=>options?.method==="POST");
const storageFailure={ok:false as const,error:{code:"STORAGE_UNAVAILABLE" as const,message:"Storage is full. No history has been reset."}};
async function durable(candidate:ChatSession){const saved={...clone(candidate),revision:(records.get(candidate.id)?.revision??0)+1};records.set(saved.id,saved);return{ok:true as const,data:clone(saved)}}
function sample(count=2):ChatSession{const stamp="2026-11-07T09:00:00.000Z";return{id:crypto.randomUUID(),title:"Earlier conversation",createdAt:stamp,updatedAt:stamp,revision:1,messages:Array.from({length:count},(_,index)=>({id:crypto.randomUUID(),role:index%2?"assistant" as const:"user" as const,content:`Saved message ${index}`,createdAt:stamp,...(index%2?{origin:"model" as const}:{})}))}}
function setup(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});clients.push(client);return{client,wrapper:({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>}}
async function ready(result:{current:ReturnType<typeof useMentorChat>}){await waitFor(()=>expect(result.current.loading).toBe(false));await waitFor(()=>expect(result.current.configured).not.toBeNull())}
function imageFile(name="chart.png",bytes=[137,80,78,71,13,10,26,10,0],type="image/png"){const file=new File([new Uint8Array(bytes)],name,{type});Object.defineProperty(file,"arrayBuffer",{value:async()=>new Uint8Array(bytes).buffer});return file}
beforeEach(()=>{vi.clearAllMocks();records=new Map();configured=true;fetchMock.mockReset();fetchMock.mockImplementation(async(_url,options)=>options?.method==="POST"?model():json({configured}));vi.stubGlobal("fetch",fetchMock);vi.stubGlobal("confirm",vi.fn(()=>true));vi.mocked(listSessions).mockImplementation(async()=>({ok:true,data:clone([...records.values()])}));vi.mocked(getSession).mockImplementation(async id=>({ok:true,data:clone(records.get(id)??null)}));vi.mocked(saveSession).mockImplementation(durable);vi.mocked(listMentorAnswers).mockResolvedValue({ok:true,data:[]})});
afterEach(()=>{cleanup();clients.splice(0).forEach(client=>client.clear());vi.unstubAllGlobals()});

describe("Mentor chat durable request boundaries",()=>{
 it("reads and reopens stored conversations without making a model request",async()=>{
  const previous=sample();records.set(previous.id,previous);const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);await act(async()=>{await result.current.openSession(previous.id)});expect(result.current.session?.messages).toEqual(previous.messages);expect(posts()).toHaveLength(0);act(()=>{result.current.newChat()});expect(records.get(previous.id)).toEqual(previous);expect(posts()).toHaveLength(0);
 });
 it("keeps guest history usable when the model is unavailable and rechecks only availability",async()=>{
  configured=false;const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);act(()=>result.current.setDraft("Explain a chart"));expect(result.current.canSend).toBe(false);act(()=>result.current.send());expect(posts()).toHaveLength(0);configured=true;await act(async()=>{await result.current.checkAvailability()});await waitFor(()=>expect(result.current.canSend).toBe(true));expect(posts()).toHaveLength(0);
 });
 it("saves the question before one guarded model request and saves the response afterward",async()=>{
  let finish!:(response:Response)=>void;fetchMock.mockImplementation(async(_url,options)=>{if(options?.method!=="POST")return json({configured:true});expect([...records.values()][0].messages.map(m=>m.role)).toEqual(["user"]);return new Promise(resolve=>{finish=resolve})});const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);act(()=>result.current.setDraft("Explain this chart"));act(()=>{result.current.send();result.current.send()});await waitFor(()=>expect(posts()).toHaveLength(1));expect(result.current.busy).toBe(true);expect(result.current.session?.messages).toHaveLength(1);
  await act(async()=>finish(model()));await waitFor(()=>expect(result.current.busy).toBe(false));expect(result.current.session?.messages.map(m=>m.role)).toEqual(["user","assistant"]);expect(posts()).toHaveLength(1);expect(saveSession).toHaveBeenCalledTimes(2);
 });
 it("retains a failed model question and retries the same payload without another user message",async()=>{
  let attempts=0;fetchMock.mockImplementation(async(_url,options)=>{if(options?.method!=="POST")return json({configured:true});if(attempts++===0)throw new Error("network");return model()});const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);act(()=>result.current.setDraft("What is uncertain?"));act(()=>result.current.send());await waitFor(()=>expect(result.current.issue).not.toBeNull());expect(result.current.session?.messages).toHaveLength(1);expect(posts()).toHaveLength(1);
  await act(async()=>result.current.retry());await waitFor(()=>expect(result.current.busy).toBe(false));expect(posts()).toHaveLength(2);expect(posts()[0][1]?.body).toBe(posts()[1][1]?.body);expect(result.current.session?.messages.filter(m=>m.role==="user")).toHaveLength(1);
 });
 it("never calls the model after a failed user save and retries the exact local candidate",async()=>{
  vi.mocked(saveSession).mockResolvedValueOnce(storageFailure);const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);act(()=>result.current.setDraft("Keep my unsaved question"));act(()=>result.current.send());await waitFor(()=>expect(result.current.issue?.message).toContain("Storage is full"));expect(posts()).toHaveLength(0);expect(result.current.draft).toBe("Keep my unsaved question");await act(async()=>result.current.retry());await waitFor(()=>expect(result.current.busy).toBe(false));expect(vi.mocked(saveSession).mock.calls[0][0]).toBe(vi.mocked(saveSession).mock.calls[1][0]);expect(posts()).toHaveLength(1);
 });
 it("retries only local assistant saving even if model configuration becomes unavailable",async()=>{
  vi.mocked(saveSession).mockImplementationOnce(durable).mockResolvedValueOnce(storageFailure);const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);act(()=>result.current.setDraft("Explain my scenario"));act(()=>result.current.send());await waitFor(()=>expect(result.current.unsavedReply).not.toBeNull());await waitFor(()=>expect(result.current.busy).toBe(false));configured=false;await act(async()=>{await result.current.checkAvailability()});expect(result.current.canRetry).toBe(true);await act(async()=>result.current.retry());await waitFor(()=>expect(result.current.unsavedReply).toBeNull());expect(posts()).toHaveLength(1);expect(vi.mocked(saveSession).mock.calls[1][0]).toBe(vi.mocked(saveSession).mock.calls[2][0]);
 });
 it("requires explicit confirmation before discarding an unsaved reply",async()=>{
  vi.mocked(saveSession).mockImplementationOnce(durable).mockResolvedValueOnce(storageFailure);const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);act(()=>result.current.setDraft("A saved question"));act(()=>result.current.send());await waitFor(()=>expect(result.current.unsavedReply).not.toBeNull());await waitFor(()=>expect(result.current.busy).toBe(false));vi.mocked(confirm).mockReturnValueOnce(false);act(()=>{expect(result.current.newChat()).toBe(false)});expect(result.current.unsavedReply).not.toBeNull();expect(result.current.session?.messages).toHaveLength(1);act(()=>{expect(result.current.newChat()).toBe(true)});expect(records.size).toBe(1);
 });
 it("sends only the last20 text messages while retaining the complete local conversation",async()=>{
  const previous=sample(24);records.set(previous.id,previous);const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);await act(async()=>{await result.current.openSession(previous.id)});act(()=>result.current.setDraft("A follow-up question"));act(()=>result.current.send());await waitFor(()=>expect(result.current.session?.messages).toHaveLength(26));const payload=JSON.parse(String(posts()[0][1]?.body));expect(payload.messages).toHaveLength(20);expect(payload.messages[0].content).toBe("Saved message 5");expect(payload.messages.at(-1)).toEqual({role:"user",content:"A follow-up question"});expect(payload.messages.every((m:object)=>Object.keys(m).sort().join(",")==="content,role")).toBe(true);
 });
 it("freezes the visible screenshot during a failed request and its retry",async()=>{
  fetchMock.mockImplementation(async(_url,options)=>{if(options?.method==="POST")throw new Error("network");return json({configured:true})});const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);await act(async()=>{await result.current.attach(imageFile())});act(()=>result.current.send());await waitFor(()=>expect(result.current.issue).not.toBeNull());const image=result.current.image;act(()=>result.current.removeImage());expect(result.current.image).toBe(image);await act(async()=>result.current.retry());await waitFor(()=>expect(result.current.busy).toBe(false));expect(posts()[0][1]?.body).toBe(posts()[1][1]?.body);expect(JSON.parse(String(posts()[0][1]?.body)).messages[0].content).toBe("Help me interpret this chart screenshot and explain its uncertainties.");
 });
 it("blocks stale conflict retries and never silently resubmits on history refresh",async()=>{
  vi.mocked(saveSession).mockResolvedValueOnce({ok:false,error:{code:"CONFLICT",message:"Changed in another tab."}});const{wrapper}=setup();const{result}=renderHook(()=>useMentorChat(),{wrapper});await ready(result);act(()=>result.current.setDraft("Do not lose this draft"));act(()=>result.current.send());await waitFor(()=>expect(result.current.issue?.conflict).toBe(true));act(()=>result.current.retry());await act(async()=>{await result.current.reloadHistory()});expect(posts()).toHaveLength(0);expect(saveSession).toHaveBeenCalledTimes(1);expect(result.current.draft).toBe("Do not lose this draft");
 });
});

describe("Mentor chat input and presentation",()=>{
 it("uses suggestions as drafts, supports Shift+Enter, and renders model text without HTML",async()=>{
  fetchMock.mockImplementation(async(_url,options)=>options?.method==="POST"?json({ok:true,data:{content:"<script>alert('untrusted')</script>\nUncertain scenario.",origin:"model"}}):json({configured:true}));const{wrapper}=setup();const{container}=render(<MentorChatWorkspace/>,{wrapper});await screen.findByRole("button",{name:"Explain what a chart can and cannot tell me."});await userEvent.click(screen.getByRole("button",{name:"Explain what a chart can and cannot tell me."}));expect(posts()).toHaveLength(0);const textarea=screen.getByRole("textbox",{name:"Message your mentor"});await userEvent.keyboard("{Shift>}{Enter}{/Shift}A follow-up");expect((textarea as HTMLTextAreaElement).value).toContain("\nA follow-up");await waitFor(()=>expect(screen.getByRole("button",{name:"Send message"}).getAttribute("aria-disabled")).toBe("false"));await userEvent.keyboard("{Enter}");expect(await screen.findByText("<script>alert('untrusted')</script> Uncertain scenario.",{exact:false})).toBeTruthy();expect(container.querySelector("script")).toBeNull();expect(posts()).toHaveLength(1);
 });
 it("keeps availability retry focused through success and opens the read-only archive without a POST",async()=>{
  fetchMock.mockRejectedValueOnce(new Error("configuration check offline"));const{wrapper}=setup();render(<MentorChatWorkspace/>,{wrapper});const retry=await screen.findByRole("button",{name:"Check Mentor availability"});await userEvent.click(retry);await waitFor(()=>expect(screen.getByRole("button",{name:"Check Mentor availability"})).toBe(retry));expect(document.activeElement).toBe(retry);await userEvent.click(screen.getByRole("button",{name:"Earlier basket answers"}));expect(await screen.findByRole("region",{name:"Earlier basket answers"})).toBeTruthy();expect(screen.queryByRole("button",{name:"Delete saved answer"})).toBeNull();expect(posts()).toHaveLength(0);
 });
 it("rejects oversized, unsupported and mismatched screenshot files",async()=>{
  await expect(readChatImage(new File([new Uint8Array(2*1024*1024+1)],"large.png",{type:"image/png"}))).rejects.toThrow("2 MiB");await expect(readChatImage(imageFile("fake.png",[1,2,3],"image/png"))).rejects.toThrow("contents do not match");await expect(readChatImage(imageFile("unsafe.svg",[1,2,3],"image/svg+xml"))).rejects.toThrow("PNG, JPEG, or WebP");
 });
 it("sanitizes screenshot filenames without changing image bytes",async()=>{
  const selected=await readChatImage(imageFile("a\n"+"b".repeat(230)+".png"));expect(selected.name.length).toBe(200);expect(selected.name).not.toContain("\n");expect(selected.dataUrl).toBe("data:image/png;base64,iVBORw0KGgoA");
 });
});
