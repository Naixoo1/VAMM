"use client";

import Link from "next/link";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { getLearningSummary } from "@/lib/learning/progress";
import { getLesson, LESSONS, QUIZ_PACKS } from "@/lib/learning/catalog";
import { Badge, Panel, styles } from "@/components/features/workspace";
import { LearningDisclosure, LearningStatus } from "./shared";

export function LearningActivity({ compact = false }: { compact?: boolean }) {
  const learning = useLearningProgress();
  const summary = learning.progress ? getLearningSummary(learning.progress) : null;
  return <section aria-label="Your learning activity" className={styles.stack}>
    <LearningStatus learning={learning} />
    {summary && <>
      <Panel title={compact ? "Your next step" : "Your learning overview"}
        description="Saved in this browser profile. Learning rewards are separate from investment performance."
        action={compact ? <Link href="/profile" className={[styles.button, styles.secondary].join(" ")}>View learning profile</Link> : undefined}>
        <dl className={styles.grid3}>
          <div><dt className={styles.label}>Lessons completed</dt><dd className={styles.statValue}>{summary.completedLessons} / {LESSONS.length}</dd></div>
          <div><dt className={styles.label}>Academy points</dt><dd className={styles.statValue}>{summary.academyPoints}</dd></div>
          <div><dt className={styles.label}>Learning XP</dt><dd className={styles.statValue}>{summary.xp} XP</dd></div>
        </dl>
        <div className={styles.actions}>
          <Link href="/academy" className={styles.button}>{summary.completedLessons ? "Continue learning" : "Start a lesson"}</Link>
          <Link href="/missions" className={[styles.button, styles.secondary].join(" ")}>Try a quiz</Link>
        </div>
      </Panel>
      {!compact && <>
        <Panel title="Milestone badges" description="Each badge is earned once from completed lessons.">
          <ul className={styles.list}>{summary.milestones.map(milestone => <li key={milestone.points} className={styles.listItem}>
            <div><h3>{milestone.title}</h3><p>{milestone.points} Academy points · {milestone.xp} XP bonus</p></div>
            <Badge tone={milestone.earned ? "muted" : ""}>{milestone.earned ? "Earned" : "Not yet earned"}</Badge>
          </li>)}</ul>
        </Panel>
        <Panel title="Quiz record" description="Repeat a quiz to practice. A pack awards 100 XP only on its first saved pass.">
          <ul className={styles.list}>{QUIZ_PACKS.map(pack => {
            const record = summary.quizzes[pack.id];
            return <li key={pack.id} className={styles.listItem}><div>
              <h3><Link href={"/missions?quiz=" + pack.id}>{pack.title}</Link></h3>
              <p>{record.attemptCount} submitted {record.attemptCount === 1 ? "attempt" : "attempts"} · {record.last ? "Latest " + record.last.score + "% · Best " + record.bestScore + "%" : "No submitted score"}</p>
              <p>{record.rewardEarned ? "First-pass reward earned" : "First-pass reward available"}{record.draft ? " · Saved draft available" : ""}</p>
            </div></li>;
          })}</ul>
        </Panel>
        <Panel title="Completed lessons">
          {learning.progress!.completedLessonIds.length ? <ul className={styles.list}>{learning.progress!.completedLessonIds.map(id => <li key={id} className={styles.listItem}>
            <Link href={"/academy?lesson=" + id}>{getLesson(id)!.title}</Link>
          </li>)}</ul> : <p className={styles.muted}>Your completed lessons will appear here. Start with any course’s first lesson.</p>}
        </Panel>
      </>}
    </>}
    {!compact && <LearningDisclosure />}
  </section>;
}
