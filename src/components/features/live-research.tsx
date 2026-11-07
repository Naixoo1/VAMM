"use client";

import { useRef, useState, type FormEvent } from "react";
import { MotionMark } from "@/components/motion";
import { LIVE_SYMBOL_EXAMPLES, LIVE_SYMBOL_HELP, LIVE_SYMBOL_SEARCH_URL, MAX_LIVE_SYMBOL_LENGTH, normalizeLiveSymbol } from "@/lib/data/live-symbols";
import { LiveMarketWidget } from "./live-market-widget";
import { styles } from "./workspace";
import liveStyles from "./live-market-widget.module.css";

export function LiveResearchWorkspace() {
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");
  const [draft, setDraft] = useState(symbol);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  function loadCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeLiveSymbol(draft);
    if (!normalized) {
      setError("Enter an exchange-qualified listing such as IDX:BBCA or NYSE:KO.");
      input.current?.focus();
      return;
    }
    setError(null);
    setDraft(normalized);
    setSymbol(normalized);
  }
  return <div className={styles.stack}>
    <section className={liveStyles.selectorPanel} aria-labelledby="live-research-choice-title">
      <h2 id="live-research-choice-title" className={liveStyles.selectorTitle}>Explore a real company</h2>
      <p className={liveStyles.context} id="live-research-help">{LIVE_SYMBOL_HELP} Suggestions are examples, not a restricted list.</p>
      <form onSubmit={loadCompany} noValidate className={liveStyles.symbolForm}>
        <div className={liveStyles.companyField}>
          <label htmlFor="live-research-company">Company context</label>
          <input ref={input} id="live-research-company" type="text" value={draft} list="live-research-examples" maxLength={MAX_LIVE_SYMBOL_LENGTH}
            autoComplete="off" autoCapitalize="characters" spellCheck={false} required aria-invalid={Boolean(error)}
            aria-describedby={"live-research-help" + (error ? " live-research-error" : "")} onChange={event => setDraft(event.target.value)} />
        </div>
        <datalist id="live-research-examples">{LIVE_SYMBOL_EXAMPLES.map(example => <option key={example} value={example} />)}</datalist>
        {error && <div className={liveStyles.inputError} role="alert"><MotionMark preset="empty-line" state="error" /><p id="live-research-error">{error}</p></div>}
        <div className={liveStyles.actions}>
          <button type="submit" className={liveStyles.button}>Load company</button>
          <a className={liveStyles.link} href={LIVE_SYMBOL_SEARCH_URL} target="_blank" rel="noopener noreferrer">Find a stock symbol (opens TradingView)</a>
        </div>
      </form>
      <p className={liveStyles.context}>Showing {symbol}. The provider determines which listings and company reports are available. Check each panel’s reporting period, quote currency, and delays; some company data may be missing.</p>
      <p className={liveStyles.context}>These panels display TradingView’s company information, financial reporting, and technical context. They do not provide facts to the AI form or create live-grounded AI answers. The separate Synthetic basket mentor below uses only its fixed teaching evidence.</p>
    </section>
    <div className={liveStyles.researchGrid}>
      <LiveMarketWidget kind="profile" symbol={symbol} />
      <LiveMarketWidget kind="technical" symbol={symbol} />
      <div className={liveStyles.researchFull}><LiveMarketWidget kind="fundamentals" symbol={symbol} /></div>
    </div>
  </div>;
}
