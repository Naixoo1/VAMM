/** Public widget input syntax only: a match does not verify a listing or data access. */
export const MAX_LIVE_SYMBOL_LENGTH = 61;
export const LIVE_SYMBOL_HELP = "Use EXCHANGE:TICKER, for example IDX:BBCA or NYSE:KO. Only the format is checked here; TradingView determines symbol and data availability.";
export const LIVE_SYMBOL_SEARCH_URL = "https://www.tradingview.com/screener/";
export const LIVE_SYMBOL_EXAMPLES = [
  "NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA", "NYSE:KO", "NYSE:BRK.B",
  "IDX:BBCA", "IDX:BBRI", "HKEX:700", "TSE:7203", "LSE:VOD", "XETR:SAP", "NSE:RELIANCE",
] as const;

export function normalizeLiveSymbol(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  // Excludes markup, URLs, expressions and the widget's pipe-delimited interval syntax.
  if (!/^[A-Za-z0-9_]{1,20}:[A-Za-z0-9][A-Za-z0-9._/-]{0,39}$/.test(value)) return null;
  return value.toUpperCase();
}

export function liveSymbolUrl(input: string): string {
  const symbol = normalizeLiveSymbol(input);
  if (!symbol) throw new RangeError("Enter an exchange-qualified listing.");
  return "https://www.tradingview.com/symbols/" + encodeURIComponent(symbol.replace(":", "-")) + "/";
}
