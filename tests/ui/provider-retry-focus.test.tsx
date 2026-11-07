// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {LiveNewsFeed} from "@/components/features/live-news";
import {TradingViewChart} from "@/components/features/tradingview-chart";
import {LiveMarketWidget} from "@/components/features/live-market-widget";

const registered=class extends HTMLElement{};
beforeEach(()=>{
 vi.stubGlobal("customElements",{get:()=>registered,whenDefined:()=>Promise.resolve(registered)});
 vi.spyOn(navigator,"onLine","get").mockReturnValue(true);
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals()});
const cases=[
 {name:"News",view:()=> <LiveNewsFeed/>,tag:"tv-news-feed",retry:"Retry live feed",waiting:"Reconnecting live feed…",refresh:"Refresh live feed"},
 {name:"Advanced Chart",view:()=> <TradingViewChart/>,tag:"tv-advanced-chart",retry:"Retry chart",waiting:"Reconnecting chart…",refresh:"Refresh chart"},
 {name:"market panel",view:()=> <LiveMarketWidget kind="summary"/>,tag:"tv-market-summary",retry:"Retry live panel",waiting:"Reconnecting live panel…",refresh:"Refresh live panel"},
];
describe.each(cases)("$name keyboard retry",({view,tag,retry,waiting,refresh})=>{
 it("retains the same focused control while loading and after ready, and guards repeat activation",async()=>{
  const user=userEvent.setup();render(view());await act(async()=>{await Promise.resolve()});
  const previous=document.querySelector(tag)!;fireEvent(previous,new CustomEvent("tv-widget-error",{bubbles:true,composed:true}));
  const button=screen.getByRole("button",{name:retry});button.focus();await user.keyboard("{Enter}");
  expect(screen.getByRole("button",{name:waiting})).toBe(button);expect(document.activeElement).toBe(button);expect(button.getAttribute("aria-disabled")).toBe("true");
  const next=document.querySelector(tag)!;expect(next).not.toBe(previous);await user.keyboard("{Enter}");expect(document.querySelector(tag)).toBe(next);
  fireEvent(next,new CustomEvent("tv-widget-ready",{bubbles:true,composed:true}));expect(screen.getByRole("button",{name:refresh})).toBe(button);expect(button.getAttribute("aria-disabled")).toBe("false");expect(document.activeElement).toBe(button);
 });
 it("does not steal focus when the user tabs elsewhere before the provider responds",async()=>{
  const user=userEvent.setup();render(view());await act(async()=>{await Promise.resolve()});
  fireEvent(document.querySelector(tag)!,new CustomEvent("tv-widget-error",{bubbles:true,composed:true}));const button=screen.getByRole("button",{name:retry});button.focus();await user.keyboard("{Enter}");await user.tab();const laterFocus=document.activeElement;expect(laterFocus).not.toBe(button);expect(laterFocus?.tagName).toBe("A");
  fireEvent(document.querySelector(tag)!,new CustomEvent("tv-widget-ready",{bubbles:true,composed:true}));expect(document.activeElement).toBe(laterFocus);expect(screen.getByRole("button",{name:refresh})).toBe(button);
 });
});
it("truthfully labels the default AAPL destination even after the provider host changes symbol",async()=>{
 render(<TradingViewChart/>);await act(async()=>{await Promise.resolve()});document.querySelector("tv-advanced-chart")!.setAttribute("symbol","NASDAQ:MSFT");
 expect(screen.getByRole("link",{name:"Open default AAPL on TradingView"}).getAttribute("href")).toBe("https://www.tradingview.com/chart/?symbol=NASDAQ%3AAAPL");expect(screen.getByText(/external link opens the default AAPL chart/)).toBeTruthy();
});
