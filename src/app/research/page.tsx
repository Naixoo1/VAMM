"use client";

import { LiveResearchWorkspace } from "@/components/features/live-research";
import { SyntheticBasketMentor } from "@/components/features/live-research-learning";
import { LiveLearningArea } from "@/components/features/live-market-learning";
import { Badge, PageHeading, styles } from "@/components/features/workspace";

export default function ResearchPage() {
  return <>
    <PageHeading eyebrow="Make curiosity a habit" title="AI Investment Mentor" description="Explore provider company context, then ask the separate basket mentor about its synthetic teaching evidence.">
      <Badge>Company context + basket mentor</Badge>
    </PageHeading>
    <div className={styles.stack}>
      <LiveResearchWorkspace />
      <LiveLearningArea title="Synthetic basket mentor" description="Ask the existing AI form about one or two educational baskets. Live company widgets are outside its evidence.">
        <SyntheticBasketMentor />
      </LiveLearningArea>
    </div>
  </>;
}
