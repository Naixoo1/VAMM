// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";

import ResearchPage from "@/app/research/page";
vi.mock("@/hooks/use-api-data",async()=>{const {getMarketData}=await import("@/lib/data/fixtures");return{useMarketData:()=>({data:getMarketData(),error:null,loading:false,reload:vi.fn()})}});
function renderMentor(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});return render(<QueryClientProvider client={client}><ResearchPage/></QueryClientProvider>)}
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
beforeEach(()=>{vi.stubGlobal("fetch",vi.fn().mockResolvedValue({json:async()=>({ok:true,data:{summary:"Synthetic teaching explanation.",facts:[],limitations:["Teaching assumptions, not forecasts."],evidence:[],origin:"prewritten"}})}))});
describe("Mentor request boundaries",()=>{
 it("puts a suggested prompt into the existing field and submits the unchanged research shape",async()=>{
  renderMentor();const prompt="Compare the modeled changes of these educational baskets.";
  fireEvent.click(screen.getByRole("button",{name:new RegExp(prompt.replace(".","\\."))}));
  expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe(prompt);
  fireEvent.click(screen.getByRole("button",{name:"Ask your mentor"}));
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(1));
  const [url,options]=vi.mocked(fetch).mock.calls[0];
  expect(url).toBe("/api/research");expect(JSON.parse(String(options?.body))).toEqual({instrumentIds:["edu-bonds","edu-equity"],question:prompt});
  expect(await screen.findByText("Prewritten fallback")).toBeTruthy();
 });
 it("limits selection to two baskets and prevents an empty instrument request",()=>{
  renderMentor();const cash=screen.getByLabelText("Simulated cash") as HTMLInputElement;
  expect(cash.disabled).toBe(true);
  fireEvent.click(screen.getByLabelText("Simulated bond basket"));
  expect(cash.disabled).toBe(false);
  fireEvent.click(screen.getByLabelText("Simulated diversified equity basket"));
  fireEvent.change(screen.getByLabelText("Your question"),{target:{value:"Explain these baskets"}});
  expect((screen.getByRole("button",{name:"Ask your mentor"}) as HTMLButtonElement).disabled).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
 });
 it("shows a network error and never retries research automatically",async()=>{
  vi.mocked(fetch).mockRejectedValue(new Error("Research connection failed"));
  renderMentor();fireEvent.change(screen.getByLabelText("Your question"),{target:{value:"Explain the teaching assumptions"}});fireEvent.click(screen.getByRole("button",{name:"Ask your mentor"}));
  expect(await screen.findByRole("alert")).toBeTruthy();expect(screen.getByText("Research connection failed")).toBeTruthy();expect(fetch).toHaveBeenCalledTimes(1);
 });
});

