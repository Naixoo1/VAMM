// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {MarketWorkspace} from "@/components/features/market-workspace";
import {getMarketData} from "@/lib/data/fixtures";

let client:QueryClient;
const registered=class extends HTMLElement {};
beforeEach(()=>{
 vi.stubGlobal("customElements",{get:()=>registered,whenDefined:()=>Promise.resolve(registered)});
 vi.stubGlobal("ResizeObserver",class {observe(){} unobserve(){} disconnect(){}});
 vi.spyOn(HTMLElement.prototype,"getBoundingClientRect").mockReturnValue({width:800,height:250,x:0,y:0,top:0,right:800,bottom:250,left:0,toJSON:()=>({})});
 vi.stubGlobal("fetch",vi.fn().mockResolvedValue({json:async()=>({ok:true,data:getMarketData()})}));
});
afterEach(()=>{
 cleanup();client.clear();vi.unstubAllGlobals();
 document.querySelectorAll('script[data-vamm-tradingview-module]').forEach(script=>script.remove());
});
function renderWorkspace(){
 client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 return render(<QueryClientProvider client={client}><MarketWorkspace/></QueryClientProvider>);
}
const learningTab=()=>screen.getByRole("tab",{name:"Original Chart for Learning"});
const tradingTab=()=>screen.getByRole("tab",{name:"TradingView Chart"});

describe("Market Practice Workspace",()=>{
 it("defaults to TradingView and keeps its connected provider state across tab changes",async()=>{
  const user=userEvent.setup();renderWorkspace();
  expect(screen.getByRole("tablist",{name:"Practice Workspace"})).toBeInTheDocument();
  expect(tradingTab()).toHaveAttribute("aria-selected","true");
  expect(learningTab()).toHaveAttribute("aria-selected","false");
  const widget=screen.getByLabelText("TradingView Advanced Chart");
  expect(widget).toHaveAttribute("symbol","NASDAQ:AAPL");
  expect(widget).toHaveAttribute("interval","1D");
  expect(widget).toHaveAttribute("theme","dark");
  expect(widget).toHaveAttribute("allow-symbol-change");
  fireEvent(widget,new CustomEvent("tv-widget-ready"));
  expect(screen.getByRole("status")).toHaveTextContent("Chart loaded by TradingView.");
  await user.click(learningTab());
  expect(widget.isConnected).toBe(true);
  expect(widget).not.toBeVisible();
  await user.click(tradingTab());
  expect(screen.getByLabelText("TradingView Advanced Chart")).toBe(widget);
  expect(widget).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent("Chart loaded by TradingView.");
 });
 it("supports arrows, Home, End, and focused tab panels",async()=>{
  const user=userEvent.setup();renderWorkspace();await user.click(tradingTab());
  await user.keyboard("{ArrowRight}");
  expect(learningTab()).toHaveFocus();expect(learningTab()).toHaveAttribute("aria-selected","true");
  await user.keyboard("{ArrowLeft}");
  expect(tradingTab()).toHaveFocus();expect(tradingTab()).toHaveAttribute("aria-selected","true");
  await user.keyboard("{End}");
  expect(learningTab()).toHaveFocus();expect(learningTab()).toHaveAttribute("aria-selected","true");
  await user.tab();
  expect(screen.getByRole("tabpanel",{name:"Original Chart for Learning"})).toHaveFocus();
  await user.tab({shift:true});await user.keyboard("{Home}");
  expect(tradingTab()).toHaveFocus();expect(tradingTab()).toHaveAttribute("aria-selected","true");
 });
 it("shows every frozen instrument and the unchanged index data with synthetic provenance",async()=>{
  const user=userEvent.setup();renderWorkspace();await user.click(learningTab());
  const instruments=await screen.findByRole("list",{name:"Available educational instruments"});
  expect(within(instruments).getAllByRole("listitem").map(item=>item.textContent)).toEqual([
   "Simulated cash","Simulated bond basket","Simulated diversified equity basket",
  ]);
  expect(screen.getByRole("img",{name:"Synthetic index chart. All baskets start at 100. The data table follows."})).toBeVisible();
  await user.click(screen.getByText("View index values as a table"));
  const table=screen.getByRole("table",{name:"Synthetic index, base 100; values shown to two decimals"});
  expect(within(table).getAllByRole("row")).toHaveLength(5);
  for(const name of ["2023-11-06 100.00 100.00 100.00","2024-11-06 100.00 104.00 108.00","2025-11-06 100.00 107.12 95.04","2026-11-06 100.00 112.48 104.54"]){
   expect(within(table).getByRole("row",{name})).toBeVisible();
  }
  const source=screen.getByText(/Synthetic teaching data · IDR · 6 Nov 2026/);
  expect(source).toHaveTextContent("vamm-demo-2026-11-06.v1");
  expect(source).toHaveTextContent("VAMM synthetic teaching methodology");
  expect(screen.getByText(/Authored teaching assumptions, not forecasts or external market observations/)).toBeVisible();
 });
 it("shows a visible loading state while the educational data is pending",async()=>{
  vi.mocked(fetch).mockImplementation(()=>new Promise(()=>{}));
  const user=userEvent.setup();renderWorkspace();await user.click(learningTab());
  expect(screen.getByRole("status")).toHaveTextContent("Loading the original learning chart…");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
 });
 it("exposes data errors and retries without replacing TradingView",async()=>{
  vi.mocked(fetch).mockResolvedValueOnce({json:async()=>({ok:false,error:{message:"Educational data is unavailable."}})} as Response);
  const user=userEvent.setup();renderWorkspace();const widget=screen.getByLabelText("TradingView Advanced Chart");
  await user.click(learningTab());
  expect(await screen.findByRole("alert")).toHaveTextContent("Educational data is unavailable.");
  await user.click(screen.getByRole("button",{name:"Try again"}));
  expect(await screen.findByRole("list",{name:"Available educational instruments"})).toBeVisible();
  expect(widget.isConnected).toBe(true);
 });
 it("labels an empty educational dataset instead of drawing an empty chart",async()=>{
  vi.mocked(fetch).mockResolvedValue({json:async()=>({ok:true,data:{contractVersion:2,instruments:[],chartSeries:[],evidence:[]}})} as Response);
  const user=userEvent.setup();renderWorkspace();await user.click(learningTab());
  expect(await screen.findByRole("status")).toHaveTextContent("No educational chart data is available.");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
 });
});
