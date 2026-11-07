// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardPage from "@/app/dashboard/page";
import ComparePage from "@/app/compare/page";
import ResearchPage from "@/app/research/page";
import { useMarketData } from "@/hooks/use-api-data";
import { getMarketData } from "@/lib/data/fixtures";
vi.mock("@/hooks/use-api-data", () => ({ useMarketData: vi.fn() }));
vi.mock("@/components/features/tradingview-chart", () => ({
  TradingViewChart: () => <section aria-label="Existing TradingView chart">Provider chart test boundary</section>,
}));
vi.mock("@/components/features/live-market-widget", () => ({
  LiveMarketWidget: ({ kind, symbol, comparison }: { kind: string; symbol?: string; comparison?: string }) =>
    <section aria-label={"provider " + kind} data-symbol={symbol} data-comparison={comparison}>Provider test boundary</section>,
}));
vi.mock("@/components/motion", () => ({
  MotionMark: ({ preset }: { preset: string }) => <span data-motion-preset={preset} />,
  MotionBoundary: ({ children, preset }: { children: ReactNode; preset: string }) => <div data-motion-preset={preset}>{children}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useMarketData).mockReturnValue({ data: getMarketData(), error: null, loading: false, reload: vi.fn() });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: async () => ({
    ok: true, data: { summary: "A synthetic teaching explanation.", facts: [], limitations: ["Fixed synthetic evidence only."], evidence: [], origin: "prewritten" },
  }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function renderPage(page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}>{page}</QueryClientProvider>);
}
function setDisclosure(title: string, open: boolean) {
  const details = screen.getByText(title, { exact: true }).closest("details") as HTMLDetailsElement;
  details.open = open;
  fireEvent(details, new Event("toggle"));
}

describe("primary live views and isolated teaching areas", () => {
  it("puts real market providers first and loads frozen dashboard baskets only on request", () => {
    renderPage(<DashboardPage />);
    expect(screen.getByRole("region", { name: "provider summary" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Existing TradingView chart" })).toBeTruthy();
    expect(useMarketData).not.toHaveBeenCalled();
    expect(screen.queryByText("Simulated cash")).toBeNull();
    setDisclosure("Synthetic learning baskets", true);
    expect(useMarketData).toHaveBeenCalled();
    expect(screen.getByText("Simulated cash")).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("uses live company selectors independently of the old frozen comparison", () => {
    renderPage(<ComparePage />);
    const provider = screen.getByRole("region", { name: "provider comparison" });
    expect(provider.getAttribute("data-symbol")).toBe("NASDAQ:AAPL");
    expect(provider.getAttribute("data-comparison")).toBe("NASDAQ:MSFT");
    fireEvent.change(screen.getByLabelText("First company"), { target: { value: "NASDAQ:GOOGL" } });
    expect(screen.getByRole("region", { name: "provider comparison" }).getAttribute("data-symbol")).toBe("NASDAQ:GOOGL");
    expect(useMarketData).not.toHaveBeenCalled();
    setDisclosure("Synthetic basket comparison", true);
    expect((screen.getByLabelText("First instrument") as HTMLSelectElement).value).toBe("edu-bonds");
    expect((screen.getByLabelText("Second instrument") as HTMLSelectElement).value).toBe("edu-equity");
    expect(screen.getAllByText("Unavailable", { exact: true })).toHaveLength(2);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("keeps real company context out of the synthetic AI request and preserves fallback evidence cues", async () => {
    renderPage(<ResearchPage />);
    expect(screen.getByText(/They do not provide facts to the AI form or create live-grounded AI answers/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Company context"), { target: { value: "NASDAQ:MSFT" } });
    for (const kind of ["profile", "technical", "fundamentals"]) expect(screen.getByRole("region", { name: "provider " + kind }).getAttribute("data-symbol")).toBe("NASDAQ:MSFT");
    expect(useMarketData).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    setDisclosure("Synthetic basket mentor", true);
    const prompt = "Compare the modeled changes of these educational baskets.";
    fireEvent.click(screen.getByRole("button", { name: prompt }));
    expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe(prompt);
    fireEvent.click(screen.getByRole("button", { name: "Ask your mentor" }));
    expect(await screen.findByText("Prewritten fallback")).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/research");
    expect(JSON.parse(String(options?.body))).toEqual({ instrumentIds: ["edu-bonds", "edu-equity"], question: prompt });
    expect(document.querySelector('[data-motion-preset="evidence-arrival"]')).toBeTruthy();
    expect(document.querySelector('[data-motion-preset="research-fallback"]')).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("retains a learner’s question when the mentor area is closed and reopened", () => {
    renderPage(<ResearchPage />);
    setDisclosure("Synthetic basket mentor", true);
    fireEvent.change(screen.getByLabelText("Your question"), { target: { value: "Keep this question while I inspect the company." } });
    setDisclosure("Synthetic basket mentor", false);
    setDisclosure("Synthetic basket mentor", true);
    expect((screen.getByLabelText("Your question") as HTMLTextAreaElement).value).toBe("Keep this question while I inspect the company.");
    expect(fetch).not.toHaveBeenCalled();
    expect(within(screen.getByRole("region", { name: "provider fundamentals" })).getByText("Provider test boundary")).toBeTruthy();
  });
});
