// @vitest-environment jsdom
import {StrictMode} from "react";
import {renderToString} from "react-dom/server";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {TradingViewChart,TRADINGVIEW_LOAD_TIMEOUT_MS,TRADINGVIEW_MODULE_URL} from "@/components/features/tradingview-chart";

const tag="tv-advanced-chart";
const registered=class extends HTMLElement {};
beforeEach(()=>{vi.stubGlobal("customElements",{get:()=>registered,whenDefined:()=>Promise.resolve(registered)})});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();document.querySelectorAll('script[data-vamm-tradingview-module]').forEach(script=>script.remove())});
const widget=()=>document.querySelector(tag)!;
describe("TradingView Web Component boundary",()=>{
 it("uses the exact ES module once under StrictMode and exposes a blocked-module fallback",async()=>{
  vi.stubGlobal("customElements",{get:()=>undefined,whenDefined:()=>new Promise(()=>{})});
  const mounted=render(<StrictMode><TradingViewChart/><TradingViewChart variant="dashboard"/></StrictMode>);
  const scripts=Array.from(document.scripts).filter(script=>script.src===TRADINGVIEW_MODULE_URL);
  expect(scripts).toHaveLength(1);expect(scripts[0].type).toBe("module");
  expect(document.querySelectorAll(tag)).toHaveLength(2);
  for(const item of document.querySelectorAll(tag)){expect(item.getAttribute("symbol")).toBe("NASDAQ:AAPL");expect(item.getAttribute("interval")).toBe("1D");expect(item.getAttribute("theme")).toBe("dark");expect(item.hasAttribute("allow-symbol-change")).toBe(true)}
  fireEvent.load(scripts[0]);expect(screen.getAllByRole("status").every(item=>item.textContent?.includes("Loading TradingView chart"))).toBe(true);
  await act(async()=>{fireEvent.error(scripts[0]);await Promise.resolve()});
  expect(screen.getAllByRole("alert")).toHaveLength(2);expect(screen.getAllByRole("button",{name:"Reload page"})).toHaveLength(2);
  expect(screen.getAllByRole("link",{name:"Open on TradingView"})[0].getAttribute("href")).toContain("NASDAQ%3AAAPL");
  mounted.unmount();expect(document.querySelector(tag)).toBeNull();expect(scripts[0].isConnected).toBe(true);
 });
 it("never reports ready merely because the definition exists",async()=>{
  render(<TradingViewChart/>);await act(async()=>{await Promise.resolve()});
  expect(screen.getByRole("status").textContent).toBe("Loading TradingView chart…");
  expect(screen.queryByText("Chart loaded by TradingView.")).toBeNull();
 });
 it("accepts only the host lifecycle event and sanitizes provider errors",async()=>{
  render(<TradingViewChart/>);await act(async()=>{await Promise.resolve()});
  const hostWidget=widget();const child=document.createElement("span");hostWidget.append(child);
  fireEvent(child,new CustomEvent("tv-widget-ready",{bubbles:true,composed:true}));
  expect(screen.getByRole("status").textContent).toBe("Loading TradingView chart…");
  fireEvent(hostWidget,new CustomEvent("tv-widget-ready",{bubbles:true,composed:true}));
  expect(screen.getByRole("status").textContent).toBe("Chart loaded by TradingView.");
  fireEvent(hostWidget,new CustomEvent("tv-widget-error",{bubbles:true,composed:true,detail:{reason:"UNTRUSTED_PROVIDER_DETAILS"}}));
  expect(screen.getByRole("alert").textContent).toBe("TradingView couldn’t load this chart here.");expect(screen.queryByText(/UNTRUSTED_PROVIDER_DETAILS/)).toBeNull();
 });
 it("retries a registered chart by replacing only its own element",async()=>{
  render(<TradingViewChart/>);await act(async()=>{await Promise.resolve()});
  const previous=widget();const before=document.scripts.length;
  fireEvent(previous,new CustomEvent("tv-widget-error",{bubbles:true,composed:true}));
  fireEvent.click(screen.getByRole("button",{name:"Retry chart"}));
  expect(widget()).not.toBe(previous);expect(previous.isConnected).toBe(false);expect(document.querySelectorAll(tag)).toHaveLength(1);expect(document.scripts.length).toBe(before);
  expect(screen.getByRole("status").textContent).toBe("Loading TradingView chart…");
 });
 it("shows an actionable fallback when the provider never emits ready",async()=>{
  vi.useFakeTimers();render(<TradingViewChart/>);
  await act(async()=>{await Promise.resolve();vi.advanceTimersByTime(TRADINGVIEW_LOAD_TIMEOUT_MS)});
  expect(screen.getByRole("alert").textContent).toBe("TradingView couldn’t load this chart here.");
  const region=screen.getByRole("region",{name:"TradingView market chart"});expect(within(region).getByRole("link",{name:"Open on TradingView"})).toBeTruthy();expect(within(region).getByRole("button",{name:"Retry chart"})).toBeTruthy();
 });
 it("renders a stable server placeholder without registering browser elements",()=>{
  const before=document.scripts.length;const html=renderToString(<TradingViewChart/>);
  expect(html).toContain("Loading TradingView chart");expect(html).not.toContain("<tv-advanced-chart");expect(html).not.toContain("<script");expect(document.scripts.length).toBe(before);
 });
});
