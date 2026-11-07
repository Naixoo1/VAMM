"use client";

import { useState, type ReactNode } from "react";
import styles from "./live-market-widget.module.css";

/** Mount lazily, then retain learning form state when the disclosure is closed. */
export function LiveLearningArea({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  return <details className={styles.learning} onToggle={event => { if (event.currentTarget.open) setMounted(true); }}>
    <summary>{title}<span className={styles.hint}>{description}</span></summary>
    {mounted && <div className={styles.learningBody}>{children}</div>}
  </details>;
}
