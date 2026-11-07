"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { Badge, PageHeading, Panel, styles } from "@/components/features/workspace";
import { LiveNewsFeed } from "@/components/features/live-news";
import sourceStyles from "@/components/features/source-news.module.css";

export default function NewsPage() {
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
          <p className={styles.small}><Link href="/missions?quiz=facts-and-news" className={[styles.button, styles.secondary].join(" ")}>Practice facts vs. opinions</Link></p>
        </Panel>
        <Panel title="Control the pace">
          <p className={[styles.small, styles.muted].join(" ")} style={{ lineHeight: 1.9, margin: 0 }}>Use Hide live feed to stop viewing changing headlines, then Show live feed to reconnect. Headlines come from the provider; VAMM does not assign a live sentiment score. If the feed is unavailable, retry or open TradingView to check its coverage.</p>
        </Panel>
      </div>
    </div>
  </>;
}
