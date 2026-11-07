// @vitest-environment jsdom
import { StrictMode, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LiveMarketWidget } from "@/components/features/live-market-widget";
import { getTradingViewWidgetSpec, LIVE_WIDGET_EMBEDS, LIVE_WIDGET_MODULES, LIVE_WIDGET_TIMEOUT_MS } from "@/lib/data/tradingview-widgets";
vi.mock("@/components/motion", () => ({
  MotionMark: ({ preset }: { preset: string }) => <span data-motion-preset={preset} />,
  MotionBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
const registered = class extends HTMLElement {};
const region = (name: string) => screen.getByRole("region", { name });
const embeddedScript = (kind: string) => document.querySelector('script[data-vamm-live-widget-embed="' + kind + '"]') as HTMLScriptElement;
function addFrame(kind: string, url: string) {
  const frame = document.createElement("iframe");
  frame.src = url;
  embeddedScript(kind).parentElement!.append(frame);
  fireEvent.load(frame);
  return frame;
}
beforeEach(() => {
  vi.stubGlobal("customElements", { get: () => registered, whenDefined: () => Promise.resolve(registered) });
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals();
  document.querySelectorAll("script[data-vamm-live-widget-module]").forEach(script => script.remove());
});

describe("live provider market panels", () => {
  it("registers each verified Web Component module once under StrictMode", async () => {
    vi.stubGlobal("customElements", { get: () => undefined, whenDefined: () => new Promise(() => {}) });
    render(<StrictMode><LiveMarketWidget kind="summary" /><LiveMarketWidget kind="summary" /><LiveMarketWidget kind="profile" /><LiveMarketWidget kind="technical" /></StrictMode>);
    const scripts = Array.from(document.scripts).filter(script => Object.values(LIVE_WIDGET_MODULES).some(url => script.src === url));
    expect(scripts).toHaveLength(3);
    expect(scripts.every(script => script.type === "module")).toBe(true);
    const summary = document.querySelector("tv-market-summary")!;
    expect(summary.getAttribute("mode")).toBe("custom");
    expect(JSON.parse(summary.getAttribute("symbol-sectors")!)).toEqual([{ sectionName: "US companies", symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:GOOGL"] }]);
    expect(summary.getAttribute("time-frame")).toBe("1D");
    expect(summary.getAttribute("layout-mode")).toBe("grid");
    expect(document.querySelector("tv-company-profile")?.getAttribute("symbol")).toBe("NASDAQ:AAPL");
    expect(document.querySelector("tv-technical-analysis")?.getAttribute("interval")).toBe("1D");
    for (const script of scripts) fireEvent.load(script);
    expect(screen.getAllByRole("status").every(status => status.textContent === "Connecting to TradingView…")).toBe(true);
    await act(async () => { for (const script of scripts) fireEvent.error(script); await Promise.resolve(); });
    expect(screen.getAllByRole("alert")).toHaveLength(4);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("waits for the actual host-ready event and ignores child-spoofed events", async () => {
    render(<LiveMarketWidget kind="profile" />);
    await act(async () => { await Promise.resolve(); });
    const host = document.querySelector("tv-company-profile")!;
    const child = document.createElement("span");
    host.append(child);
    fireEvent(child, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(region("Company profile").getAttribute("data-live-market-state")).toBe("loading");
    fireEvent(host, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(region("Company profile").getAttribute("data-live-market-state")).toBe("ready");
    expect(screen.getByTestId("live-profile-host").hasAttribute("inert")).toBe(false);
    fireEvent(host, new CustomEvent("tv-widget-error", { bubbles: true, composed: true, detail: "<img src=x onerror=alert(1)> UNTRUSTED" }));
    expect(screen.getByRole("alert").textContent).toBe("This live panel couldn’t load here.");
    expect(screen.queryByText(/UNTRUSTED/)).toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });

  it("uses the official legacy comparison embed with a real two-series percentage overlay", () => {
    render(<LiveMarketWidget kind="comparison" symbol="NASDAQ:AAPL" comparison="NASDAQ:GOOGL" />);
    const script = embeddedScript("comparison");
    expect(script.src).toBe(LIVE_WIDGET_EMBEDS.comparison);
    expect(script.type).toBe("text/javascript");
    expect(JSON.parse(script.textContent!)).toMatchObject({
      symbols: [["Apple", "NASDAQ:AAPL|1D"]],
      compareSymbol: { symbol: "NASDAQ:GOOGL", lineWidth: 2 },
      scaleMode: "Percentage", chartType: "line", chartOnly: true, autosize: true,
    });
    fireEvent.load(script);
    expect(region("Live company comparison").getAttribute("data-live-market-state")).toBe("loading");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("treats only an approved iframe document load as a panel opening, never quote freshness", () => {
    render(<LiveMarketWidget kind="fundamentals" symbol="NASDAQ:MSFT" />);
    expect(embeddedScript("fundamentals").src).toBe(LIVE_WIDGET_EMBEDS.fundamentals);
    expect(JSON.parse(embeddedScript("fundamentals").textContent!)).toMatchObject({ symbol: "NASDAQ:MSFT", colorTheme: "light", displayMode: "regular" });
    addFrame("fundamentals", "https://attacker.invalid/embed-widget/financials/");
    expect(region("Company fundamentals").getAttribute("data-live-market-state")).toBe("loading");
    const frame = addFrame("fundamentals", "https://www.tradingview-widget.com/embed-widget/financials/?locale=en");
    expect(frame.title).toBe("TradingView Company fundamentals");
    expect(region("Company fundamentals").getAttribute("data-live-market-state")).toBe("panel");
    expect(screen.getByRole("status").textContent).toBe("Provider panel opened. Check the panel for data availability and timing.");
    expect(screen.queryByText(/quotes loaded|fresh data|updated at/i)).toBeNull();
    expect(screen.getByTestId("live-fundamentals-host").hasAttribute("inert")).toBe(false);
  });

  it("allows retrying a legacy panel whose internal data availability remains provider-owned", () => {
    render(<LiveMarketWidget kind="fundamentals" />);
    const firstScript = embeddedScript("fundamentals");
    const frame = addFrame("fundamentals", "https://www.tradingview-widget.com/embed-widget/financials/");
    fireEvent.click(screen.getByRole("button", { name: "Retry live panel" }));
    expect(firstScript.isConnected).toBe(false);
    expect(frame.isConnected).toBe(false);
    expect(embeddedScript("fundamentals")).not.toBe(firstScript);
    expect(region("Company fundamentals").getAttribute("data-live-market-state")).toBe("loading");
  });

  it("shows timeout failures without substituting fixed synthetic prices or returns", async () => {
    vi.useFakeTimers();
    render(<LiveMarketWidget kind="summary" />);
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(LIVE_WIDGET_TIMEOUT_MS); });
    expect(screen.getByRole("alert").textContent).toBe("This live panel couldn’t load here.");
    expect(screen.getByRole("button", { name: "Retry live panel" })).toBeTruthy();
    const source = within(region("Live market summary")).getByRole("link", { name: "Open on TradingView" });
    expect(source.getAttribute("href")).toBe("https://www.tradingview.com/markets/stocks-usa/");
    expect(source.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.queryByText(/12.476%|Simulated cash|Cumulative modeled return/)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("unmounts both provider formats on Hide and recreates only the shown panel", async () => {
    render(<><LiveMarketWidget kind="profile" /><LiveMarketWidget kind="fundamentals" /></>);
    await act(async () => { await Promise.resolve(); });
    const profile = region("Company profile");
    const financials = region("Company fundamentals");
    const previous = document.querySelector("tv-company-profile")!;
    const script = embeddedScript("fundamentals");
    fireEvent.click(within(profile).getByRole("button", { name: "Hide live panel" }));
    expect(document.querySelector("tv-company-profile")).toBeNull();
    expect(script.isConnected).toBe(true);
    expect(profile.getAttribute("data-live-market-state")).toBe("paused");
    fireEvent(previous, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(profile.getAttribute("data-live-market-state")).toBe("paused");
    fireEvent.click(within(profile).getByRole("button", { name: "Show live panel" }));
    expect(document.querySelector("tv-company-profile")).not.toBe(previous);
    fireEvent.click(within(financials).getByRole("button", { name: "Hide live panel" }));
    expect(embeddedScript("fundamentals")).toBeNull();
    expect(document.querySelector("tv-company-profile")).toBeTruthy();
  });

  it("resets provider state and configuration when the company changes", async () => {
    const mounted = render(<LiveMarketWidget kind="profile" symbol="NASDAQ:AAPL" />);
    await act(async () => { await Promise.resolve(); });
    const old = document.querySelector("tv-company-profile")!;
    fireEvent(old, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    mounted.rerender(<LiveMarketWidget kind="profile" symbol="NASDAQ:MSFT" />);
    const current = document.querySelector("tv-company-profile")!;
    expect(current).not.toBe(old);
    expect(current.getAttribute("symbol")).toBe("NASDAQ:MSFT");
    expect(region("Company profile").getAttribute("data-live-market-state")).toBe("loading");
    fireEvent(old, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(region("Company profile").getAttribute("data-live-market-state")).toBe("loading");
  });

  it("starts its timeout only when visible and never schedules a late timeout after readiness", async () => {
    vi.useFakeTimers();
    let visibility: IntersectionObserverCallback | undefined;
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: IntersectionObserverCallback) { visibility = callback; }
      observe = vi.fn();
      disconnect = vi.fn();
    });
    render(<LiveMarketWidget kind="profile" />);
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(LIVE_WIDGET_TIMEOUT_MS * 2); });
    expect(region("Company profile").getAttribute("data-live-market-state")).toBe("loading");
    act(() => visibility?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    await act(async () => { vi.advanceTimersByTime(LIVE_WIDGET_TIMEOUT_MS); });
    expect(region("Company profile").getAttribute("data-live-market-state")).toBe("error");
    fireEvent.click(screen.getByRole("button", { name: "Retry live panel" }));
    fireEvent(document.querySelector("tv-company-profile")!, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    act(() => visibility?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    await act(async () => { vi.advanceTimersByTime(LIVE_WIDGET_TIMEOUT_MS * 2); });
    expect(region("Company profile").getAttribute("data-live-market-state")).toBe("ready");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("reports offline and recreates a fresh provider when this browser reconnects", async () => {
    render(<LiveMarketWidget kind="technical" />);
    await act(async () => { await Promise.resolve(); });
    const previous = document.querySelector("tv-technical-analysis")!;
    fireEvent(previous, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    fireEvent(window, new Event("offline"));
    expect(region("Technical context").getAttribute("data-live-market-state")).toBe("offline");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    fireEvent(window, new Event("online"));
    expect(document.querySelector("tv-technical-analysis")).not.toBe(previous);
    expect(region("Technical context").getAttribute("data-live-market-state")).toBe("loading");
  });

  it("rejects unsupported symbols and duplicate comparison selections before creating embeds", () => {
    expect(() => getTradingViewWidgetSpec("profile", "https://attacker.invalid" as "NASDAQ:AAPL")).toThrow(RangeError);
    expect(() => getTradingViewWidgetSpec("comparison", "NASDAQ:AAPL", "NASDAQ:AAPL")).toThrow(RangeError);
    expect(getTradingViewWidgetSpec("technical").description).toContain("Daily indicator summaries");
  });

  it("renders stable SSR placeholders without loading third-party scripts", () => {
    const before = document.scripts.length;
    const html = renderToString(<><LiveMarketWidget kind="summary" /><LiveMarketWidget kind="comparison" /><LiveMarketWidget kind="profile" /></>);
    expect(html).toContain("Connecting to TradingView");
    expect(html).not.toContain("<tv-market-summary");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("<script");
    expect(document.scripts.length).toBe(before);
  });
});
