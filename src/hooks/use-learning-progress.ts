"use client";
import {useRef,useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import type {ErrorResponse,Result} from "@/contracts";
import {completeLesson,readLearningProgress,saveQuizDraft,startQuizAttempt,submitQuizAttempt} from "@/lib/learning/progress";
import type {CompleteLessonRequest,LearningMutationResult,LearningProgress,QuizSubmissionResult,SaveQuizDraftRequest,StartQuizRequest,SubmitQuizRequest} from "@/lib/learning/types";

type Intent={kind:"lesson";request:CompleteLessonRequest}|{kind:"start";request:StartQuizRequest}|{kind:"draft";request:SaveQuizDraftRequest}|{kind:"submit";request:SubmitQuizRequest};
type Receipt=LearningMutationResult|QuizSubmissionResult;
const key=["vamm-learning-progress"];
const unavailable:ErrorResponse={code:"STORAGE_UNAVAILABLE",message:"Learning progress could not be read or saved. Your current choices have not been discarded.",retryable:true,requestId:null};
export function useLearningProgress(){
 const queryClient=useQueryClient();
 const query=useQuery<LearningProgress,ErrorResponse>({queryKey:key,queryFn:async()=>{const result=await readLearningProgress();if(!result.ok)throw result.error;return result.data},retry:false,staleTime:0,refetchOnWindowFocus:false});
 const[busy,setBusy]=useState(false);const[issue,setIssue]=useState<ErrorResponse|null>(null);const[retryIntent,setRetryIntent]=useState<Intent|null>(null);const lock=useRef(false);
 async function execute(intent:Intent):Promise<Result<Receipt>|null>{
  if(lock.current)return null;lock.current=true;setBusy(true);setIssue(null);
  try{
   const result=intent.kind==="lesson"?await completeLesson(intent.request):intent.kind==="start"?await startQuizAttempt(intent.request):intent.kind==="draft"?await saveQuizDraft(intent.request):await submitQuizAttempt(intent.request);
   if(!result.ok){setIssue(result.error);setRetryIntent(result.error.retryable?intent:null);return result}
   setRetryIntent(null);
   queryClient.setQueryData<LearningProgress>(key,current=>current&&current.revision>result.data.progress.revision?current:result.data.progress);
   if(result.data.replayed){const refreshed=await query.refetch();if(refreshed.isError)setIssue({...unavailable,message:"The action was already saved, but learning progress could not be refreshed. Reload before continuing."})}
   return result;
  }catch{setIssue(unavailable);setRetryIntent(intent);return{ok:false,error:unavailable}}
  finally{lock.current=false;setBusy(false)}
 }
 async function reload(){if(lock.current)return false;setRetryIntent(null);const result=await query.refetch();if(!result.isError)setIssue(null);return !result.isError}
 const revision=query.data?.revision;
 return{progress:query.data??null,loading:query.isPending,refreshing:query.isFetching,busy,error:issue??query.error,retryIntent,blocked:busy||query.isFetching||!!retryIntent||!!issue||!!query.error||!query.data,reload,
  retry:()=>retryIntent?execute(retryIntent):Promise.resolve(null),
  complete:(lessonId:string)=>revision===undefined?Promise.resolve(null):execute({kind:"lesson",request:{lessonId,expectedRevision:revision}}),
  start:(quizId:string)=>revision===undefined?Promise.resolve(null):execute({kind:"start",request:{quizId,requestId:crypto.randomUUID(),expectedRevision:revision}}),
  save:(request:Omit<SaveQuizDraftRequest,"expectedRevision">)=>revision===undefined?Promise.resolve(null):execute({kind:"draft",request:{...request,answers:[...request.answers],expectedRevision:revision}}),
  submit:(request:Omit<SubmitQuizRequest,"expectedRevision">)=>revision===undefined?Promise.resolve(null):execute({kind:"submit",request:{...request,answers:[...request.answers],expectedRevision:revision}}),
 };
}
export type LearningController=ReturnType<typeof useLearningProgress>;
