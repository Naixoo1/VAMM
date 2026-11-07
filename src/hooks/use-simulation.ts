"use client";
import {useCallback,useRef,useState} from "react";
import {useQuery} from "@tanstack/react-query";
import type {ErrorResponse,MoneyByAsset,MutationRequest,SessionBundle} from "@/contracts";
import {applyAction,createSession,getActiveSession} from "@/lib/simulation/gateway";
import {listPreservedSessions} from "@/lib/simulation/history";
type Intent={kind:"create";request:{requestId:string}}|{kind:"mutation";request:MutationRequest};
const conflicts=new Set(["STATE_CONFLICT","IDEMPOTENCY_CONFLICT"]);
const unknownError:ErrorResponse={code:"STORAGE_UNAVAILABLE",message:"The local session could not be read or saved. Nothing was silently reset.",retryable:true,requestId:null};
export function useSimulation(){
 const active=useQuery<SessionBundle|null,ErrorResponse>({queryKey:["vamm-active-session"],queryFn:async()=>{const result=await getActiveSession();if(!result.ok)throw result.error;return result.data},retry:false,refetchOnWindowFocus:false,staleTime:0});
 // Discovery is read from the owner-scoped repository, not a memory-only list of resets.
 const preservedQuery=useQuery<SessionBundle[],ErrorResponse>({queryKey:["vamm-preserved-sessions"],queryFn:async()=>{const result=await listPreservedSessions();if(!result.ok)throw result.error;return result.data},enabled:active.isSuccess,retry:false,refetchOnWindowFocus:false,staleTime:0});
 const[busy,setBusy]=useState(false);const[issue,setIssue]=useState<ErrorResponse|null>(null);const[retryIntent,setRetryIntent]=useState<Intent|null>(null);const lock=useRef(false);
 const {refetch:refetchActive}=active;const{refetch:refetchHistory}=preservedQuery;
 const reload=useCallback(async()=>{const[result]=await Promise.all([refetchActive(),refetchHistory()]);if(!result.isError)setIssue(null);return result},[refetchActive,refetchHistory]);
 async function execute(intent:Intent){
  if(lock.current)return;lock.current=true;setBusy(true);setIssue(null);
  try{
   const result=intent.kind==="create"?await createSession(intent.request):await applyAction(intent.request);
   if(!result.ok){
    setIssue(result.error);setRetryIntent(result.error.retryable?intent:null);
    if(conflicts.has(result.error.code)){const refreshed=await reload();setIssue({...result.error,message:result.error.message+(refreshed.isError?" Current state could not be reloaded. Try reloading before continuing.":" Current state was reloaded. Review it before choosing a new action.")})}
    return;
   }
   setRetryIntent(null);
   // A create/reset atomically changes the active pointer; refresh discovery from that snapshot.
   const refreshed=await reload();
   if(refreshed.isError)setIssue({...unknownError,message:"The action was saved, but the latest session could not be loaded. Reload current state before continuing."});
  }catch{setIssue({...unknownError,requestId:intent.request.requestId});setRetryIntent(intent)}
  finally{lock.current=false;setBusy(false)}
 }
 return{bundle:active.data??null,loading:active.isPending,busy,issue:issue??active.error,retryIntent,preserved:preservedQuery.data??[],preservedLoading:preservedQuery.isFetching,preservedError:preservedQuery.error,reloadHistory:()=>refetchHistory(),reload,
  create:()=>execute({kind:"create",request:{requestId:crypto.randomUUID()}}),
  retry:()=>retryIntent?execute(retryIntent):Promise.resolve(),
  reconcile:async()=>{if(lock.current)return;setRetryIntent(null);await reload()},
  advance:(savingsRateBps:number,contributionAllocation:MoneyByAsset)=>{if(!active.data)return Promise.resolve();return execute({kind:"mutation",request:{sessionId:active.data.session.id,expectedVersion:active.data.session.version,requestId:crypto.randomUUID(),action:"ADVANCE",savingsRateBps,contributionAllocation}})},
  settle:(funding:MoneyByAsset,acknowledgeUnmetCost:boolean)=>{if(!active.data)return Promise.resolve();return execute({kind:"mutation",request:{sessionId:active.data.session.id,expectedVersion:active.data.session.version,requestId:crypto.randomUUID(),action:"SETTLE_SHOCK",funding,acknowledgeUnmetCost}})}
 };
}
