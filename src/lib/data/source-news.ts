/**
 * Manually curated publisher reading, separate from the frozen synthetic dataset.
 * These links never supply research evidence, model sentiment, or simulation inputs.
 */
export interface SourceNewsItem {
  id: string;
  title: string;
  publisher: string;
  publisherPerspective: string;
  url: string;
  publishedOn: string;
  kind: "Press release" | "Background reading";
  topic: string;
  educationalContext: string;
  readingQuestion: string;
}

export const SOURCE_NEWS_REVIEWED_ON = "2026-11-07";

const sourceNews: readonly SourceNewsItem[] = [
  {
    id: "apple-q4-2026",
    title: "Apple reports fourth quarter results",
    publisher: "Apple",
    publisherPerspective: "Company announcement",
    url: "https://www.apple.com/newsroom/2026/11/apple-reports-fourth-quarter-results/",
    publishedOn: "2026-11-02",
    kind: "Press release",
    topic: "Company results",
    educationalContext: "Apple’s own release presents its quarterly results and management commentary. Read the reported figures alongside the stated business risks.",
    readingQuestion: "Which statements report past results, and which describe future expectations?",
  },
  {
    id: "fed-fomc-2026-10",
    title: "Federal Reserve issues FOMC statement",
    publisher: "Federal Reserve",
    publisherPerspective: "U.S. central bank",
    url: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20261028a.htm",
    publishedOn: "2026-10-28",
    kind: "Press release",
    topic: "Monetary policy",
    educationalContext: "The central bank sets out its policy decision and assessment of the economy. Separate the decision itself from expectations about what comes next.",
    readingQuestion: "What did the committee decide, and what uncertainty does it acknowledge?",
  },
  {
    id: "vanguard-index-methods",
    title: "When index funds mix but don’t match",
    publisher: "Vanguard",
    publisherPerspective: "Investment company",
    url: "https://corporate.vanguard.com/content/corporatesite/us/en/corp/articles/when-index-funds-mix-dont-match.html",
    publishedOn: "2025-06-04",
    kind: "Background reading",
    topic: "Index construction",
    educationalContext: "Vanguard explains why indexes can group the same stocks differently. Use this background to question what a fund label reveals about its underlying holdings.",
    readingQuestion: "Could two funds with similar names include different groups of companies?",
  },
];

export function getSourceNews(): SourceNewsItem[] {
  return structuredClone([...sourceNews]);
}
