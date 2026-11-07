"use client";

import {Badge,PageHeading,styles} from "@/components/features/workspace";
import {LearningActivity} from "@/components/learning/activity";
import {AccountPanel} from "@/components/auth/account-controls";

export default function ProfilePage(){
 return <>
  <PageHeading eyebrow="Your progress, at your pace" title="Learning Profile"
   description="Review your lessons, quiz results, and learning milestones on this device. Optional Google sign-in is separate from your browser-local learning record.">
   <Badge>Browser-local activity</Badge>
  </PageHeading>
  <div className={styles.stack}><AccountPanel/><LearningActivity/></div>
 </>;
}
