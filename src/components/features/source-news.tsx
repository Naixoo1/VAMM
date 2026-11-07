"use client";

import { ExternalLink, Newspaper } from "lucide-react";
import { useNewsData } from "@/hooks/use-api-data";
import { getSourceNews, SOURCE_NEWS_REVIEWED_ON } from "@/lib/data/source-news";
import { Badge, ErrorNotice, LoadingPanel, SourceLine, styles } from "./workspace";
import sourceStyles from "./source-news.module.css";

export function formatSourceDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function SourceNewsList() {
  return <div role="region" aria-label="Curated source reading">
    <div className={sourceStyles.sourceList}>
      {getSourceNews().map(item => <article className={sourceStyles.sourceCard} key={item.id}>
        <div className={sourceStyles.meta}>
          <span className={sourceStyles.publisher}>{item.publisher}</span>
          <span>{item.publisherPerspective}</span>
          <span className={sourceStyles.kind}>{item.kind}</span>
        </div>
        <h3 className={sourceStyles.sourceTitle}>{item.title}</h3>
        <div className={sourceStyles.meta}>
          <span>Published <time dateTime={item.publishedOn}>{formatSourceDate(item.publishedOn)}</time></span>
          <span>· {item.topic}</span>
        </div>
        <p className={sourceStyles.context} style={{ marginTop: 14 }}>{item.educationalContext}</p>
        <p className={sourceStyles.question}><strong>Reading question</strong>{item.readingQuestion}</p>
        <a className={sourceStyles.link} href={item.url} target="_blank" rel="noopener noreferrer" aria-label={item.title + " — " + item.publisher + " (opens in a new tab)"}>
          Read at {item.publisher}<ExternalLink size={14} aria-hidden="true" />
        </a>
      </article>)}
    </div>
    <p className={sourceStyles.checked}>Links checked <time dateTime={SOURCE_NEWS_REVIEWED_ON}>{formatSourceDate(SOURCE_NEWS_REVIEWED_ON)}</time>. Updates are selected manually. Each publisher provides its own perspective.</p>
  </div>;
}

export function SyntheticPractice() {
  const { data, error, loading, reload } = useNewsData();
  return <div className={sourceStyles.practiceBody} role="region" aria-label="Synthetic practice stories">
    <p className={sourceStyles.practiceIntro}>These three stories are authored teaching examples. Sentiment labels and reasons are prewritten; synthetic examples have no external publisher. Use them to practice identifying how wording frames a story.</p>
    {error && <ErrorNotice message={error} onRetry={reload} />}
    {loading && !data ? <LoadingPanel message="Opening synthetic practice…" /> : data && <>
      {data.items.map(item => <article className={styles.newsItem} key={item.id}>
        <span className={styles.newsIcon}><Newspaper size={19} strokeWidth={1.4} aria-hidden="true" /></span>
        <div>
          <div className={styles.newsMeta}><span>SYNTHETIC SCENARIO</span><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}</time></div>
          <h3 className={sourceStyles.practiceTitle}>{item.headline}</h3>
          <p>{item.sentimentReason ?? "No sentiment reason available."}</p>
          <p className={styles.source}>Authored by VAMM · Prewritten sentiment · No external publisher</p>
        </div>
        <div><Badge tone={item.sentiment === "negative" ? "coral" : item.sentiment === "mixed" ? "amber" : ""}>{item.sentiment ? item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1) : "Unavailable"}</Badge></div>
      </article>)}
      {data.items.length === 0 && <p className={styles.empty}>No teaching stories are available.</p>}
      <SourceLine version={data.datasetVersion} />
    </>}
  </div>;
}
