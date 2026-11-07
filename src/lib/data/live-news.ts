/** External presentation only: never an input to frozen fixtures, research evidence, or simulation. */
export const LIVE_NEWS_ELEMENT = "tv-news-feed";
export const LIVE_NEWS_MODULE_URL = "https://widgets.tradingview-widget.com/w/en/tv-news-feed.js";
export const LIVE_NEWS_EXTERNAL_URL = "https://www.tradingview.com/news/";
export const LIVE_NEWS_LOAD_TIMEOUT_MS = 20_000;

let registration: Promise<void> | undefined;

/** Register one official module for every mounted feed and route remount. */
export function ensureLiveNewsModule(): Promise<void> {
  if (typeof customElements === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("This browser cannot load the external news component."));
  }
  if (customElements.get(LIVE_NEWS_ELEMENT)) return Promise.resolve();
  if (registration) return registration;
  registration = new Promise<void>((resolve, reject) => {
    let script = Array.from(document.scripts).find(item => item.src === LIVE_NEWS_MODULE_URL);
    const isNew = !script;
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = LIVE_NEWS_MODULE_URL;
      script.dataset.vammLiveNewsModule = "";
    }
    const moduleScript = script;
    const onError = () => {
      moduleScript.dataset.vammLiveNewsState = "failed";
      reject(new Error("The external news provider could not load."));
    };
    moduleScript.addEventListener("error", onError, { once: true });
    void customElements.whenDefined(LIVE_NEWS_ELEMENT).then(() => {
      moduleScript.dataset.vammLiveNewsState = "registered";
      moduleScript.removeEventListener("error", onError);
      resolve();
    });
    if (moduleScript.dataset.vammLiveNewsState === "failed") onError();
    else if (isNew) document.head.append(moduleScript);
  });
  return registration;
}
