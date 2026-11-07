"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Badge, PageHeading, Panel, styles } from "@/components/features/workspace";
import { LiveNewsFeed } from "@/components/features/live-news";
import { SyntheticPractice } from "@/components/features/source-news";
import sourceStyles from "@/components/features/source-news.module.css";

export default function NewsPage() {
  const [practiceOpen, setPracticeOpen] = useState(false);
  return <>
    <PageHeading eyebrow="Read between the headlines" title="News & Sentiment Lab" description="Follow automatically updated market headlines, check publishers and story times, and practice thinking critically about financial stories.">
      <Badge>Auto-updating news</Badge>
    </PageHeading>
    <div className={styles.stack}>
      <div className={styles.callout}>
        <Info size={19} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
        <p><strong>Live news, with the source in view</strong>TradingView supplies the live feed below. Read the publisher’s context and timestamp before drawing conclusions. The feed stays separate from the simulation’s teaching data.</p>
      </div>
      <LiveNewsFeed />
      <div className={styles.equal2}>
        <Panel title="Three questions to bring to a story">
          <ol className={sourceStyles.questions}>
            <li><strong>Who is speaking?</strong> Open the full story to check its publisher and whose perspective it represents.</li>
            <li><strong>When was it published?</strong> A recent delivery time and a story’s original publication time can differ.</li>
            <li><strong>What is fact, and what is expectation?</strong> Look for the evidence, limitations, and uncertainty behind a claim.</li>
          </ol>
        </Panel>
        <Panel title="Control the pace">
          <p className={[styles.small, styles.muted].join(" ")} style={{ lineHeight: 1.9, margin: 0 }}>Use Hide live feed to stop viewing changing headlines, then Show live feed to reconnect. The separate practice below uses three synthetic stories with prewritten sentiment for learning.</p>
        </Panel>
      </div>
      <details className={sourceStyles.practice} onToggle={event => setPracticeOpen(event.currentTarget.open)}>
        <summary className={sourceStyles.summary}>Synthetic practice<span className={sourceStyles.summaryHint}>Three teaching stories with prewritten sentiment</span></summary>
        {practiceOpen && <SyntheticPractice />}
      </details>
    </div>
  </>;
}
