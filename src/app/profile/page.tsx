"use client";

import { Badge, PageHeading, styles } from "@/components/features/workspace";
import { LearningActivity } from "@/components/learning/activity";

export default function ProfilePage() {
  return <>
    <PageHeading eyebrow="Your progress, at your pace" title="Learning Profile"
      description="Review your lessons, quiz results, and learning milestones on this device. This local overview does not create an account or rank financial returns.">
      <Badge>Browser-local activity</Badge>
    </PageHeading>
    <div className={styles.stack}><LearningActivity /></div>
  </>;
}
