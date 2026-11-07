"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Badge, PageHeading, Panel, styles } from "@/components/features/workspace";
import { SourceNewsList, SyntheticPractice } from "@/components/features/source-news";
import sourceStyles from "@/components/features/source-news.module.css";

export default function NewsPage() {
  const [practiceOpen, setPracticeOpen] = useState(false);
  return <>
    <PageHeading eyebrow="Read between the headlines" title="News & Sentiment Lab" description="Read original announcements, check dates and perspectives, and practice thinking critically about financial stories.">
      <Badge>Curated · not live</Badge>
    </PageHeading>
    <div className={styles.stack}>
      <div className={styles.callout}>
        <Info size={19} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <p><strong>Real sources, selected for learning</strong>A manually selected reading list, not a live news feed. Open each publisher’s page for the full context. Reading links do not change the simulation’s teaching data.</p>
      </div>
      <div className={styles.grid2}>
        <Panel title="From the original publishers" description="Recent announcements and clearly dated background reading" body={false}>
          <SourceNewsList />
        </Panel>
        <div className={styles.stack} style={{ alignContent: "start" }}>
          <Panel title="Three questions to bring to a story">
            <ol className={sourceStyles.questions}>
              <li><strong>Who is speaking?</strong> A company, a central bank, and an investment provider have different reasons for publishing.</li>
              <li><strong>When was it published?</strong> Separate the article’s date from the date you read it. Older context can explain a concept without describing today’s market.</li>
              <li><strong>What is fact, and what is expectation?</strong> Look for the evidence, limitations, and uncertainty behind a claim.</li>
            </ol>
          </Panel>
          <Panel title="A headline is a starting point">
            <p className={[styles.small, styles.muted].join(" ")} style={{ lineHeight: 1.9, margin: 0 }}>The reading questions are written by VAMM for learning. Real articles have no VAMM sentiment score or buy/sell label. A company’s own announcement is one perspective on its business.</p>
          </Panel>
        </div>
      </div>
      <details className={sourceStyles.practice} onToggle={event => setPracticeOpen(event.currentTarget.open)}>
        <summary className={sourceStyles.summary}>Synthetic practice<span className={sourceStyles.summaryHint}>Three teaching stories with prewritten sentiment</span></summary>
        {practiceOpen && <SyntheticPractice />}
      </details>
    </div>
  </>;
}
