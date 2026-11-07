// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LiveMarketComparison } from "@/components/features/live-market-comparison";
import { LiveResearchWorkspace } from "@/components/features/live-research";

vi.mock("@/components/features/live-market-widget", () => ({
  LiveMarketWidget: ({ kind, symbol, comparison }: { kind: string; symbol?: string; comparison?: string }) =>
    <section aria-label={"provider " + kind} data-symbol={symbol} data-comparison={comparison}>Provider boundary</section>,
}));
vi.mock("@/components/motion", () => ({
  MotionMark: ({ preset }: { preset: string }) => <span data-motion-preset={preset} />,
  MotionBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
const comparisonPanel = () => screen.getByRole("region", { name: "provider comparison" });
const companyPanel = (kind: string) => screen.getByRole("region", { name: "provider " + kind });

beforeEach(() => { vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network call."); })); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("explicit broad-symbol selection", () => {
  it("keeps the current comparison while typing and submits a US/IDX pair together", () => {
    render(<LiveMarketComparison />);
    const previous = comparisonPanel();
    fireEvent.change(screen.getByLabelText("First company"), { target: { value: " idx:bbca " } });
    fireEvent.change(screen.getByLabelText("Second company"), { target: { value: "nyse:ko" } });
    expect(comparisonPanel()).toBe(previous);
    expect(previous.getAttribute("data-symbol")).toBe("NASDAQ:AAPL");
    expect(previous.getAttribute("data-comparison")).toBe("NASDAQ:MSFT");
    fireEvent.click(screen.getByRole("button", { name: "Compare listings" }));
    expect(comparisonPanel().getAttribute("data-symbol")).toBe("IDX:BBCA");
    expect(comparisonPanel().getAttribute("data-comparison")).toBe("NYSE:KO");
    expect((screen.getByLabelText("First company") as HTMLInputElement).value).toBe("IDX:BBCA");
    expect(screen.getByText(/not a currency-adjusted total return/)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([["NYSE:BRK.B", "HKEX:0700"], ["TSE:7203", "LSE:VOD"]])("accepts class shares or numeric tickers without a fixed company list: %s / %s", (first, second) => {
    render(<LiveMarketComparison />);
    fireEvent.change(screen.getByLabelText("First company"), { target: { value: first } });
    fireEvent.change(screen.getByLabelText("Second company"), { target: { value: second } });
    fireEvent.submit(screen.getByRole("button", { name: "Compare listings" }).closest("form")!);
    expect(comparisonPanel().getAttribute("data-symbol")).toBe(first);
    expect(comparisonPanel().getAttribute("data-comparison")).toBe(second);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects canonical duplicates, identifies the field and keeps the previous panel", () => {
    render(<LiveMarketComparison />);
    const previous = comparisonPanel();
    fireEvent.change(screen.getByLabelText("First company"), { target: { value: "NYSE:KO" } });
    fireEvent.change(screen.getByLabelText("Second company"), { target: { value: " nyse:ko " } });
    fireEvent.click(screen.getByRole("button", { name: "Compare listings" }));
    expect(screen.getByRole("alert").textContent).toContain("Choose two different exchange-qualified listings.");
    expect(document.activeElement).toBe(screen.getByLabelText("Second company"));
    expect(screen.getByLabelText("Second company").getAttribute("aria-invalid")).toBe("true");
    expect(comparisonPanel()).toBe(previous);
    expect(previous.getAttribute("data-symbol")).toBe("NASDAQ:AAPL");
    expect(document.querySelector('[data-motion-preset="empty-line"]')).toBeTruthy();
  });

  it("accepts and displays the maximum qualified symbol without truncating its provider configuration", () => {
    render(<LiveMarketComparison />);
    const symbol = "ABCDEFGHIJKLMNOPQRST:ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN";
    expect(symbol).toHaveLength(61);
    fireEvent.change(screen.getByLabelText("First company"), { target: { value: symbol } });
    fireEvent.click(screen.getByRole("button", { name: "Compare listings" }));
    expect(comparisonPanel().getAttribute("data-symbol")).toBe(symbol);
    expect(screen.getByText("Showing " + symbol + " and NASDAQ:MSFT.", { exact: false })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    // Actual narrow-screen wrapping is verified separately in a rendered browser.
  });

  it("does not pass interval injection or markup through to a provider", () => {
    render(<LiveMarketComparison />);
    const previous = comparisonPanel();
    for (const invalid of ["NASDAQ:AAPL|1D", '<img src=x onerror="alert(1)">']) {
      fireEvent.change(screen.getByLabelText("First company"), { target: { value: invalid } });
      fireEvent.click(screen.getByRole("button", { name: "Compare listings" }));
      expect(screen.getByRole("alert").textContent).toContain("First company: enter");
      expect(document.activeElement).toBe(screen.getByLabelText("First company"));
      expect(comparisonPanel()).toBe(previous);
      expect(previous.getAttribute("data-symbol")).toBe("NASDAQ:AAPL");
      expect(document.querySelector("img")).toBeNull();
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it("updates all company panels only after explicit normalized submission", () => {
    render(<LiveResearchWorkspace />);
    fireEvent.change(screen.getByLabelText("Company context"), { target: { value: " lse:vod " } });
    for (const kind of ["profile", "technical", "fundamentals"]) expect(companyPanel(kind).getAttribute("data-symbol")).toBe("NASDAQ:AAPL");
    fireEvent.submit(screen.getByRole("button", { name: "Load company" }).closest("form")!);
    for (const kind of ["profile", "technical", "fundamentals"]) expect(companyPanel(kind).getAttribute("data-symbol")).toBe("LSE:VOD");
    expect(screen.getByText(/They do not provide facts to the AI form/)).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves company context after invalid submission and exposes a safe public catalog link", () => {
    render(<LiveResearchWorkspace />);
    const previous = companyPanel("profile");
    fireEvent.change(screen.getByLabelText("Company context"), { target: { value: "https://attacker.invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Load company" }));
    expect(screen.getByRole("alert").textContent).toContain("Enter an exchange-qualified listing");
    expect(document.activeElement).toBe(screen.getByLabelText("Company context"));
    expect(companyPanel("profile")).toBe(previous);
    expect(previous.getAttribute("data-symbol")).toBe("NASDAQ:AAPL");
    const catalog = screen.getByRole("link", { name: "Find a stock symbol (opens TradingView)" });
    expect(catalog.getAttribute("href")).toBe("https://www.tradingview.com/screener/");
    expect(catalog.getAttribute("target")).toBe("_blank");
    expect(catalog.getAttribute("rel")).toBe("noopener noreferrer");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects invalid direct widget props without creating an external provider host", async () => {
    const { LiveMarketWidget } = await vi.importActual<typeof import("@/components/features/live-market-widget")>("@/components/features/live-market-widget");
    render(<LiveMarketWidget kind="profile" symbol="NASDAQ:AAPL|1D" />);
    expect(screen.getByRole("alert").textContent).toContain("Enter an exchange-qualified listing");
    expect(screen.getByRole("region", { name: "Unavailable provider panel" })).toBeTruthy();
    expect(document.querySelector("tv-company-profile,iframe,script")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
