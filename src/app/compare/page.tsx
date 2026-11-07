"use client";

import { LiveMarketComparison } from "@/components/features/live-market-comparison";
import { LiveLearningArea } from "@/components/features/live-market-learning";
import { SyntheticCompareLearning } from "@/components/features/live-market-compare-learning";
import { Badge, PageHeading, styles } from "@/components/features/workspace";

export default function ComparePage() {
  return <>
    <PageHeading eyebrow="Look closer" title="Compare real company listings." description="Inspect two NASDAQ companies on the same provider chart and period. Keep the synthetic basket exercise separate.">
      <Badge>Live company comparison</Badge>
    </PageHeading>
    <div className={styles.stack}>
      <LiveMarketComparison />
      <LiveLearningArea title="Synthetic basket comparison" description="The original bonds/equity comparison, frozen synthetic periods, and unavailable teaching-basket fees.">
        <SyntheticCompareLearning />
      </LiveLearningArea>
    </div>
  </>;
}
