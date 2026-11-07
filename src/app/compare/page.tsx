"use client";

import { LiveMarketComparison } from "@/components/features/live-market-comparison";
import { Badge, PageHeading, styles } from "@/components/features/workspace";

export default function ComparePage() {
  return <>
    <PageHeading eyebrow="Look closer" title="Compare real company listings." description="Explore stock combinations across exchanges on the same provider chart and period. Search for a listing or enter its exchange and ticker.">
      <Badge>Live company comparison</Badge>
    </PageHeading>
    <div className={styles.stack}>
      <LiveMarketComparison />
    </div>
  </>;
}
