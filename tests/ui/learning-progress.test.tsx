// @vitest-environment jsdom
import {StrictMode,type ReactNode} from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,renderHook,waitFor} from "@testing-library/react";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import type {ErrorResponse,Result} from "@/contracts";
import type {LearningMutationResult,LearningProgress} from "@/lib/learning/types";
import {completeLesson,readLearningProgress,saveQuizDraft,startQuizAttempt,submitQuizAttempt} from "@/lib/learning/progress";
import {useLearningProgress} from "@/hooks/use-learning-progress";
vi.mock("@/lib/learning/progress",()=>({completeLesson:vi.fn(),readLearningProgress:vi.fn(),saveQuizDraft:vi.fn(),startQuizAttempt:vi.fn(),submitQuizAttempt:vi.fn()}));
const unavailable:ErrorResponse={code:"STORAGE_UNAVAILABLE",message:"Learning storage unavailable.",retryable:true,requestId:null};
function progress(revision=0):LearningProgress{return{schemaVersion:1,catalogVersion:"vamm-learning-2026-11-07.v1",revision,completedLessonIds:[],attempts:[],activeAttemptIds:{"stocks-101":null,"risk-and-return":null,"facts-and-news":null}}}
function setup(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});const wrapper=({children}:{children:ReactNode})=><StrictMode><QueryClientProvider client={client}>{children}</QueryClientProvider></StrictMode>;return{...renderHook(()=>useLearningProgress(),{wrapper}),client}}
beforeEach(()=>{vi.resetAllMocks();vi.mocked(readLearningProgress).mockResolvedValue({ok:true,data:progress()})});
afterEach(()=>cleanup());
describe("Learning UI persistence intents",()=>{
 it("never substitutes a blank progress record or starts a mutation after a corrupt read",async()=>{
  vi.mocked(readLearningProgress).mockResolvedValue({ok:false,error:unavailable});const{result}=setup();await waitFor(()=>expect(result.current.error?.code).toBe("STORAGE_UNAVAILABLE"));expect(result.current.progress).toBeNull();expect(result.current.blocked).toBe(true);expect(startQuizAttempt).not.toHaveBeenCalled();expect(completeLesson).not.toHaveBeenCalled();expect(saveQuizDraft).not.toHaveBeenCalled();expect(submitQuizAttempt).not.toHaveBeenCalled();
 });
 it("serializes duplicate start clicks and retries the same start request and UUID",async()=>{
  let finish!:(result:Result<LearningMutationResult>)=>void;vi.mocked(startQuizAttempt).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockResolvedValue({ok:true,data:{progress:progress(1),replayed:false}});
  const{result}=setup();await waitFor(()=>expect(result.current.progress).not.toBeNull());let first!:ReturnType<typeof result.current.start>;
  act(()=>{first=result.current.start("stocks-101")});await act(async()=>{expect(await result.current.start("stocks-101")).toBeNull()});expect(startQuizAttempt).toHaveBeenCalledTimes(1);await act(async()=>{finish({ok:false,error:unavailable});await first});await waitFor(()=>expect(result.current.retryIntent?.kind).toBe("start"));
  await act(async()=>{await result.current.retry()});expect(startQuizAttempt).toHaveBeenCalledTimes(2);expect(vi.mocked(startQuizAttempt).mock.calls[1][0]).toBe(vi.mocked(startQuizAttempt).mock.calls[0][0]);expect(vi.mocked(startQuizAttempt).mock.calls[0][0].requestId).toBeTruthy();await waitFor(()=>expect(result.current.progress?.revision).toBe(1));
 });
 it("retains the exact draft snapshot and revision for transient save retries",async()=>{
  vi.mocked(saveQuizDraft).mockResolvedValue({ok:false,error:unavailable});const{result}=setup();await waitFor(()=>expect(result.current.progress).not.toBeNull());const answers=[1,null,null,null,null];await act(async()=>{await result.current.save({quizId:"stocks-101",attemptId:"saved-attempt",answers,activeIndex:1})});answers[0]=2;await act(async()=>{await result.current.retry()});expect(saveQuizDraft).toHaveBeenCalledTimes(2);const requests=vi.mocked(saveQuizDraft).mock.calls;expect(requests[1][0]).toBe(requests[0][0]);expect(requests[1][0].answers[0]).toBe(1);expect(requests[1][0].expectedRevision).toBe(0);
 });
 it("does not regress cached progress when a replay returns an older snapshot",async()=>{
  vi.mocked(readLearningProgress).mockResolvedValue({ok:true,data:progress(5)});vi.mocked(completeLesson).mockResolvedValue({ok:true,data:{progress:progress(2),replayed:true}});const{result,client}=setup();await waitFor(()=>expect(result.current.progress?.revision).toBe(5));let finish!:(result:Result<LearningProgress>)=>void;vi.mocked(readLearningProgress).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));let request!:ReturnType<typeof result.current.complete>;act(()=>{request=result.current.complete("stocks")});await waitFor(()=>expect(typeof finish).toBe("function"));expect(client.getQueryData<LearningProgress>(["vamm-learning-progress"])?.revision).toBe(5);await act(async()=>{finish({ok:true,data:progress(5)});await request});expect(result.current.progress?.revision).toBe(5);
 });
});
