// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {ErrorResponse} from "@/contracts";
import type {LearningProgress} from "@/lib/learning/types";
import {QUIZ_PACKS} from "@/lib/learning/catalog";
import {useLearningProgress,type LearningController} from "@/hooks/use-learning-progress";
import {LearningStatus} from "@/components/learning/shared";
import {MissionsWorkspace} from "@/components/learning/missions";
import {AcademyWorkspace} from "@/components/learning/academy";
vi.mock("@/hooks/use-learning-progress",()=>({useLearningProgress:vi.fn()}));
// Independent generated practice has its own query/provider tests; these cases exercise reviewed learning state.
vi.mock("@/components/learning/ai-quiz",()=>({AiQuizPractice:()=>null}));
let query="";
const push=vi.fn();
vi.mock("next/navigation",()=>({useSearchParams:()=>new URLSearchParams(query),useRouter:()=>({push})}));
const failure:ErrorResponse={code:"STORAGE_UNAVAILABLE",message:"Learning storage is unavailable.",retryable:true,requestId:null};
function progress():LearningProgress{return{schemaVersion:1,catalogVersion:"vamm-learning-2026-11-07.v1",revision:0,completedLessonIds:[],attempts:[],activeAttemptIds:{"stocks-101":null,"risk-and-return":null,"facts-and-news":null}}}
function controller(value=progress()):LearningController{return{progress:value,loading:false,refreshing:false,busy:false,error:null,retryIntent:null,blocked:false,reload:vi.fn().mockResolvedValue(true),retry:vi.fn().mockResolvedValue(null),complete:vi.fn().mockResolvedValue(null),start:vi.fn().mockResolvedValue(null),save:vi.fn().mockResolvedValue(null),submit:vi.fn().mockResolvedValue(null)}}
let current:LearningController;
beforeEach(()=>{vi.clearAllMocks();query="";current=controller();vi.mocked(useLearningProgress).mockImplementation(()=>current)});
afterEach(()=>cleanup());
describe("Learning interface safeguards",()=>{
 it("retains the activated reload control through pending, error clearance and later user focus",async()=>{
  const user=userEvent.setup();current={...current,progress:null,error:failure,blocked:true};
  function View(){return <><LearningStatus learning={current}/><button type="button">Outside target</button></>}
  const view=render(<View/>);const button=screen.getByRole("button",{name:"Reload learning progress"});button.focus();await user.keyboard("{Enter}");expect(current.reload).toHaveBeenCalledTimes(1);
  current={...current,loading:true,refreshing:true,error:null};view.rerender(<View/>);expect(screen.getByRole("button",{name:"Reloading learning progress…"})).toBe(button);expect(screen.getByRole("status").textContent).toContain("Refreshing learning progress…");expect(button.getAttribute("aria-disabled")).toBe("true");expect(document.activeElement).toBe(button);await user.keyboard("{Enter}");expect(current.reload).toHaveBeenCalledTimes(1);
  await user.tab();const later=screen.getByRole("button",{name:"Outside target"});expect(document.activeElement).toBe(later);current={...current,progress:progress(),loading:false,refreshing:false,blocked:false};view.rerender(<View/>);expect(screen.getByRole("button",{name:"Refresh learning progress"})).toBe(button);expect(document.activeElement).toBe(later);
 });
 it("retains unsaved choices read-only when another tab submitted the same active attempt",async()=>{
  const user=userEvent.setup();const pack=QUIZ_PACKS[0];const id="10000000-0000-4000-8000-000000000001";
  query="quiz="+pack.id+"&resume=1";const draft={id,quizId:pack.id,questionIds:pack.questions.map(item=>item.id),answers:pack.questions.map(()=>null),activeIndex:0,status:"draft" as const,startedRevision:1,submittedRevision:null};
  current=controller({...progress(),revision:1,attempts:[draft],activeAttemptIds:{...progress().activeAttemptIds,[pack.id]:id}});
  const view=render(<MissionsWorkspace/>);const chosen=(pack.questions[0].answer+1)%pack.questions[0].choices.length;const radio=screen.getByRole("radio",{name:pack.questions[0].choices[chosen]}) as HTMLInputElement;await user.click(radio);expect(radio.checked).toBe(true);
  current={...current,progress:{...current.progress!,revision:2,attempts:[{...draft,status:"submitted",submittedRevision:2,answers:pack.questions.map(item=>item.answer)}]}};
  view.rerender(<MissionsWorkspace/>);expect(screen.getByRole("alert").textContent).toContain("unsaved choices remain visible here as read-only");expect((screen.getByRole("radio",{name:pack.questions[0].choices[chosen]}) as HTMLInputElement).checked).toBe(true);expect((radio.closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
  const next=screen.getByRole("button",{name:"Next question"});expect(next.getAttribute("aria-disabled")).toBe("true");await user.click(next);expect(current.save).not.toHaveBeenCalled();expect(current.submit).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button",{name:"Review latest result"}));expect(screen.getByTestId("quiz-score").textContent).toBe("100/100");expect(screen.queryByRole("radio")).toBeNull();
 });
 it("keeps query navigation separate from the previous quiz's local runner view",async()=>{
  const user=userEvent.setup();const pack=QUIZ_PACKS[0];query="quiz="+pack.id;const saved={...progress(),revision:1,attempts:[{id:"10000000-0000-4000-8000-000000000001",quizId:pack.id,questionIds:pack.questions.map(item=>item.id),answers:pack.questions.map(()=>null),activeIndex:0,status:"draft" as const,startedRevision:1,submittedRevision:null}],activeAttemptIds:{...progress().activeAttemptIds,[pack.id]:"10000000-0000-4000-8000-000000000001"}};
  current.start=vi.fn().mockImplementation(async()=>{current={...current,progress:saved};return{ok:true,data:{progress:saved,replayed:false}}});const view=render(<MissionsWorkspace/>);await user.click(screen.getByRole("button",{name:"Start quiz"}));expect(await screen.findByRole("group",{name:pack.questions[0].prompt})).toBeTruthy();
  query="";view.rerender(<MissionsWorkspace/>);expect(screen.getByRole("heading",{name:"Quiz Center"})).toBeTruthy();query="quiz="+pack.id;view.rerender(<MissionsWorkspace/>);expect(screen.getByRole("button",{name:"Continue saved quiz"})).toBeTruthy();expect(screen.queryByRole("radio")).toBeNull();
 });
 it("filters lesson content and exposes a recoverable empty search without completing lessons",async()=>{
  const user=userEvent.setup();render(<AcademyWorkspace/>);const search=screen.getByRole("searchbox",{name:"Search lessons"});await user.type(search,"inflation");expect(screen.getByRole("heading",{name:"Long-Term Investing"})).toBeTruthy();expect(screen.queryByRole("heading",{name:"Stock Market Essentials"})).toBeNull();await user.clear(search);await user.type(search,"zzzz-no-lesson");expect(screen.getByText("No lessons match your search.")).toBeTruthy();await user.click(screen.getByRole("button",{name:"Clear lesson search"}));expect(screen.getByRole("heading",{name:"Stock Market Essentials"})).toBeTruthy();expect(current.complete).not.toHaveBeenCalled();
 });
 it("retains the exit dialog's reload control after recovering a read failure",async()=>{
  const previous=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,"showModal");Object.defineProperty(HTMLDialogElement.prototype,"showModal",{configurable:true,value:function(this:HTMLDialogElement){this.setAttribute("open","")}});
  try{
   const user=userEvent.setup();const pack=QUIZ_PACKS[0],id="10000000-0000-4000-8000-000000000001";query="quiz="+pack.id+"&resume=1";
   current={...controller({...progress(),revision:1,attempts:[{id,quizId:pack.id,questionIds:pack.questions.map(item=>item.id),answers:pack.questions.map(()=>null),activeIndex:0,status:"draft",startedRevision:1,submittedRevision:null}],activeAttemptIds:{...progress().activeAttemptIds,[pack.id]:id}}),error:failure,blocked:true};
   const view=render(<MissionsWorkspace/>);await user.click(screen.getByRole("button",{name:"Exit quiz"}));const dialog=screen.getByRole("dialog",{name:"Exit quiz?"});const button=within(dialog).getByRole("button",{name:"Reload learning progress"});button.focus();await user.keyboard("{Enter}");expect(current.reload).toHaveBeenCalledTimes(1);
   current={...current,error:null,loading:true,refreshing:true};view.rerender(<MissionsWorkspace/>);expect(within(dialog).getByRole("button",{name:"Reloading learning progress…"})).toBe(button);expect(document.activeElement).toBe(button);current={...current,loading:false,refreshing:false,blocked:false};view.rerender(<MissionsWorkspace/>);expect(within(dialog).getByRole("button",{name:"Refresh learning progress"})).toBe(button);expect(document.activeElement).toBe(button);
  }finally{if(previous)Object.defineProperty(HTMLDialogElement.prototype,"showModal",previous);else Reflect.deleteProperty(HTMLDialogElement.prototype,"showModal")}
 });
 it("routes the runner's Back action through save/discard confirmation without losing an unsaved answer",async()=>{
  const previous=Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype,"showModal");Object.defineProperty(HTMLDialogElement.prototype,"showModal",{configurable:true,value:function(this:HTMLDialogElement){this.setAttribute("open","")}});
  try{
   const user=userEvent.setup();const pack=QUIZ_PACKS[0],id="10000000-0000-4000-8000-000000000001";query="quiz="+pack.id+"&resume=1";current=controller({...progress(),revision:1,attempts:[{id,quizId:pack.id,questionIds:pack.questions.map(item=>item.id),answers:pack.questions.map(()=>null),activeIndex:0,status:"draft",startedRevision:1,submittedRevision:null}],activeAttemptIds:{...progress().activeAttemptIds,[pack.id]:id}});
   render(<MissionsWorkspace/>);const choice=screen.getByRole("radio",{name:pack.questions[0].choices[0]}) as HTMLInputElement;await user.click(choice);await user.click(screen.getByRole("button",{name:"Back to Quiz Center"}));const dialog=screen.getByRole("dialog",{name:"Exit quiz?"});expect(within(dialog).getByText(/current choices have not all been saved/)).toBeTruthy();expect(choice.checked).toBe(true);expect(push).not.toHaveBeenCalled();expect(current.save).not.toHaveBeenCalled();expect(within(dialog).getByRole("button",{name:"Save and exit"})).toBeTruthy();expect(within(dialog).getByRole("button",{name:"Exit without saving"})).toBeTruthy();
  }finally{if(previous)Object.defineProperty(HTMLDialogElement.prototype,"showModal",previous);else Reflect.deleteProperty(HTMLDialogElement.prototype,"showModal")}
 });
});
