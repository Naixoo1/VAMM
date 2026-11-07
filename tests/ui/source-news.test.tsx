// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import NewsPage from "@/app/news/page";
import { useNewsData } from "@/hooks/use-api-data";
import { getNewsData } from "@/lib/data/fixtures";
vi.mock("@/hooks/use-api-data", () => ({ useNewsData: vi.fn() }));
// Provider lifecycle is covered separately; these tests exercise the page/practice boundary.
vi.mock("@/components/features/live-news", () => ({
  LiveNewsFeed: () => <section aria-label="Live market news">External provider test boundary</section>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useNewsData).mockReturnValue({ data: getNewsData(), error: null, loading: false, reload: vi.fn() });
});
afterEach(() => cleanup());

function openPractice() {
  const details = screen.getByText("Synthetic practice").closest("details") as HTMLDetailsElement;
  details.open = true;
  fireEvent(details, new Event("toggle"));
}

describe("live News page and separate synthetic practice", () => {
  it("makes the automatic provider feed primary instead of manually maintained article cards", () => {
    render(<NewsPage />);
    expect(screen.getByRole("heading", { name: "News & Sentiment Lab", level: 1 })).toBeTruthy();
    expect(screen.getByText("Auto-updating news")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Live market news" })).toBeTruthy();
    expect(screen.queryByText("Curated · not live")).toBeNull();
    expect(screen.queryByText("Apple reports fourth quarter results")).toBeNull();
    expect(useNewsData).not.toHaveBeenCalled();
  });

  it("keeps the exercise lazy and clearly labels frozen prewritten sentiment", () => {
    render(<NewsPage />);
    expect(useNewsData).not.toHaveBeenCalled();
    expect(screen.queryByRole("region", { name: "Synthetic practice stories" })).toBeNull();
    openPractice();
    expect(useNewsData).toHaveBeenCalled();
    const practice = within(screen.getByRole("region", { name: "Synthetic practice stories" }));
    expect(practice.getAllByRole("article")).toHaveLength(3);
    expect(practice.getByText("Mixed")).toBeTruthy();
    expect(practice.getByText("Negative")).toBeTruthy();
    expect(practice.getAllByText(/Prewritten sentiment/)).toHaveLength(3);
    expect(practice.getByText("Synthetic scenario: bond basket records a modest gain")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Live market news" })).toBeTruthy();
  });

  it("keeps live reading separate when the synthetic exercise fails", () => {
    vi.mocked(useNewsData).mockReturnValue({ data: null, error: "Synthetic practice is temporarily unavailable.", loading: false, reload: vi.fn() });
    render(<NewsPage />);
    openPractice();
    expect(screen.getByRole("alert").textContent).toContain("Synthetic practice is temporarily unavailable.");
    expect(screen.getByRole("region", { name: "Live market news" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("retains the frozen empty-practice state without using it as live-provider fallback", () => {
    vi.mocked(useNewsData).mockReturnValue({ data: { ...getNewsData(), items: [] }, error: null, loading: false, reload: vi.fn() });
    render(<NewsPage />);
    expect(screen.queryByText("No teaching stories are available.")).toBeNull();
    openPractice();
    expect(screen.getByText("No teaching stories are available.")).toBeTruthy();
    expect(screen.getByRole("region", { name: "Live market news" })).toBeTruthy();
  });
});
