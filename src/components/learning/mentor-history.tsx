"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Result } from "@/contracts";
import { deleteMentorAnswer, listMentorAnswers, saveMentorAnswer, type SavedMentorAnswer } from "@/lib/learning/mentor-history";
import { Badge, LoadingPanel, Panel, styles } from "@/components/features/workspace";
import { MotionBoundary, MotionMark } from "@/components/motion";

const queryKey = ["vamm-mentor-history"];
export function MentorHistory({ current }: { current: SavedMentorAnswer | null }) {
  const client = useQueryClient();
  const history = useQuery({ queryKey, queryFn: async () => {
    const result = await listMentorAnswers();
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }, retry: false, refetchOnWindowFocus: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const entries = history.data ?? [];
  const selected = entries.find(entry => entry.id === opened);
  const pendingDelete = entries.find(entry => entry.id === deleting);
  const saved = Boolean(current && entries.some(entry => entry.id === current.id));
  useEffect(() => {
    if (deleting && !dialog.current?.open) dialog.current?.showModal();
    if (!deleting && dialog.current?.open) dialog.current.close();
  }, [deleting]);
  function closeDelete(deleted = false) {
    dialog.current?.close(); setDeleting(null);
    const target = deleted ? refreshButton.current : deleteTrigger.current;
    if (target?.isConnected) target.focus(); else refreshButton.current?.focus();
  }
  async function mutate(operation: () => Promise<Result<SavedMentorAnswer[]>>, success: string): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setNotice(null);
    try {
      const result = await operation();
      if (!result.ok) { setNotice({ error: true, text: result.error.message }); return false; }
      client.setQueryData(queryKey, result.data);
      setNotice({ error: false, text: success }); return true;
    } catch {
      setNotice({ error: true, text: "Saved research could not be updated. Your current answer remains available; retry the same action." }); return false;
    } finally { lock.current = false; setBusy(false); }
  }
  async function reload() {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const result = await history.refetch();
      setNotice(result.isError ? { error: true, text: result.error.message } : { error: false, text: "Saved research is up to date." });
    } finally { lock.current = false; setBusy(false); }
  }
  return <section aria-label="Saved basket research" className={styles.stack}>
    <Panel title="Your saved research" description="Save an answer when you want to revisit it. Saved questions and answers stay in this browser profile and are visible to anyone using it.">
      <p className={styles.fieldHelp}>Opening an answer does not call the model. Earlier answers are never sent as context for a new question. Up to 100 answers can be saved; delete selected answers to make room.</p>
      {current && <p className={styles.fieldHelp} style={{ overflowWrap: "anywhere" }}>Answer ready to save: {current.question}</p>}
      <div className={styles.actions}>
        {current && <button type="button" className={styles.button} aria-disabled={busy || history.isPending || Boolean(history.error) || saved}
          onClick={() => { if (!busy && !history.isPending && !history.error && !saved) void mutate(() => saveMentorAnswer(current), "Answer saved on this device."); }}>
          {saved ? "Answer saved" : "Save this answer"}
        </button>}
        <button ref={refreshButton} type="button" className={[styles.button, styles.secondary].join(" ")} aria-disabled={busy || history.isFetching}
          onClick={() => { if (!busy && !history.isFetching) void reload(); }}>Refresh saved research</button>
      </div>
      {history.isPending && <LoadingPanel message="Loading saved research…" />}
      {busy && <p role="status"><MotionMark preset="query-inline" state="loading" />Updating saved research…</p>}
      {(notice || history.error) && <p role={notice?.error || history.error ? "alert" : "status"} className={notice?.error || history.error ? styles.error : styles.fieldHelp}>{notice?.text ?? history.error?.message}</p>}
      {!history.isPending && !history.error && entries.length === 0 && <p className={styles.muted}>No saved answers yet. Ask a basket question, then choose Save this answer.</p>}
      <ul className={styles.list}>{entries.map(entry => <li key={entry.id} className={styles.listItem}>
        <div style={{ minWidth: 0, width: "100%", overflowWrap: "anywhere" }}>
          <h3>{entry.question}</h3>
          <p>{new Date(entry.createdAt).toLocaleString("en-GB")} · {entry.response.origin === "prewritten" ? "Prewritten fallback" : "Model-selected explanation"}</p>
          <div className={styles.actions} style={{ marginTop: 10 }}>
            <button type="button" className={[styles.button, styles.secondary].join(" ")} onClick={() => setOpened(entry.id)} aria-expanded={opened === entry.id}>Open saved answer</button>
            <button type="button" className={[styles.button, styles.secondary].join(" ")} aria-disabled={busy} onClick={event => {
              if (busy) return; deleteTrigger.current = event.currentTarget; setDeleting(entry.id);
            }}>Delete saved answer</button>
          </div>
        </div>
      </li>)}</ul>
    </Panel>
    {selected && <MotionBoundary preset="evidence-arrival" state="ready" motionKey={selected.id}>
      <Panel title="Saved answer" action={<Badge>{selected.response.origin === "prewritten" ? "Saved prewritten fallback" : "Saved model-selected explanation"}</Badge>}>
        <h3>{selected.question}</h3><p className={styles.fieldHelp}>Saved snapshot · {selected.instrumentIds.join(", ")} · No new model request</p>
        <div className={styles.answer}><p>{selected.response.summary}</p>
          <h3>Grounded observations</h3><ul>{selected.response.facts.map((fact, index) => <li key={index}>{fact.text}</li>)}</ul>
          <h3>Keep in mind</h3><ul>{selected.response.limitations.map((text, index) => <li key={index}>{text}</li>)}</ul>
          <h3>Evidence at the time</h3><ul>{selected.response.evidence.map(item => <li key={item.id}>{item.title}<span className={styles.source}>{item.dataMode} · {item.observedAt.slice(0, 10)} · {item.datasetVersion}</span></li>)}</ul>
        </div>
        <button type="button" className={[styles.button, styles.secondary].join(" ")} onClick={() => { setOpened(null); refreshButton.current?.focus(); }}>Close saved answer</button>
      </Panel>
    </MotionBoundary>}
    <dialog ref={dialog} aria-labelledby="saved-answer-delete-title" aria-describedby="saved-answer-delete-description"
      style={{ width: "min(480px, calc(100vw - 32px))", border: "1px solid #e4e9f0", borderRadius: 16, padding: 24, background: "#fff", color: "#18273a" }}
      onCancel={event => { event.preventDefault(); if (!busy) closeDelete(); }}>
      <h2 id="saved-answer-delete-title">Delete saved answer?</h2>
      <p id="saved-answer-delete-description" style={{ overflowWrap: "anywhere" }}>{pendingDelete?.question} — This removes this saved answer from this browser. Other research and your simulation stay available.</p>
      {notice?.error && deleting && <p role="alert">{notice.text}</p>}
      <div className={styles.actions}>
        <button type="button" className={[styles.button, styles.secondary].join(" ")} aria-disabled={busy} onClick={() => { if (!busy) closeDelete(); }}>Keep saved answer</button>
        <button type="button" className={styles.button} aria-disabled={busy} onClick={async () => {
          if (busy || !deleting) return;
          const id = deleting;
          if (await mutate(() => deleteMentorAnswer(id), "Saved answer deleted.")) { if (opened === id) setOpened(null); closeDelete(true); }
        }}>Confirm delete answer</button>
      </div>
    </dialog>
  </section>;
}
