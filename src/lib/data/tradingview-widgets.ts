/** Provider presentation configuration only. Never financial state or AI evidence. */
import { liveSymbolUrl, normalizeLiveSymbol } from "./live-symbols";

export const LIVE_COMPANIES = [
  { symbol: "NASDAQ:AAPL", name: "Apple", ticker: "AAPL", currency: "USD" },
  { symbol: "NASDAQ:MSFT", name: "Microsoft", ticker: "MSFT", currency: "USD" },
  { symbol: "NASDAQ:GOOGL", name: "Alphabet", ticker: "GOOGL", currency: "USD" },
] as const;
/** Exchange-qualified user input; validated at runtime, not restricted to examples. */
export type LiveCompanySymbol = string;
export type LiveWidgetKind = "summary" | "comparison" | "profile" | "fundamentals" | "technical";
export const LIVE_WIDGET_TIMEOUT_MS = 20_000;
export const LIVE_WIDGET_MODULES = {
  summary: "https://widgets.tradingview-widget.com/w/en/tv-market-summary.js",
  profile: "https://widgets.tradingview-widget.com/w/en/tv-company-profile.js",
  technical: "https://widgets.tradingview-widget.com/w/en/tv-technical-analysis.js",
} as const;
export const LIVE_WIDGET_EMBEDS = {
  comparison: "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js",
  fundamentals: "https://s3.tradingview.com/external-embedding/embed-widget-financials.js",
} as const;

interface WidgetDescription {
  kind: LiveWidgetKind;
  title: string;
  description: string;
  externalUrl: string;
  currencyNote: string;
}
export type TradingViewWidgetSpec = WidgetDescription & (
  { format: "web-component"; element: string; moduleUrl: string; attributes: Record<string, string> } |
  { format: "iframe"; scriptUrl: string; configuration: Record<string, unknown> }
);

export function isLiveCompanySymbol(value: string): value is LiveCompanySymbol {
  return normalizeLiveSymbol(value) !== null;
}
function companyFor(symbol: string) {
  const normalized = normalizeLiveSymbol(symbol);
  if (!normalized) throw new RangeError("Enter an exchange-qualified listing.");
  const known = LIVE_COMPANIES.find(item => item.symbol === normalized);
  return { symbol: normalized, name: known?.name ?? normalized };
}

export function getTradingViewWidgetSpec(kind: LiveWidgetKind, symbol: LiveCompanySymbol = "NASDAQ:AAPL", comparison: LiveCompanySymbol = "NASDAQ:MSFT"): TradingViewWidgetSpec {
  if (!["summary", "comparison", "profile", "fundamentals", "technical"].includes(kind)) throw new RangeError("Choose a supported provider panel.");
  const company = companyFor(symbol);
  const other = companyFor(comparison);
  const symbolUrl = liveSymbolUrl(company.symbol);
  const currencyNote = "Each listing uses its own quote currency. Provider/exchange delays and availability apply. No currency conversion is performed.";
  if (kind === "summary") return {
    kind, title: "Live market summary", description: "Apple, Microsoft, and Alphabet · NASDAQ listings · Provider quotes and market status",
    externalUrl: "https://www.tradingview.com/markets/stocks-usa/", currencyNote: "These summary examples are NASDAQ listings in USD. Provider/exchange delays and availability apply.",
    format: "web-component", element: "tv-market-summary", moduleUrl: LIVE_WIDGET_MODULES.summary,
    attributes: { theme: "light", mode: "custom", "symbol-sectors": JSON.stringify([{ sectionName: "US companies", symbols: LIVE_COMPANIES.map(item => item.symbol) }]), "time-frame": "1D", "layout-mode": "grid", "item-size": "normal" },
  };
  if (kind === "comparison") {
    if (company.symbol === other.symbol) throw new RangeError("Choose two different exchange-qualified listings.");
    return {
      kind, title: "Live company comparison", description: company.name + " and " + other.name + " · Price movement on a percentage scale",
      externalUrl: symbolUrl, currencyNote,
      format: "iframe", scriptUrl: LIVE_WIDGET_EMBEDS.comparison,
      configuration: {
        symbols: [[company.name, company.symbol + "|1D"]], compareSymbol: { symbol: other.symbol, lineColor: "#337d70", lineWidth: 2 },
        chartOnly: true, width: "100%", height: "100%", locale: "en", colorTheme: "light", autosize: true,
        showVolume: false, showMA: false, hideDateRanges: false, hideMarketStatus: false, hideSymbolLogo: false,
        scalePosition: "right", scaleMode: "Percentage", noTimeScale: false, valuesTracking: "1",
        changeMode: "price-only", chartType: "line", lineWidth: 2, lineType: 0,
        dateRanges: ["1w|15", "1m|60", "3m|60", "12m|1D"],
      },
    };
  }
  if (kind === "profile") return {
    kind, title: "Company profile", description: company.name + " · Company description, sector, and industry supplied by TradingView",
    externalUrl: symbolUrl, currencyNote,
    format: "web-component", element: "tv-company-profile", moduleUrl: LIVE_WIDGET_MODULES.profile,
    attributes: { theme: "light", symbol: company.symbol },
  };
  if (kind === "fundamentals") return {
    kind, title: "Company fundamentals", description: company.name + " · Provider financial information and reporting periods",
    externalUrl: symbolUrl + "financials-overview/", currencyNote,
    format: "iframe", scriptUrl: LIVE_WIDGET_EMBEDS.fundamentals,
    configuration: { symbol: company.symbol, colorTheme: "light", displayMode: "regular", isTransparent: false, locale: "en", width: "100%", height: "100%" },
  };
  return {
    kind, title: "Technical context", description: company.name + " · Daily indicator summaries supplied by TradingView",
    externalUrl: symbolUrl + "technicals/", currencyNote,
    format: "web-component", element: "tv-technical-analysis", moduleUrl: LIVE_WIDGET_MODULES.technical,
    attributes: { theme: "light", symbol: company.symbol, interval: "1D" },
  };
}

const registrations = new Map<string, Promise<void>>();
export function ensureTradingViewWidget(spec: Extract<TradingViewWidgetSpec, { format: "web-component" }>): Promise<void> {
  if (!Object.values(LIVE_WIDGET_MODULES).some(url => url === spec.moduleUrl) || spec.moduleUrl !== "https://widgets.tradingview-widget.com/w/en/" + spec.element + ".js") return Promise.reject(new Error("Unsupported provider module."));
  if (typeof document === "undefined" || typeof customElements === "undefined") return Promise.reject(new Error("Custom Elements are unavailable."));
  if (customElements.get(spec.element)) return Promise.resolve();
  const existing = registrations.get(spec.element);
  if (existing) return existing;
  const pending = new Promise<void>((resolve, reject) => {
    let script = Array.from(document.scripts).find(item => item.src === spec.moduleUrl);
    const isNew = !script;
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = spec.moduleUrl;
      script.dataset.vammLiveWidgetModule = spec.element;
    }
    const moduleScript = script;
    const fail = () => { moduleScript.dataset.vammLiveWidgetState = "failed"; reject(new Error("The provider module could not load.")); };
    moduleScript.addEventListener("error", fail, { once: true });
    void customElements.whenDefined(spec.element).then(() => {
      moduleScript.dataset.vammLiveWidgetState = "registered";
      moduleScript.removeEventListener("error", fail);
      resolve();
    });
    if (moduleScript.dataset.vammLiveWidgetState === "failed") fail();
    else if (isNew) document.head.append(moduleScript);
  });
  registrations.set(spec.element, pending);
  return pending;
}
