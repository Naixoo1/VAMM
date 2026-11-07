"use client";

import { TradingViewChart } from "@/components/features/tradingview-chart";
import { LiveMarketWidget } from "@/components/features/live-market-widget";
import { LiveLearningArea } from "@/components/features/live-market-learning";
import { SyntheticDashboardLearning } from "@/components/features/live-market-dashboard-learning";
import { Badge, PageHeading, styles } from "@/components/features/workspace";

export default function DashboardPage() {
  return <>
    <PageHeading eyebrow="A clearer view of the markets" title="Markets, in perspective." description="Explore real company listings and provider market data, then return to the separate learning exercises when you want to practice.">
      <Badge>Live market workspace</Badge>
    </PageHeading>
    <div className={styles.stack}>
      <LiveMarketWidget kind="summary" />
      <TradingViewChart variant="dashboard" />
      <LiveLearningArea title="Synthetic learning baskets" description="Three authored baskets in IDR, the learning path, and the frozen simulation exercise.">
        <SyntheticDashboardLearning />
      </LiveLearningArea>
    </div>
  </>;
}
