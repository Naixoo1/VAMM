// @vitest-environment jsdom
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {act,cleanup,render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import type {ErrorResponse,Result,SessionBundle} from "@/contracts";
import {getSession} from "@/lib/simulation/gateway";
import {PreservedHistory,PreservedSession} from "@/components/features/simulation-history";
vi.mock("@/lib/simulation/gateway",()=>({getSession:vi.fn()}));

const error:ErrorResponse={code:"STORAGE_UNAVAILABLE",message:"Saved history could not be read.",retryable:true,requestId:null};
const saved:SessionBundle={session:{id:"old-session",contractVersion:2,version:0,phase:"ready",turnIndex:0,age:15,balances:{cash:0,bonds:0,equity:0},cumulativeInflationIndex:1,pendingShock:null,scenarioSequenceId:"student-15-18.v1",datasetVersion:"vamm-demo-2026-11-06.v1",calculationVersion:"vamm-calc.v1"},turns:[]};
afterEach(()=>cleanup());
beforeEach(()=>vi.resetAllMocks());
it("shows discovery errors without replacing previously discovered history",()=>{
 const client=new QueryClient();render(<QueryClientProvider client={client}><PreservedHistory sessions={[saved]} loading={false} error={error} onReload={vi.fn()}/></QueryClientProvider>);
 expect(screen.getByRole("alert").textContent).toContain(error.message);expect(screen.getByText("View preserved session 1 · 0 recorded turns")).toBeTruthy();expect(screen.getByRole("button",{name:"Reload preserved sessions"})).toBeTruthy();
});
it("retains the keyboard retry control through loading and an empty successful result",async()=>{
 const user=userEvent.setup();const reload=vi.fn();const client=new QueryClient();
 function View({loading,issue}:{loading:boolean;issue:ErrorResponse|null}){return <QueryClientProvider client={client}><PreservedHistory sessions={[]} loading={loading} error={issue} onReload={reload}/></QueryClientProvider>}
 const view=render(<View loading={false} issue={error}/>);const button=screen.getByRole("button",{name:"Reload preserved sessions"});button.focus();await user.keyboard("{Enter}");expect(reload).toHaveBeenCalledTimes(1);
 view.rerender(<View loading={true} issue={null}/>);expect(screen.getByRole("button",{name:"Loading saved sessions…"})).toBe(button);expect(button.getAttribute("aria-disabled")).toBe("true");expect(document.activeElement).toBe(button);await user.keyboard("{Enter}");expect(reload).toHaveBeenCalledTimes(1);
 view.rerender(<View loading={false} issue={null}/>);expect(screen.getByRole("button",{name:"Refresh sessions"})).toBe(button);expect(document.activeElement).toBe(button);expect(screen.getByText("There are no previous sessions for this browser profile.")).toBeTruthy();
});
it("retains the inner saved-session retry through a successful history read",async()=>{
 let finish!:(result:Result<SessionBundle>)=>void;const user=userEvent.setup();const client=new QueryClient();
 vi.mocked(getSession).mockResolvedValueOnce({ok:false,error}).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve}));
 render(<QueryClientProvider client={client}><PreservedSession snapshot={saved} index={0}/></QueryClientProvider>);await user.click(screen.getByText("View preserved session 1 · 0 recorded turns"));
 const button=await screen.findByRole("button",{name:"Reload preserved history"});button.focus();await user.keyboard("{Enter}");expect(screen.getByRole("button",{name:"Loading preserved history…"})).toBe(button);expect(document.activeElement).toBe(button);expect(button.getAttribute("aria-disabled")).toBe("true");await user.keyboard("{Enter}");expect(getSession).toHaveBeenCalledTimes(2);
 await act(async()=>{finish({ok:true,data:saved})});expect(await screen.findByRole("button",{name:"Refresh preserved history"})).toBe(button);expect(document.activeElement).toBe(button);expect(screen.getByText("Previous session · retained on this device")).toBeTruthy();
});
