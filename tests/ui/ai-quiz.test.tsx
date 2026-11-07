// @vitest-environment jsdom
import {type ReactNode} from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen,waitFor,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {AiQuizPractice} from "@/components/learning/ai-quiz";
const fetchMock=vi.fn<typeof fetch>();const clients:QueryClient[]=[];
const quiz={topic:"stocks",origin:"model",questions:[1,2,3].map((number,index)=>({id:`q${number}`,question:`Practice question ${number}?`,choices:[`First ${number}`,`Second ${number}`,`Third ${number}`,`Fourth ${number}`],correctIndex:index,explanation:`Explanation ${number}.`}))};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json"}});
const posts=()=>fetchMock.mock.calls.filter(([,options])=>options?.method==="POST");
function mount(){const client=new QueryClient({defaultOptions:{queries:{retry:false}}});clients.push(client);return{client,...render(<AiQuizPractice/>,{wrapper:({children}:{children:ReactNode})=><QueryClientProvider client={client}>{children}</QueryClientProvider>})}}
async function generate(){const button=screen.getByRole("button",{name:"Generate 3 questions"});await waitFor(()=>expect(button.getAttribute("aria-disabled")).toBe("false"));await userEvent.click(button);return button}
beforeEach(()=>{fetchMock.mockReset();fetchMock.mockImplementation(async(_url,options)=>json(options?.method==="POST"?{ok:true,data:quiz}:{configured:true}));vi.stubGlobal("fetch",fetchMock)});
afterEach(()=>{cleanup();clients.splice(0).forEach(client=>client.clear());vi.unstubAllGlobals()});
describe("Optional generated quiz practice",()=>{
 it("checks availability without automatically generating and keeps the unavailable state honest",async()=>{
  fetchMock.mockImplementation(async()=>json({configured:false}));mount();expect(await screen.findByText(/reviewed quiz challenges below remain available/)).toBeTruthy();const button=screen.getByRole("button",{name:"Generate 3 questions"});expect(button.getAttribute("aria-disabled")).toBe("true");await userEvent.click(button);expect(posts()).toHaveLength(0);expect(screen.getByText(/awards no XP, saves no attempt history/)).toBeTruthy();
 });
 it("guards pending duplicates and sends only the selected topic",async()=>{
  let finish!:(response:Response)=>void;fetchMock.mockImplementation(async(_url,options)=>options?.method==="POST"?new Promise(resolve=>{finish=resolve}):json({configured:true}));mount();await userEvent.selectOptions(screen.getByRole("combobox",{name:"AI quiz topic"}),"risk");const button=await generate();await waitFor(()=>expect(button.getAttribute("aria-disabled")).toBe("true"));await userEvent.click(button);expect(posts()).toHaveLength(1);expect(JSON.parse(String(posts()[0][1]?.body))).toEqual({topic:"risk"});finish(json({ok:true,data:{...quiz,topic:"risk"}}));await screen.findByRole("form",{name:"AI-generated practice questions"});expect(posts()).toHaveLength(1);
 });
 it("scores answers deterministically, reveals explanations after submit and repeats without an API call",async()=>{
  const{client}=mount();client.setQueryData(["vamm-learning-progress"],{xp:100,completedLessonIds:["stocks"]});await generate();const form=await screen.findByRole("form",{name:"AI-generated practice questions"});expect(screen.queryByText("Explanation 1.")).toBeNull();await userEvent.click(within(form).getByRole("radio",{name:"First 1"}));await userEvent.click(within(form).getByRole("radio",{name:"Second 2"}));await userEvent.click(within(form).getByRole("radio",{name:"First 3"}));await userEvent.click(within(form).getByRole("button",{name:"Submit AI answers"}));expect(screen.getByText("Score: 2/3 · 67%")).toBeTruthy();expect(screen.getByText("Explanation 3.")).toBeTruthy();await userEvent.click(screen.getByRole("button",{name:"Try these questions again"}));expect(screen.queryByText("Explanation 1.")).toBeNull();expect(posts()).toHaveLength(1);expect(client.getQueryData(["vamm-learning-progress"])).toEqual({xp:100,completedLessonIds:["stocks"]});
 });
 it("shows fixed rejected-credential guidance while preserving current questions, answers and topic",async()=>{
  mount();await generate();await screen.findByRole("form",{name:"AI-generated practice questions"});await userEvent.click(screen.getByRole("radio",{name:"First 1"}));await userEvent.selectOptions(screen.getByRole("combobox",{name:"AI quiz topic"}),"news");fetchMock.mockImplementation(async(_url,options)=>options?.method==="POST"?json({ok:false,error:{code:"MODEL_AUTH_FAILED",message:"raw provider credential detail"}},502):json({configured:true}));await generate();expect(await screen.findByText(/configured model credentials were rejected/)).toBeTruthy();expect((screen.getByRole("radio",{name:"First 1"}) as HTMLInputElement).checked).toBe(true);expect((screen.getByRole("combobox",{name:"AI quiz topic"}) as HTMLSelectElement).value).toBe("news");expect(document.body.textContent).not.toContain("raw provider credential detail");expect(posts()).toHaveLength(2);
 });
 it("rejects malformed generated output instead of presenting or replacing questions",async()=>{
  fetchMock.mockImplementation(async(_url,options)=>json(options?.method==="POST"?{ok:true,data:{...quiz,questions:quiz.questions.slice(0,2)}}:{configured:true}));mount();await generate();expect(await screen.findByText(/generated questions could not be validated/)).toBeTruthy();expect(screen.queryByRole("form",{name:"AI-generated practice questions"})).toBeNull();expect(posts()).toHaveLength(1);
 });
});
