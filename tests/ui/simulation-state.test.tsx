// @vitest-environment jsdom
import {StrictMode,type ReactNode} from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,renderHook,waitFor} from "@testing-library/react";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import type {ErrorResponse,SessionBundle} from "@/contracts";
import {applyAction,createSession,getActiveSession} from "@/lib/simulation/gateway";
import {listPreservedSessions} from "@/lib/simulation/history";
import {useSimulation} from "@/hooks/use-simulation";
vi.mock("@/lib/simulation/gateway",()=>({applyAction:vi.fn(),createSession:vi.fn(),getActiveSession:vi.fn()}));
vi.mock("@/lib/simulation/history",()=>({listPreservedSessions:vi.fn()}));
function session(id="session-original",version=0):SessionBundle{return{session:{id,contractVersion:2,version,phase:"ready",turnIndex:0,age:15,balances:{cash:0,bonds:0,equity:0},cumulativeInflationIndex:1,pendingShock:null,scenarioSequenceId:"student-15-18.v1",datasetVersion:"vamm-demo-2026-11-06.v1",calculationVersion:"vamm-calc.v1"},turns:[]}}
const transient:ErrorResponse={code:"STORAGE_UNAVAILABLE",message:"Storage temporarily unavailable",retryable:true,requestId:null};
let current:SessionBundle|null;
let saved:SessionBundle[];
function setup(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});const wrapper=({children}:{children:ReactNode})=><StrictMode><QueryClientProvider client={client}>{children}</QueryClientProvider></StrictMode>;return{...renderHook(()=>useSimulation(),{wrapper}),client}}
beforeEach(()=>{
 vi.clearAllMocks();current=session();saved=[];
 vi.mocked(getActiveSession).mockImplementation(async()=>({ok:true,data:current}));
 vi.mocked(listPreservedSessions).mockImplementation(async()=>({ok:true,data:saved.filter(item=>item.session.id!==current?.session.id)}));
 vi.mocked(createSession).mockImplementation(async()=>{if(current)saved.push(current);current=session("session-new");return{ok:true,data:current}});
});
afterEach(()=>cleanup());
describe("Simulation request safety and durable history discovery",()=>{
 it("restores without creating a session during StrictMode bootstrap",async()=>{const{result}=setup();await waitFor(()=>expect(result.current.loading).toBe(false));expect(result.current.bundle?.session.id).toBe("session-original");expect(createSession).not.toHaveBeenCalled()});
 it("reuses the exact mutation request after a transient failure",async()=>{vi.mocked(applyAction).mockResolvedValue({ok:false,error:transient});const{result}=setup();await waitFor(()=>expect(result.current.bundle).not.toBeNull());await act(async()=>{await result.current.advance(5000,{cash:3000,bonds:3000,equity:4000})});expect(result.current.retryIntent).not.toBeNull();await act(async()=>{await result.current.retry()});expect(applyAction).toHaveBeenCalledTimes(2);expect(vi.mocked(applyAction).mock.calls[1][0]).toBe(vi.mocked(applyAction).mock.calls[0][0])});
 it("reloads a conflicting version and history without resubmitting the stale action",async()=>{
  vi.mocked(applyAction).mockImplementation(async()=>{current=session("session-original",7);saved=[session("older-session")];return{ok:false,error:{code:"STATE_CONFLICT",message:"Another action changed this session.",retryable:false,requestId:null}}});
  const{result}=setup();await waitFor(()=>expect(result.current.bundle).not.toBeNull());await act(async()=>{await result.current.advance(5000,{cash:3000,bonds:3000,equity:4000})});await waitFor(()=>expect(result.current.bundle?.session.version).toBe(7));expect(result.current.preserved[0].session.id).toBe("older-session");expect(result.current.retryIntent).toBeNull();expect(applyAction).toHaveBeenCalledTimes(1);
 });
 it("discovers previous history after reset with an entirely fresh QueryClient",async()=>{
  const first=setup();await waitFor(()=>expect(first.result.current.bundle).not.toBeNull());await act(async()=>{await first.result.current.create()});expect(createSession).toHaveBeenCalledTimes(1);expect(vi.mocked(createSession).mock.calls[0][0].requestId).toBeTruthy();expect(first.result.current.bundle?.session.id).toBe("session-new");expect(first.result.current.preserved.map(item=>item.session.id)).toEqual(["session-original"]);
  first.unmount();first.client.clear();
  const reloaded=setup();expect(reloaded.client).not.toBe(first.client);await waitFor(()=>expect(reloaded.result.current.preserved).toHaveLength(1));expect(reloaded.result.current.bundle?.session.id).toBe("session-new");expect(reloaded.result.current.preserved[0].session.id).toBe("session-original");expect(createSession).toHaveBeenCalledTimes(1);
 });
 it("keeps the current session when reset storage fails and retries the same create request",async()=>{vi.mocked(createSession).mockResolvedValue({ok:false,error:transient});const{result}=setup();await waitFor(()=>expect(result.current.bundle).not.toBeNull());await act(async()=>{await result.current.create()});expect(result.current.bundle?.session.id).toBe("session-original");expect(result.current.preserved).toHaveLength(0);await act(async()=>{await result.current.retry()});expect(vi.mocked(createSession).mock.calls[1][0]).toBe(vi.mocked(createSession).mock.calls[0][0])});
 it("exposes discovery failure and can reload history without creating or mutating",async()=>{
  vi.mocked(listPreservedSessions).mockResolvedValue({ok:false,error:transient});const{result}=setup();await waitFor(()=>expect(result.current.preservedError?.code).toBe("STORAGE_UNAVAILABLE"));expect(result.current.bundle?.session.id).toBe("session-original");
  vi.mocked(listPreservedSessions).mockResolvedValue({ok:true,data:[session("older-session")]});await act(async()=>{const refreshed=await result.current.reloadHistory();expect(refreshed.isError).toBe(false);expect(refreshed.data?.[0].session.id).toBe("older-session")});
  // Refetch resolves before TanStack's scheduled React observer notification.
  await waitFor(()=>{expect(result.current.preservedError).toBeNull();expect(result.current.preserved[0].session.id).toBe("older-session")});expect(createSession).not.toHaveBeenCalled();expect(applyAction).not.toHaveBeenCalled();
 });
 it("reloads the active pointer and discovery after another tab creates a session",async()=>{
  const{result}=setup();await waitFor(()=>expect(result.current.bundle?.session.id).toBe("session-original"));saved=[session("session-original")];current=session("other-tab-session");await act(async()=>{await result.current.reconcile()});expect(result.current.bundle?.session.id).toBe("other-tab-session");expect(result.current.preserved.map(item=>item.session.id)).toEqual(["session-original"]);expect(createSession).not.toHaveBeenCalled();expect(applyAction).not.toHaveBeenCalled();
 });
});
