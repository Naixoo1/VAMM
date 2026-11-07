// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import NewsPage from "@/app/news/page";
import { useNewsData } from "@/hooks/use-api-data";

vi.mock("@/hooks/use-api-data", () => ({ useNewsData: vi.fn() }));
// Provider lifecycle and failed/ready states are exercised in live-news.test.tsx.
vi.mock("@/components/features/live-news", () => ({
  LiveNewsFeed: () => <section aria-label="Live market news">External provider test boundary</section>,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("live-only News page", () => {
  it("renders the provider and reading guidance without requesting synthetic stories", () => {
    render(<NewsPage />);
    expect(screen.getByRole("heading", { name: "News & Sentiment Lab", level: 1 })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Live market news" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Three questions to bring to a story" })).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText("Synthetic practice")).toBeNull();
    expect(screen.queryByText(/Synthetic scenario:/)).toBeNull();
    expect(screen.getByText(/VAMM does not assign a live sentiment score/)).toBeTruthy();
    expect(useNewsData).not.toHaveBeenCalled();
  });
});