// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import NewsPage from "@/app/news/page";
import { useNewsData } from "@/hooks/use-api-data";
import { getNewsData } from "@/lib/data/fixtures";
vi.mock("@/hooks/use-api-data", () => ({ useNewsData: vi.fn() }));

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

describe("News publisher reading and separate synthetic practice", () => {
  it("shows real dated publisher links and honest manually curated labeling", () => {
    render(<NewsPage />);
    expect(screen.getByRole("heading", { name: "News & Sentiment Lab", level: 1 })).toBeTruthy();
    expect(screen.getByText("Curated · not live")).toBeTruthy();
    const sources = within(screen.getByRole("region", { name: "Curated source reading" }));
    expect(sources.getAllByRole("article")).toHaveLength(3);
    expect(sources.getByText("2 Nov 2026")).toBeTruthy();
    expect(sources.getByText("28 Oct 2026")).toBeTruthy();
    expect(sources.getByText("4 Jun 2025")).toBeTruthy();
    expect(sources.getByText("Background reading")).toBeTruthy();
    expect(sources.getByText("7 Nov 2026")).toBeTruthy();
    expect(sources.queryByText(/^(positive|negative|neutral|mixed)$/i)).toBeNull();
    expect(useNewsData).not.toHaveBeenCalled();
  });

  it("opens original pages safely with meaningful link names", () => {
    render(<NewsPage />);
    const sources = within(screen.getByRole("region", { name: "Curated source reading" }));
    const links = sources.getAllByRole("link");
    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link.getAttribute("href")).toMatch(/^https:\/\//);
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.getAttribute("aria-label")).toContain("opens in a new tab");
    }
    expect(sources.getByRole("link", { name: /Apple reports fourth quarter results/ }).getAttribute("href")).toBe("https://www.apple.com/newsroom/2026/11/apple-reports-fourth-quarter-results/");
  });

  it("loads the frozen exercise only when expanded and labels its sentiment as prewritten", () => {
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
    expect(within(screen.getByRole("region", { name: "Curated source reading" })).getAllByRole("link")).toHaveLength(3);
  });

  it("keeps source reading available when synthetic practice fails to load", () => {
    vi.mocked(useNewsData).mockReturnValue({ data: null, error: "Synthetic practice is temporarily unavailable.", loading: false, reload: vi.fn() });
    render(<NewsPage />);
    openPractice();
    expect(screen.getByRole("alert").textContent).toContain("Synthetic practice is temporarily unavailable.");
    expect(within(screen.getByRole("region", { name: "Curated source reading" })).getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
