import { describe, expect, it } from "vitest";
import { LIVE_SYMBOL_EXAMPLES, liveSymbolUrl, MAX_LIVE_SYMBOL_LENGTH, normalizeLiveSymbol } from "@/lib/data/live-symbols";
import { getTradingViewWidgetSpec, isLiveCompanySymbol, LIVE_WIDGET_EMBEDS } from "@/lib/data/tradingview-widgets";

describe("broad live widget symbol input", () => {
  it.each([
    [" idx:bbca ", "IDX:BBCA"], ["nyse:ko", "NYSE:KO"], ["NYSE:BRK.B", "NYSE:BRK.B"],
    ["HKEX:0700", "HKEX:0700"], ["TSE:7203", "TSE:7203"], ["LSE:RR.", "LSE:RR."],
    ["XETR:SAP", "XETR:SAP"], ["NSE:RELIANCE", "NSE:RELIANCE"], ["VENUE_1:NEW-STOCK/A", "VENUE_1:NEW-STOCK/A"],
  ])("normalizes an exchange-qualified input without a catalog allowlist: %s", (input, expected) => {
    expect(normalizeLiveSymbol(input)).toBe(expected);
    expect(isLiveCompanySymbol(input)).toBe(true);
  });

  it.each([
    "AAPL", "", ":AAPL", "NASDAQ:", "NASDAQ:AAPL|1D", "NASDAQ:AAPL+NYSE:KO", "NASDAQ:AAPL*2",
    "https://attacker.invalid/", "<script>alert(1)</script>", "NAS DAQ:AAPL", "NASDAQ:A AP",
    "NASDAQ:AAPL?src=x", "NASDAQ:AAPL#x", "NASDAQ:AAPL:MSFT", "NASDAQ:AAPL\nMSFT", "NASDAQ:\u202eAAPL",
    undefined, null, 42,
  ])("rejects malformed or executable input before provider use: %s", input => {
    expect(normalizeLiveSymbol(input)).toBeNull();
  });

  it("bounds configuration size while accepting long qualified names", () => {
    const maximum = "A".repeat(20) + ":" + "B".repeat(40);
    expect(maximum).toHaveLength(MAX_LIVE_SYMBOL_LENGTH);
    expect(normalizeLiveSymbol(maximum)).toBe(maximum);
    expect(normalizeLiveSymbol(maximum + "C")).toBeNull();
    expect(normalizeLiveSymbol("A".repeat(21) + ":B")).toBeNull();
  });

  it("does not turn optional examples into an access restriction", () => {
    expect(LIVE_SYMBOL_EXAMPLES).toContain("IDX:BBCA");
    expect(LIVE_SYMBOL_EXAMPLES).toContain("NYSE:KO");
    const symbol = "NEWVENUE:UNLISTED_EXAMPLE";
    expect((LIVE_SYMBOL_EXAMPLES as readonly string[]).includes(symbol)).toBe(false);
    expect(normalizeLiveSymbol(symbol)).toBe(symbol);
    // Syntax acceptance is not a claim that the provider knows this invented example.
    expect(getTradingViewWidgetSpec("profile", symbol)).toMatchObject({ attributes: { symbol } });
  });

  it("builds the official two-series percentage comparison for any valid pair", () => {
    const spec = getTradingViewWidgetSpec("comparison", " idx:bbca ", "nyse:ko");
    expect(spec).toMatchObject({
      format: "iframe", scriptUrl: LIVE_WIDGET_EMBEDS.comparison,
      configuration: {
        symbols: [["IDX:BBCA", "IDX:BBCA|1D"]], compareSymbol: { symbol: "NYSE:KO" },
        scaleMode: "Percentage", chartOnly: true, dateRanges: ["1w|15", "1m|60", "3m|60", "12m|1D"],
      },
    });
    expect(spec.currencyNote).toContain("own quote currency");
    expect(spec.currencyNote).toContain("No currency conversion");
    expect(spec.currencyNote).not.toContain("USD");
  });

  it("normalizes all company-context provider configurations consistently", () => {
    for (const kind of ["profile", "technical", "fundamentals"] as const) {
      const spec = getTradingViewWidgetSpec(kind, " lse:vod ");
      expect(spec.externalUrl).toContain("/symbols/LSE-VOD/");
      if (spec.format === "web-component") expect(spec.attributes.symbol).toBe("LSE:VOD");
      else expect(spec.configuration.symbol).toBe("LSE:VOD");
    }
  });

  it("rejects canonical duplicates and malformed symbol configurations", () => {
    expect(() => getTradingViewWidgetSpec("comparison", "NYSE:KO", " nyse:ko ")).toThrow(/different/);
    expect(() => getTradingViewWidgetSpec("profile", "NASDAQ:AAPL|1D")).toThrow(RangeError);
    expect(() => getTradingViewWidgetSpec("comparison", "IDX:BBCA", "https://attacker.invalid")).toThrow(RangeError);
  });

  it("encodes punctuation in provider links without permitting URL or path injection", () => {
    expect(liveSymbolUrl("NYSE:BRK.B")).toBe("https://www.tradingview.com/symbols/NYSE-BRK.B/");
    const url = new URL(liveSymbolUrl("VENUE:SHARE/A"));
    expect(url.origin).toBe("https://www.tradingview.com");
    expect(url.pathname).toBe("/symbols/VENUE-SHARE%2FA/");
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
    expect(() => liveSymbolUrl("javascript:alert(1)")).toThrow(RangeError);
  });
});
