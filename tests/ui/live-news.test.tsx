// @vitest-environment jsdom
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LiveNewsFeed } from "@/components/features/live-news";
import { LIVE_NEWS_ELEMENT, LIVE_NEWS_LOAD_TIMEOUT_MS, LIVE_NEWS_MODULE_URL } from "@/lib/data/live-news";

const registered = class extends HTMLElement {};
const widget = () => document.querySelector(LIVE_NEWS_ELEMENT)!;
const liveRegion = () => screen.getByRole("region", { name: "Live market news" });
beforeEach(() => {
  vi.stubGlobal("customElements", { get: () => registered, whenDefined: () => Promise.resolve(registered) });
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  document.querySelectorAll("script[data-vamm-live-news-module]").forEach(script => script.remove());
});

describe("external automatically updated News boundary", () => {
  it("registers the official module once under StrictMode, with verified all-news attributes", async () => {
    vi.stubGlobal("customElements", { get: () => undefined, whenDefined: () => new Promise(() => {}) });
    const mounted = render(<StrictMode><LiveNewsFeed /><LiveNewsFeed /></StrictMode>);
    const scripts = Array.from(document.scripts).filter(script => script.src === LIVE_NEWS_MODULE_URL);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].type).toBe("module");
    expect(document.querySelectorAll(LIVE_NEWS_ELEMENT)).toHaveLength(2);
    for (const element of document.querySelectorAll(LIVE_NEWS_ELEMENT)) {
      expect(element.getAttribute("news-type")).toBe("all");
      expect(element.getAttribute("assets-type")).toBe("all");
      expect(element.getAttribute("layout-mode")).toBe("flow");
      expect(element.getAttribute("item-size")).toBe("normal");
      expect(element.getAttribute("theme")).toBe("light");
    }
    fireEvent.load(scripts[0]);
    expect(screen.getAllByRole("status").every(status => status.textContent === "Connecting to live market news…")).toBe(true);
    await act(async () => { fireEvent.error(scripts[0]); await Promise.resolve(); });
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Reload page" })).toHaveLength(2);
    expect(fetch).not.toHaveBeenCalled();
    mounted.unmount();
    expect(document.querySelector(LIVE_NEWS_ELEMENT)).toBeNull();
    expect(scripts[0].isConnected).toBe(true);
  });

  it("does not call definition or module loading evidence of a connected feed", async () => {
    render(<LiveNewsFeed />);
    await act(async () => { await Promise.resolve(); });
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("loading");
    expect(screen.getByRole("status").textContent).toBe("Connecting to live market news…");
    expect(screen.getByTestId("live-news-host").hasAttribute("inert")).toBe(true);
  });

  it("accepts only its own lifecycle event and never renders provider error details", async () => {
    render(<LiveNewsFeed />);
    await act(async () => { await Promise.resolve(); });
    const feed = widget();
    const child = document.createElement("span");
    feed.append(child);
    fireEvent(child, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("loading");
    fireEvent(feed, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("ready");
    expect(screen.getByTestId("live-news-host").hasAttribute("inert")).toBe(false);
    fireEvent(feed, new CustomEvent("tv-widget-error", { bubbles: true, composed: true, detail: { message: "<img src=x onerror=alert(1)> UNTRUSTED_PROVIDER_DETAILS" } }));
    expect(screen.getByRole("alert").textContent).toBe("Live news couldn’t load here.");
    expect(screen.queryByText(/UNTRUSTED_PROVIDER_DETAILS/)).toBeNull();
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByTestId("live-news-host").hasAttribute("inert")).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("gives an actionable timeout instead of silently replacing live news with fixtures", async () => {
    vi.useFakeTimers();
    render(<LiveNewsFeed />);
    await act(async () => { await Promise.resolve(); vi.advanceTimersByTime(LIVE_NEWS_LOAD_TIMEOUT_MS); });
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("error");
    expect(screen.getByRole("alert").textContent).toBe("Live news couldn’t load here.");
    expect(screen.getByRole("button", { name: "Retry live feed" })).toBeTruthy();
    const link = within(liveRegion()).getByRole("link", { name: "Open news on TradingView" });
    expect(link.getAttribute("href")).toBe("https://www.tradingview.com/news/");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.queryByText(/Synthetic scenario:/)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries a registered provider by replacing only its own widget", async () => {
    render(<LiveNewsFeed />);
    await act(async () => { await Promise.resolve(); });
    const previous = widget();
    const scriptsBefore = document.scripts.length;
    fireEvent(previous, new CustomEvent("tv-widget-error", { bubbles: true, composed: true }));
    fireEvent.click(screen.getByRole("button", { name: "Retry live feed" }));
    expect(widget()).not.toBe(previous);
    expect(previous.isConnected).toBe(false);
    expect(document.querySelectorAll(LIVE_NEWS_ELEMENT)).toHaveLength(1);
    expect(document.scripts.length).toBe(scriptsBefore);
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("loading");
  });

  it("hides changing presentation by removing the element, then reconnects on Show", async () => {
    vi.useFakeTimers();
    render(<LiveNewsFeed />);
    await act(async () => { await Promise.resolve(); });
    const previous = widget();
    fireEvent.click(screen.getByRole("button", { name: "Hide live feed" }));
    expect(document.querySelector(LIVE_NEWS_ELEMENT)).toBeNull();
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("paused");
    expect(screen.getByRole("status").textContent).toBe("Live feed hidden.");
    await act(async () => { vi.advanceTimersByTime(LIVE_NEWS_LOAD_TIMEOUT_MS); });
    fireEvent(previous, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("paused");
    fireEvent.click(screen.getByRole("button", { name: "Show live feed" }));
    expect(widget()).not.toBe(previous);
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("loading");
    fireEvent(widget(), new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("ready");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports browser offline state and reconnects a fresh widget when online returns", async () => {
    render(<LiveNewsFeed />);
    await act(async () => { await Promise.resolve(); });
    const previous = widget();
    fireEvent(previous, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    fireEvent(window, new Event("offline"));
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("offline");
    expect(screen.getByRole("alert").textContent).toContain("You’re offline.");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    fireEvent(window, new Event("online"));
    expect(widget()).not.toBe(previous);
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("loading");
    fireEvent(previous, new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("loading");
    fireEvent(widget(), new CustomEvent("tv-widget-ready", { bubbles: true, composed: true }));
    expect(liveRegion().getAttribute("data-live-news-state")).toBe("ready");
  });

  it("shows a safe failure for browsers without Custom Elements", async () => {
    vi.stubGlobal("customElements", undefined);
    render(<LiveNewsFeed />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole("alert").textContent).toBe("Live news couldn’t load here.");
    expect(screen.getByRole("button", { name: "Reload page" })).toBeTruthy();
  });

  it("describes source access and timing without fabricating publisher names or a refresh cadence", () => {
    render(<LiveNewsFeed />);
    expect(screen.getByText(/Open a headline on TradingView to check its publisher and full context/)).toBeTruthy();
    expect(screen.getByText(/Delivery timing and availability depend on the provider and publishers/)).toBeTruthy();
    expect(screen.getByText(/VAMM adds no sentiment scores to this feed/)).toBeTruthy();
    expect(screen.queryByText(/30.second|refreshed at|updated at|Apple reports fourth quarter/i)).toBeNull();
  });

  it("renders a stable server placeholder without registering a browser element", () => {
    const before = document.scripts.length;
    const html = renderToString(<LiveNewsFeed />);
    expect(html).toContain("Connecting to live market news");
    expect(html).not.toContain("<tv-news-feed");
    expect(html).not.toContain("<script");
    expect(document.scripts.length).toBe(before);
  });
});
