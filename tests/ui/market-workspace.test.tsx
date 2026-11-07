// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MarketWorkspace } from "@/components/features/market-workspace";

beforeEach(() => {
  const registered = class extends HTMLElement {};
  vi.stubGlobal("customElements", { get: () => registered, whenDefined: () => Promise.resolve(registered) });
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("live-only Market workspace", () => {
  it("opens the dark AAPL daily chart without a synthetic tab or fixture request", () => {
    render(<MarketWorkspace />);
    const widget = screen.getByLabelText("TradingView Advanced Chart");
    expect(widget).toHaveAttribute("symbol", "NASDAQ:AAPL");
    expect(widget).toHaveAttribute("interval", "1D");
    expect(widget).toHaveAttribute("theme", "dark");
    expect(widget).toHaveAttribute("allow-symbol-change");
    fireEvent(widget, new CustomEvent("tv-widget-ready"));
    expect(screen.getByRole("status")).toHaveTextContent("Chart loaded by TradingView.");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText("Original Chart for Learning")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports provider failure without substituting a synthetic chart", () => {
    render(<MarketWorkspace />);
    fireEvent(screen.getByLabelText("TradingView Advanced Chart"), new CustomEvent("tv-widget-error"));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.queryByText("Original Chart for Learning")).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});