"use client";

import { useRef, useState, type FormEvent } from "react";
import { MotionBoundary, MotionMark } from "@/components/motion";
import { LIVE_SYMBOL_EXAMPLES, LIVE_SYMBOL_HELP, LIVE_SYMBOL_SEARCH_URL, MAX_LIVE_SYMBOL_LENGTH, normalizeLiveSymbol } from "@/lib/data/live-symbols";
import { LiveMarketWidget } from "./live-market-widget";
import { styles } from "./workspace";
import liveStyles from "./live-market-widget.module.css";

export function LiveMarketComparison() {
  const [selection, setSelection] = useState({ first: "NASDAQ:AAPL", second: "NASDAQ:MSFT" });
  const [first, setFirst] = useState(selection.first);
  const [second, setSecond] = useState(selection.second);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"first" | "second" | null>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const secondInput = useRef<HTMLInputElement>(null);

  function compare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedFirst = normalizeLiveSymbol(first);
    const normalizedSecond = normalizeLiveSymbol(second);
    if (!normalizedFirst || !normalizedSecond || normalizedFirst === normalizedSecond) {
      const field = !normalizedFirst ? "first" : "second";
      setInvalidField(field);
      setError(!normalizedFirst ? "First company: enter an exchange-qualified listing such as IDX:BBCA." :
        !normalizedSecond ? "Second company: enter an exchange-qualified listing such as NYSE:KO." :
        "Choose two different exchange-qualified listings.");
      (field === "first" ? firstInput : secondInput).current?.focus();
      return;
    }
    setError(null);
    setInvalidField(null);
    setFirst(normalizedFirst);
    setSecond(normalizedSecond);
    setSelection({ first: normalizedFirst, second: normalizedSecond });
  }

  return <div className={styles.stack}>
    <section className={liveStyles.selectorPanel} aria-labelledby="live-comparison-choice-title">
      <h2 className={liveStyles.selectorTitle} id="live-comparison-choice-title">Compare company listings</h2>
      <p className={liveStyles.context} id="live-comparison-help">{LIVE_SYMBOL_HELP} Suggestions are examples, not a restricted list.</p>
      <form onSubmit={compare} noValidate className={liveStyles.symbolForm}>
        <div className={liveStyles.controls}>
          {[{ label: "First company", id: "live-first-company", value: first, change: setFirst, field: "first", ref: firstInput },
            { label: "Second company", id: "live-second-company", value: second, change: setSecond, field: "second", ref: secondInput }].map(field => <div className={liveStyles.companyField} key={field.id}>
            <label htmlFor={field.id}>{field.label}</label>
            <input ref={field.ref} id={field.id} type="text" value={field.value} list="live-comparison-examples" maxLength={MAX_LIVE_SYMBOL_LENGTH}
              autoComplete="off" autoCapitalize="characters" spellCheck={false} required
              aria-invalid={invalidField === field.field} aria-describedby={"live-comparison-help" + (invalidField === field.field ? " live-comparison-error" : "")}
              onChange={event => field.change(event.target.value)} />
          </div>)}
        </div>
        <datalist id="live-comparison-examples">{LIVE_SYMBOL_EXAMPLES.map(symbol => <option key={symbol} value={symbol} />)}</datalist>
        {error && <div className={liveStyles.inputError} role="alert"><MotionMark preset="empty-line" state="error" /><p id="live-comparison-error">{error}</p></div>}
        <div className={liveStyles.actions}>
          <button type="submit" className={liveStyles.button}>Compare listings</button>
          <a className={liveStyles.link} href={LIVE_SYMBOL_SEARCH_URL} target="_blank" rel="noopener noreferrer">Find a stock symbol (opens TradingView)</a>
        </div>
      </form>
      <p className={liveStyles.context}>Showing {selection.first} and {selection.second}. The provider overlays price movement on a percentage scale for the selected period. Compare the same chart range and check trading sessions and quote currencies. This is not a currency-adjusted total return; no FX conversion is performed. Quotes may be delayed, and some listings are unavailable in embedded widgets.</p>
    </section>
    <MotionBoundary preset="selection-morph" state="ready" motionKey={selection.first + ":" + selection.second}>
      <LiveMarketWidget kind="comparison" symbol={selection.first} comparison={selection.second} />
    </MotionBoundary>
  </div>;
}
