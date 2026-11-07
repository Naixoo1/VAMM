const {
  lessons, assets, annualRates, inflation, stageAt, scenarios, watchlist, advance, market, sum,
  startingCash, lastMarketDay, stocks, newAccount, portfolio, executeTrade, courses, quizzes, news, academySources,
  quotePrice, quoteSeries, advanceDemoQuotes,
} = simulationModel;

const sections = {
  home: 'Home',
  academy: 'Learning Academy',
  market: 'Market & Simulator',
  mentor: 'AI Investment Mentor',
  missions: 'Missions & Challenges',
  news: 'News & Sentiment Lab',
  profile: 'Demo profile',
};
const marketTabs = {
  tradingview: 'Real Market', stocks: 'Simulator', portfolio: 'Portfolio',
};
const missionTabs = { dashboard: 'Missions', quizzes: 'Quiz Center' };
const prompts = ['What is a stock?', 'Explain the P/E ratio', 'How does diversification work?', 'Review my virtual portfolio'];
const challenges = [
  { id: 'first', title: 'First Investment', description: 'Get a perfect score in the introductory stocks quiz.', quiz: 'stocks', reward: 20 },
  { id: 'diversifier', title: 'Smart Diversifier', description: 'Hold a virtual stock in at least three sectors.', reward: 40 },
  { id: 'detective', title: 'Risk Detective', description: 'Identify five investment risks in the Investment Risks quiz.', quiz: 'risk', reward: 30 },
  { id: 'analyst', title: 'Market Analyst', description: 'Separate facts from opinions in the Fact vs. Opinion quiz.', quiz: 'market-analyst', reward: 25 },
];

const main = document.querySelector('#main');
const workspace = document.querySelector('.workspace');
const sidebar = document.querySelector('#sidebar');
const panel = document.querySelector('#feature-panel');
const panelContent = document.querySelector('#panel-content');
const menu = document.querySelector('#menu');
const backdrop = document.querySelector('#backdrop');
const narrowScreen = window.matchMedia('(max-width: 760px)');
const announcer = document.querySelector('#announcer');

const studentKey = 'caga-caga-student-v1';
const sessionKey = 'caga-caga-sessions-v1';
const memoryOnly = new Set();
let student = loadStudent();
let sessions = loadSessions();
let page = route();
let chat = null;
let journey = null;
let marketView = 'tradingview';
let ticker = stocks[0].ticker;
let stockSearch = '';
let lessonId = null;
let missionView = 'dashboard';
let quizId = null;
let quizAttempt = null;
let scenario = { asset: 0, event: 0, range: 30 };

const rupiahFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const creditFormat = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });
const rupiah = value => value == null || !Number.isFinite(value) ? 'Unavailable' : rupiahFormat.format(value);
const credits = value => value == null || !Number.isFinite(value) ? 'Unavailable' : creditFormat.format(value) + ' credits';
const percent = value => value == null || !Number.isFinite(value) ? 'Unavailable' : percentFormat.format(value);
const signed = (value, format = rupiah) => value == null || !Number.isFinite(value) ? 'Unavailable' : (value > 0 ? '+' : value < 0 ? '−' : '') + format(Math.abs(value));
const date = value => dateFormat.format(new Date(value));
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const idForSession = () => crypto.randomUUID?.() ?? crypto.getRandomValues(new Uint32Array(4)).join('-');
const hasCompleted = id => student.completedLessons.includes(id);
const stockByTicker = symbol => stocks.find(stock => stock.ticker === symbol);
const quizById = id => quizzes.find(quiz => quiz.id === id);
const courseById = id => courses.find(course => course.id === id);

function readStorage(key, fallback) {
  if (memoryOnly.has(key)) return fallback;
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    memoryOnly.add(key);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    memoryOnly.delete(key);
  } catch {
    memoryOnly.add(key);
  }
  renderStorageStatus();
}

function loadStudent(fallback) {
  const fresh = { account: newAccount(), completedLessons: [], quizResults: {}, rewards: [] };
  const stored = readStorage(studentKey, fallback ?? fresh);
  if (stored === null) return fresh;
  const account = stored?.account;
  const valid = Number.isSafeInteger(account?.cash) && account.cash >= 0
    && Number.isInteger(account.day) && account.day >= 0 && account.day <= lastMarketDay
    && account.holdings && Array.isArray(account.trades) && Array.isArray(stored.completedLessons)
    && stored.quizResults && Array.isArray(stored.rewards);
  return valid ? stored : fallback ?? fresh;
}

function loadSessions(fallback = []) {
  const stored = readStorage(sessionKey, fallback);
  if (!Array.isArray(stored)) return [];
  return stored.filter(item => typeof item?.id === 'string' && typeof item.title === 'string'
    && (item.kind === 'chat' || (item.kind === 'sim' && Array.isArray(item.sim?.timeline)))
    && Array.isArray(item.messages));
}

function saveStudent(next) {
  student = next;
  writeStorage(studentKey, student);
}

function saveSession(record) {
  const updated = { ...record, updated: Date.now() };
  sessions = [updated, ...loadSessions(sessions).filter(item => item.id !== updated.id)];
  writeStorage(sessionKey, sessions);
  return updated;
}

function renderStorageStatus() {
  const status = document.querySelector('#storage-status');
  status.hidden = memoryOnly.size === 0;
  status.textContent = memoryOnly.size
    ? 'This browser could not read or save some demo data. Changes may only be available during this visit.'
    : '';
}

function announce(text) {
  announcer.textContent = text;
}

function route() {
  const key = location.hash.slice(1);
  return Object.hasOwn(sections, key) ? key : 'home';
}

function setMenu(open) {
  const overlay = narrowScreen.matches && open;
  panel.hidden = !open;
  backdrop.hidden = !overlay;
  workspace.inert = overlay;
  document.body.classList.toggle('sidebar-collapsed', !open);
  const label = open ? 'Hide sidebar' : 'Show sidebar';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', label);
  menu.title = label;
}

function go(next) {
  page = next;
  if (location.hash !== '#' + next) location.hash = next;
  showPage();
}

function showPage() {
  student = loadStudent(student);
  sessions = loadSessions(sessions);
  if (narrowScreen.matches) setMenu(false);
  render();
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

function rerender(selector = '#view-title') {
  render();
  const target = main.querySelector(selector);
  if (target) target.focus();
}

function heading(kicker, title, description) {
  return `<div class="page-heading"><span class="eyebrow">${kicker}</span><h1 id="view-title" tabindex="-1">${title}</h1>
    <p>${description}</p></div>`;
}

function metric(label, value, detail = '', id = '') {
  return `<div class="metric"><small>${label}</small><strong class="metric-number"${id ? ` id="${id}"` : ''}>${value}</strong>${detail ? `<small${id ? ` id="${id}-detail"` : ''}>${detail}</small>` : ''}</div>`;
}

function chip(label, style = '') {
  return `<span class="chip ${style}">${label}</span>`;
}

function featureImage(id) {
  return `<img src="./images/${id}.svg" width="40" height="40" alt="">`;
}

function gainText(value, format = rupiah) {
  if (value == null || !Number.isFinite(value)) return '<span>Unavailable</span>';
  const color = value > 0 ? 'positive' : value < 0 ? 'negative' : '';
  return `<span class="${color}">${signed(value, format)}</span>`;
}

function bestScore(id) {
  return student.quizResults[id] ?? 0;
}

function xpTotal() {
  const quizXp = sum(quizzes.map(quiz => bestScore(quiz.id) * 10));
  const missionXp = sum(challenges.filter(item => student.rewards.includes(item.id)).map(item => item.reward));
  return quizXp + missionXp;
}

function panelButton(label, data, current = false, extra = '') {
  const title = escape(label);
  return `<button class="panel-link ${extra}" ${data} title="${title}"${current ? ' aria-current="true"' : ''}><span>${title}</span></button>`;
}

function panelGroup(label, items) {
  return `<p class="panel-label">${label}</p><div class="panel-list">${items}</div>`;
}

function renderPanel() {
  let content;
  if (page === 'mentor') {
    const history = sessions.filter(item => item.kind === 'chat' && item.messages.length > 0);
    const items = history.map(item => panelButton(item.title, `data-chat="${escape(item.id)}"`, item.id === chat?.id)).join('');
    content = panelButton('＋ New Chat', 'data-action="new-chat"', false, 'new-chat')
      + panelGroup('Your chats', items || '<p class="panel-empty">Your conversations will appear here.</p>');
  } else if (page === 'academy') {
    content = '<p class="panel-empty">Choose your lesson using the tabs at the top of the page. Complete each step to unlock the next one.</p>';
  } else if (page === 'market') {
    content = panelGroup('Practice Workspace', Object.entries(marketTabs)
      .map(([id, title]) => panelButton(title, `data-market-tab="${id}"`, marketView === id)).join(''));
  } else if (page === 'missions') {
    content = panelGroup('Activities', Object.entries(missionTabs)
      .map(([id, title]) => panelButton(title, `data-mission-tab="${id}"`, missionView === id && !quizId)).join(''));
  } else if (page === 'news') {
    content = panelGroup('Explore', panelButton('News archive', 'data-page="news"', true)
      + panelButton('Try Sentiment Challenge', 'data-quiz="sentiment"'));
  } else if (page === 'profile') {
    content = panelGroup('Student workspace', panelButton('Demo profile', 'data-page="profile"', true)
      + panelButton('Back to Home', 'data-page="home"'));
  } else {
    content = '';
  }
  const scrollTop = panelContent.scrollTop;
  panelContent.innerHTML = content;
  panelContent.scrollTop = scrollTop;
}

function home() {

  const done = student.completedLessons.length;
  const features = [
    ['academy', 'Pick up a short lesson or start with the basics.', 'Explore lessons'],
    ['market', 'Search fictional stocks and place practice orders with your virtual balance.', 'Open the market'],
    ['mentor', 'Ask a question or get feedback on the risk in your virtual portfolio.', 'Ask the mentor'],
    ['missions', 'Test what you know, practice new skills, and earn XP.', 'View challenges'],
    ['news', 'Read dated examples and see the reasoning behind each sentiment label.', 'Explore the news'],
  ];
  return `<div class="screen">
    <section class="hero">
      <div class="hero-content">
        <span class="eyebrow">Student investment lab</span>
        <h1 id="view-title" tabindex="-1">Learn to invest.<span>One move at a time.</span></h1>
        <p>Build your investing skills with short lessons, market stories, and a virtual account to practice what you learn.</p>
      </div>
      <div class="hero-graphic" aria-hidden="true">
        <svg viewBox="0 0 325 207">
          <defs><linearGradient id="hero-fill" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#b5dd97" stop-opacity=".42"/><stop offset="1" stop-color="#b5dd97" stop-opacity="0"/></linearGradient></defs>
          <rect x="1" y="1" width="323" height="205" rx="19" fill="#2a503f" stroke="#779580"/>
          <path d="M25 49H299M25 84H299M25 119H299M25 154H299M62 31V177M118 31V177M174 31V177M230 31V177M286 31V177" fill="none" stroke="#779580" stroke-opacity=".45"/>
          <path d="M27 152 63 141 96 152 128 107 155 115 183 87 210 101 246 61 272 77 296 53V177H27Z" fill="url(#hero-fill)"/>
          <path d="M27 152 63 141 96 152 128 107 155 115 183 87 210 101 246 61 272 77 296 53" fill="none" stroke="#c9e6ab" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="246" cy="61" r="6" fill="#d7ecc3" stroke="#27503a" stroke-width="2"/>
          <path d="M246 61V177" stroke="#d7ecc3" stroke-dasharray="4 5" opacity=".65"/>
        </svg>
        <p>Illustrative market chart</p>
      </div>
    </section>
    <div class="metrics">
      ${metric('Virtual portfolio', rupiah(student.account.cash), 'Available virtual cash')}
      ${metric('Lessons completed', done + ' / ' + courses.length, 'Learning Academy')}
      ${metric('Learning XP', xpTotal() + ' XP', 'Earned in Missions & Challenges')}
    </div>
    <section class="screen" aria-labelledby="available-title">
      <div><h2 id="available-title">What’s on CaGa CaGa</h2><p>Select a feature in the left rail to get started.</p></div>
      <ul class="feature-overview">
        ${features.map(([key, description]) => `<li class="card feature-card" data-accent="${key}">
          ${featureImage(key)}<div><h3>${sections[key]}</h3><p>${description}</p></div>
        </li>`).join('')}
      </ul>
    </section>
  </div>`;
}

function unlockedLesson(id) {
  const index = courses.findIndex(course => course.id === id);
  const next = courses.findIndex(course => !hasCompleted(course.id));
  return index !== -1 && (next === -1 || index <= next || hasCompleted(id));
}

function academy() {
  if (!lessonId || !unlockedLesson(lessonId)) {
    lessonId = courses.find(course => !hasCompleted(course.id))?.id ?? courses[0].id;
  }
  const course = courseById(lessonId);
  const total = student.completedLessons.length;
  return `<div class="screen">
    ${heading('Learn step by step', 'Learning Academy', 'Read a lesson, work through its example, and confirm you understand it before continuing.')}
    <section class="card">
      <div class="row"><h2>Your learning progress</h2>${chip(total + ' of ' + courses.length + ' complete')}</div>
      <progress aria-label="Learning progress" max="${courses.length}" value="${total}">${total} of ${courses.length}</progress>
    </section>
    <div class="lesson-tabs" role="tablist" aria-label="Learning lessons">
      ${courses.map((item, index) => {
        const selected = item.id === lessonId;
        const unlocked = unlockedLesson(item.id);
        return `<button role="tab" id="tab-${item.id}" aria-controls="lesson-panel" aria-selected="${selected}"
          tabindex="${selected ? 0 : -1}" data-lesson="${item.id}"${unlocked ? '' : ' disabled'}>
          <span class="tab-step" aria-hidden="true">${hasCompleted(item.id) ? '✓' : String(index + 1).padStart(2, '0')}</span>
          <span>${item.title}<small>${hasCompleted(item.id) ? 'Completed' : unlocked ? item.level : 'Complete earlier lessons to unlock'}</small></span>
        </button>`;
      }).join('')}
    </div>
    <section id="lesson-panel" role="tabpanel" aria-labelledby="tab-${course.id}">
      ${lessonView(course)}
    </section>
  </div>`;
}

function lessonView(course) {
  const { example } = course;
  const max = Math.max(...example.bars.map(([, value]) => value));
  const isLast = courses.indexOf(course) === courses.length - 1;
  return `<article class="card prose lesson-content">
    <div><span class="eyebrow">Lesson ${courses.indexOf(course) + 1} · ${course.minutes} min</span><h2 id="course-title" tabindex="-1">${course.title}</h2><p>${course.description}</p></div>
    ${course.sections.map(([title, body]) => `<div><h3>${title}</h3><p>${body}</p></div>`).join('')}
    <figure class="example">
      <h3>${example.title}</h3>
      ${example.bars.map(([label, value, display]) => `<div class="bar-row"><span>${label}</span>
        <div class="bar" aria-hidden="true"><span style="--bar-size:${100 * value / max}%"></span></div><strong>${display}</strong></div>`).join('')}
      <figcaption class="chart-caption">${example.caption}</figcaption>
    </figure>
    <div class="lesson-sources"><h3>Read more from the sources</h3>
      <ul>${academySources[course.id].map(source => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.title}<span class="sr"> (opens in a new tab)</span></a></li>`).join('')}</ul>
    </div>
    ${hasCompleted(course.id) ? `<p class="notice">${isLast ? 'You have completed this lesson. You can review your completed lessons using the tabs above.' : 'Lesson complete. The next lesson is ready when you are.'}</p>` : '<p>When the key ideas make sense, mark this lesson complete or continue to the next lesson.</p>'}
    <div class="actions">
      <button data-complete-lesson="${course.id}"${hasCompleted(course.id) ? ' disabled' : ''}>${hasCompleted(course.id) ? '✓ Lesson Complete' : 'Lesson Complete'}</button>
      ${isLast ? '' : `<button class="primary" data-next-lesson="${course.id}">Next Lesson <span aria-hidden="true">→</span></button>`}
    </div>
  </article>`;
}

function lineChart(values, label, tickFormat, eventIndex = null, timeLabel = 'Day') {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const gap = Math.max((high - low) * .12, high * .003, 1);
  const min = low - gap;
  const max = high + gap;
  const y = value => 147 - (value - min) * 117 / (max - min);
  const x = index => 75 + index * 466 / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const last = values.length - 1;
  const color = values[last] >= values[0] ? '#2a7a55' : '#a44636';
  const labels = [min, (min + max) / 2, max];
  return `<svg class="chart" viewBox="0 0 558 178" role="img" aria-label="${escape(label)}">
    <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${color}" stop-opacity=".22"/><stop offset="1" stop-color="${color}" stop-opacity=".02"/></linearGradient></defs>
    ${labels.map(value => `<path d="M75 ${y(value)}H541" stroke="#e2e9e1"/><text x="67" y="${y(value) + 4}" text-anchor="end" fill="#52655b" font-size="12">${tickFormat(value)}</text>`).join('')}
    <polygon points="75,147 ${points} ${x(last)},147" fill="url(#chart-fill)"/>
    ${eventIndex === null ? '' : `<path d="M${x(eventIndex)} 26V147" stroke="#5b7063" stroke-dasharray="4 4"/><text x="${x(eventIndex)}" y="18" text-anchor="middle" fill="#52655b" font-size="12">Event · day ${eventIndex + 1}</text>`}
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x(last)}" cy="${y(values[last])}" r="4.5" fill="${color}" stroke="white" stroke-width="2"/>
    <text x="75" y="168" fill="#52655b" font-size="12">${timeLabel} 1</text><text x="541" y="168" text-anchor="end" fill="#52655b" font-size="12">${timeLabel} ${values.length}</text>
  </svg>`;
}

function marketScreen() {
  const views = { tradingview: tradingViewScreen, stocks: stockMarket, portfolio: portfolioView };
  return `<div class="screen">
    ${heading('Practice Workspace', 'Market &amp; Simulator', 'Use the sidebar to explore Real Market, place virtual orders in Simulator, or review Portfolio.')}
    ${views[marketView]()}
  </div>`;
}

function tradingViewScreen() {
  return `<section class="card tradingview-card">
    <div class="row"><div><p class="eyebrow">TradingView · Daily candles</p><h2>Real Market</h2></div>${chip('External chart', 'neutral')}</div>
    <p>The chart starts with NASDAQ:AAPL. Use its symbol selector to view another company. TradingView quotes may be delayed, and the selected instrument determines the chart currency.</p>
    <div class="live-chart-frame">
      <tv-advanced-chart symbol="NASDAQ:AAPL" interval="1D" theme="dark" allow-symbol-change></tv-advanced-chart>
      <p class="live-chart-status" role="status">Loading the TradingView chart…</p>
    </div>
    <div class="row"><p><small>Simulator orders use generated demo execution prices. TradingView supplies this independent external chart.</small></p><a href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer">Charts by TradingView<span class="sr"> (opens in a new tab)</span></a></div>
  </section>`;
}

function demoQuoteTick(account) {
  const tick = account.quoteTick === undefined ? 0 : account.quoteTick;
  return Number.isSafeInteger(tick) && tick >= 0 ? tick : null;
}

function demoQuotesAvailable(account) {
  const tick = demoQuoteTick(account);
  return tick !== null && tick < Number.MAX_SAFE_INTEGER
    && (account.quoteUpdatedAt === undefined || (account.quoteUpdatedAt === null && tick === 0)
      || (Number.isSafeInteger(account.quoteUpdatedAt) && account.quoteUpdatedAt >= 0
        && account.quoteUpdatedAt <= Date.now() && Number.isFinite(new Date(account.quoteUpdatedAt).getTime())))
    && stocks.every(stock => quotePrice(account, stock) !== null && quoteSeries(account, stock).length > 0);
}

function demoQuoteStatus() {
  const account = student.account;
  if (!demoQuotesAvailable(account)) return 'Demo quote data is unavailable. Orders are paused; stored data has been kept.';
  const updated = account.quoteUpdatedAt ? new Intl.DateTimeFormat('en', { timeStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(account.quoteUpdatedAt) + ' WIB' : 'initial quote';
  return `Simulated stream / Demo source · Quote ${demoQuoteTick(account)} · ${updated}`;
}

function demoQuoteNotice() {
  const available = demoQuotesAvailable(student.account);
  return `<p id="demo-quote-status" class="${available ? 'chart-caption' : 'error'}" role="${available ? 'status' : 'alert'}" aria-live="${available ? 'off' : 'assertive'}">${demoQuoteStatus()}</p>`;
}

function dailyChange(stock) {
  const values = quoteSeries(student.account, stock);
  if (!values.length || quotePrice(student.account, stock) === null) return null;
  if (values.length === 1) return 0;
  return (values.at(-1) - values.at(-2)) / values.at(-2);
}

function stockChart(stock) {
  const values = quoteSeries(student.account, stock);
  if (!values.length || quotePrice(student.account, stock) === null) return '<p class="error">Demo chart data is unavailable. Stored holdings and trades have been kept.</p>';
  const description = `${stock.name} · Generated educational price history from ${rupiah(values[0])} to ${rupiah(values.at(-1))} across ${values.length} quotes. Rolling history keeps up to 60 quotes.`;
  return `${lineChart(values, description, rupiah, null, 'Quote')}<figcaption class="chart-caption">${description}</figcaption>`;
}

function stockRows() {
  const q = stockSearch.trim().toLowerCase();
  const results = stocks.filter(item => [item.ticker, item.name, item.sector].some(value => value.toLowerCase().includes(q)));
  if (!results.length) return '<tr><td colspan="3">No stocks match that search.</td></tr>';
  return results.map(stock => `<tr>
    <th scope="row"><button class="table-link" data-stock="${stock.ticker}"${stock.ticker === ticker ? ' aria-current="true"' : ''}>${stock.ticker}</button><br><small>${stock.name}</small></th>
    <td data-demo-price="${stock.ticker}">${rupiah(quotePrice(student.account, stock))}</td>
    <td data-demo-change="${stock.ticker}">${gainText(dailyChange(stock), percent)}</td>
  </tr>`).join('');
}

function stockMarket() {
  return `<section class="card">
    <div class="row">
      <div><p class="eyebrow">Simulated stream / Demo execution prices</p><h2>Simulator</h2></div>${chip('Generated demo quotes', 'neutral')}
    </div>
    <p>Fictional companies · Virtual IDR. Generated demo prices update every 5 seconds while Simulator or Portfolio is visible. Orders use these generated demo prices.</p>
    ${demoQuoteNotice()}
  </section>
  <div class="split equal">
    <section class="card">
      <h2>Find a stock</h2>
      <label class="field" for="stock-search"><span class="sr">Search by company name, ticker, or sector</span>
        <input type="search" id="stock-search" value="${escape(stockSearch)}" placeholder="Search name or ticker">
      </label>
      <div class="table-wrap"><table><caption class="sr">Fictional stocks and demo execution prices</caption><thead><tr><th scope="col">Company</th><th scope="col">Demo price</th><th scope="col">Latest move</th></tr></thead><tbody id="stock-rows">${stockRows()}</tbody></table></div>
    </section>
    ${stockDetail(stockByTicker(ticker))}
  </div>`;
}

function stockDetail(stock) {
  const { account } = student;
  const current = quotePrice(account, stock);
  const available = demoQuotesAvailable(account);
  return `<section class="card">
    <div class="row"><div><p class="eyebrow">${stock.ticker} · ${stock.sector}</p><h2 id="stock-title" tabindex="-1">${stock.name}</h2></div>${chip('Demo prices')}</div>
    <p>${stock.description}</p>
    <div class="row"><strong id="stock-price">Demo price ${rupiah(current)} per share</strong><span id="stock-change">${gainText(dailyChange(stock), percent)}</span></div>
    <figure id="stock-chart">${stockChart(stock)}</figure>
    <p><small>Sample financials · EPS ${rupiah(stock.eps)} · P/E <span id="stock-pe">${current === null ? 'Unavailable' : (current / stock.eps).toFixed(1) + '×'}</span> · Dividend per share ${rupiah(stock.dividend)}</small></p>
    <form id="trade-form" class="screen" data-quote-tick="${demoQuoteTick(account) ?? ''}" data-quote-price="${current ?? ''}">
      <fieldset class="screen">
        <legend>Place a virtual order</legend>
        <p><small>Orders use the demo price shown above and update your virtual account.</small></p>
        <p id="trade-balance"><small>Cash available ${rupiah(account.cash)} · Shares owned ${account.holdings[stock.ticker]?.quantity ?? 0}</small></p>
        <label class="field" for="trade-quantity">Shares<input id="trade-quantity" name="quantity" type="number" required min="1" step="1" inputmode="numeric" value="1"></label>
        <output id="trade-estimate" for="trade-quantity" class="chart-caption">${available ? 'Demo order value ' + rupiah(current) : 'Demo quote unavailable. Orders are paused.'}</output>
        <p class="error" id="trade-error" role="alert"></p>
        <div class="actions">
          <button class="primary" name="side" value="buy"${available ? '' : ' disabled'}>Buy virtually</button>
          <button name="side" value="sell"${available ? '' : ' disabled'}>Sell virtually</button>
        </div>
      </fieldset>
    </form>
    <p id="trade-result" class="notice" hidden></p>
  </section>`;
}

function portfolioView() {
  const { account } = student;
  const summary = portfolio(account);
  const allocation = [...new Set(summary.positions.map(item => item.stock.sector))].map(sector => [
    sector, summary.total === null ? null : sum(summary.positions.filter(item => item.stock.sector === sector).map(item => item.value)),
  ]);
  allocation.push(['Cash', account.cash]);
  return `<p class="notice">Simulated stream / Demo execution prices. Portfolio values and P&amp;L update with generated demo prices every 5 seconds while this view is visible. TradingView market data is separate.</p>
  ${demoQuoteNotice()}
  <div class="metrics">
    ${metric('Portfolio value', rupiah(summary.total), 'Started at ' + rupiah(startingCash), 'portfolio-total')}
    ${metric('Virtual cash', rupiah(account.cash), 'Available for practice orders', 'portfolio-cash')}
    ${metric('Total virtual return', gainText(summary.gain), signed(summary.gain == null ? null : summary.gain / startingCash, percent), 'portfolio-gain')}
  </div>
  <div class="split">
    <section class="card">
      <div class="row"><h2>Your holdings</h2>${chip(summary.sectors + (summary.sectors === 1 ? ' sector' : ' sectors'))}</div>
      ${summary.positions.length ? `<div class="table-wrap"><table><thead><tr>
        <th scope="col">Stock</th><th scope="col">Shares</th><th scope="col">Value</th><th scope="col">Unrealized gain</th>
      </tr></thead><tbody>${summary.positions.map(item => `<tr>
        <th scope="row"><button class="table-link" data-stock="${item.stock.ticker}">${item.stock.ticker}</button><br><small>${item.stock.sector}</small></th>
        <td>${item.quantity}</td><td data-holding-value="${item.stock.ticker}">${rupiah(item.value)}</td><td data-holding-gain="${item.stock.ticker}">${gainText(item.gain)}</td>
      </tr>`).join('')}</tbody></table></div>` : '<p class="empty">Your first virtual purchase will appear here.</p>'}
      <div class="actions"><button data-mentor="Review my virtual portfolio">Review with Mentor</button></div>
    </section>
    <section class="card"><h2>Asset allocation</h2><p>Share of total portfolio value, including virtual cash.</p>
      ${allocation.map(([name, value]) => {
        const portion = summary.total === null ? null : value / summary.total;
        return `<div class="bar-row" data-portfolio-sector="${escape(name)}"><span>${name}</span><div class="bar" aria-hidden="true"><span style="--bar-size:${portion === null ? 0 : portion * 100}%"></span></div><strong>${percent(portion)}</strong></div>`;
      }).join('')}
    </section>
  </div>
  <section class="card">
    <h2>Transaction history</h2>
    ${account.trades.length ? `<div class="table-wrap"><table><thead><tr>
      <th scope="col">Date</th><th scope="col">Order</th><th scope="col">Shares</th><th scope="col">Demo price</th><th scope="col">Total</th>
    </tr></thead><tbody>${account.trades.map(item => `<tr>
      <td>${date(item.timestamp)} · ${item.quoteTick === undefined ? 'Day ' + (item.day + 1) : 'Demo quote ' + item.quoteTick}</td><th scope="row">${item.side === 'buy' ? 'Buy' : 'Sell'} ${escape(item.ticker)}</th>
      <td>${item.quantity}</td><td>${rupiah(item.price)}</td><td>${rupiah(item.value)}</td>
    </tr>`).join('')}</tbody></table></div>` : '<p class="empty">Your virtual orders will appear here after you place a trade.</p>'}
  </section>`;
}

function updateTradeEstimate() {
  const input = main.querySelector('#trade-quantity');
  if (!input) return;
  const price = quotePrice(student.account, stockByTicker(ticker));
  const available = demoQuotesAvailable(student.account);
  const quantity = input.valueAsNumber;
  const value = price === null ? null : price * quantity;
  main.querySelector('#trade-estimate').textContent = !available
    ? 'Demo quote unavailable. Orders are paused.'
    : Number.isSafeInteger(quantity) && quantity > 0 && Number.isSafeInteger(value)
      ? 'Demo order value ' + rupiah(value) : 'Enter a whole number of shares with a safe order value.';
  main.querySelectorAll('#trade-form button').forEach(button => { button.disabled = !available; });
}

function refreshDemoQuotes() {
  const status = main.querySelector('#demo-quote-status');
  if (!status) return;
  const account = student.account;
  const available = demoQuotesAvailable(account);
  status.className = available ? 'chart-caption' : 'error';
  status.setAttribute('role', available ? 'status' : 'alert');
  status.setAttribute('aria-live', available ? 'off' : 'assertive');
  status.textContent = demoQuoteStatus();
  if (marketView === 'stocks') {
    main.querySelectorAll('[data-demo-price]').forEach(cell => {
      cell.textContent = rupiah(quotePrice(account, stockByTicker(cell.dataset.demoPrice)));
    });
    main.querySelectorAll('[data-demo-change]').forEach(cell => {
      cell.innerHTML = gainText(dailyChange(stockByTicker(cell.dataset.demoChange)), percent);
    });
    const stock = stockByTicker(ticker);
    const price = quotePrice(account, stock);
    main.querySelector('#stock-price').textContent = 'Demo price ' + rupiah(price) + ' per share';
    main.querySelector('#stock-change').innerHTML = gainText(dailyChange(stock), percent);
    main.querySelector('#stock-chart').innerHTML = stockChart(stock);
    main.querySelector('#stock-pe').textContent = price === null ? 'Unavailable' : (price / stock.eps).toFixed(1) + '×';
    main.querySelector('#trade-balance small').textContent = `Cash available ${rupiah(account.cash)} · Shares owned ${account.holdings[stock.ticker]?.quantity ?? 0}`;
    const form = main.querySelector('#trade-form');
    form.dataset.quoteTick = demoQuoteTick(account) ?? '';
    form.dataset.quotePrice = price ?? '';
    updateTradeEstimate();
  } else if (marketView === 'portfolio') {
    const summary = portfolio(account);
    main.querySelector('#portfolio-total').textContent = rupiah(summary.total);
    main.querySelector('#portfolio-cash').textContent = rupiah(account.cash);
    main.querySelector('#portfolio-gain').innerHTML = gainText(summary.gain);
    main.querySelector('#portfolio-gain-detail').textContent = signed(summary.gain == null ? null : summary.gain / startingCash, percent);
    main.querySelectorAll('[data-holding-value]').forEach(cell => {
      cell.textContent = rupiah(summary.positions.find(item => item.stock.ticker === cell.dataset.holdingValue)?.value);
    });
    main.querySelectorAll('[data-holding-gain]').forEach(cell => {
      cell.innerHTML = gainText(summary.positions.find(item => item.stock.ticker === cell.dataset.holdingGain)?.gain);
    });
    main.querySelectorAll('[data-portfolio-sector]').forEach(row => {
      const sector = row.dataset.portfolioSector;
      const value = summary.total === null ? null : sector === 'Cash' ? account.cash : sum(summary.positions.filter(item => item.stock.sector === sector).map(item => item.value));
      const portion = summary.total === null ? null : value / summary.total;
      row.querySelector('.bar span').style.setProperty('--bar-size', (portion === null ? 0 : portion * 100) + '%');
      row.querySelector('strong').textContent = percent(portion);
    });
  }
}

function createJourney(example = false) {
  const record = {
    id: idForSession(), kind: 'sim', title: example ? 'Example · First allowance' : 'Life-stage simulation', messages: [],
    sim: { allowance: example ? 50 : 25, weights: example ? [40, 20, 40] : [50, 20, 30], month: 0, balances: [0, 0, 0], timeline: [] },
  };
  return example ? stepJourney(record, record.sim, 12) : record;
}

function stepJourney(record, plan, months) {
  const { balances, ...entry } = advance(plan, months);
  return saveSession({ ...record, sim: { ...plan, balances, month: entry.month, timeline: [...plan.timeline, entry] } });
}

function lifeEvent(event) {
  const limit = event.amount !== event.impact ? ` (modeled expense ${credits(-event.amount)}, limited to available funds)` : '';
  return `${event.name} · ${signed(event.impact, credits)}${limit}`;
}

function journeySummary(record) {
  const entry = record?.sim.timeline.at(-1);
  if (!entry) return 'Advance the timeline to compare your balance with its buying power after inflation.';
  const impacts = entry.impacts.length ? entry.impacts.map(lifeEvent).join('. ') + '.' : 'No life event occurred in this step.';
  return `You added ${credits(entry.contributions)} in allowance. Growth added ${credits(entry.growth)}. ${impacts} Your balance of ${credits(entry.nominal)} has the buying power of ${credits(entry.real)} at starting prices.`;
}

function journeyView() {
  const saved = sessions.filter(item => item.kind === 'sim');
  const sim = journey?.sim;
  const latest = sim?.timeline.at(-1);
  return `<section class="card">
    <div class="row"><div><p class="eyebrow">Modeled results · Fictional credits</p><h2>Life-stage lab</h2></div>
      <div class="actions"><button data-action="journey-start">Start a simulation</button><button data-action="journey-example">Try an example</button></div>
    </div>
    <p>Explore how compounding, inflation, and life events can affect your buying power.</p>
    ${saved.length ? `<details><summary>Saved simulations</summary><div class="actions">
      ${saved.map(item => `<button data-journey="${escape(item.id)}" aria-pressed="${item.id === journey?.id}">${escape(item.title)} · Month ${item.sim.month}</button>`).join('')}
    </div></details>` : ''}
  </section>
  ${sim ? `<section class="card">
    <h2>Plan your next step</h2>
    <form id="journey-form" class="screen">
      <label class="field">Monthly allowance (credits)<input name="allowance" type="number" min="0" max="10000" step=".01" required value="${sim.allowance}"></label>
      <fieldset><legend>Allocation (must total 100%)</legend><div class="fields">
        ${assets.map((asset, index) => `<label>${asset} (%)<input name="weight" type="number" required min="0" max="100" step="1" value="${sim.weights[index]}"></label>`).join('')}
      </div></fieldset>
      <p id="journey-error" class="error" role="alert"></p>
      <div class="actions"><button class="primary" name="months" value="6">Advance 6 months</button><button name="months" value="12">Advance 1 year</button></div>
      <p><small>Fixed annual demo rates · ${assets.map((asset, index) => asset + ' ' + percent(annualRates[index])).join(' · ')} · Inflation ${percent(inflation)}</small></p>
    </form>
  </section>
  <section class="card"><div class="row"><h2>${stageAt(sim.month)}</h2>${chip('Month ' + sim.month)}</div>
    <div class="metrics">${metric('Nominal balance', credits(latest?.nominal ?? 0))}${metric('In starting prices', credits(latest?.real ?? 0))}</div>
    <p>${assets.map((asset, index) => asset + ' ' + credits(sim.balances[index])).join(' · ')}</p>
    <p>${journeySummary(journey)}</p>
    <div class="actions"><button data-mentor="Explain my life-stage result">Discuss with Mentor</button></div>
  </section>
  <section class="card"><h2>Timeline</h2>
    ${latest ? `<div class="table-wrap"><table><thead><tr><th scope="col">Month / stage</th><th scope="col">Nominal</th><th scope="col">In starting prices</th><th scope="col">Life event</th></tr></thead><tbody>
      ${sim.timeline.map(item => `<tr><th scope="row">${item.month} · ${stageAt(item.month)}</th><td>${credits(item.nominal)}</td><td>${credits(item.real)}</td><td>${item.impacts.map(lifeEvent).join('<br>') || 'No event'}</td></tr>`).join('')}
    </tbody></table></div>` : '<p>Your timeline starts when you advance the simulation.</p>'}
  </section>
  ${journey.messages.length ? `<section class="card"><h2>Saved reflections</h2><div class="log">${messageBubbles(journey.messages)}</div></section>` : ''}` : ''}`;
}

function scenarioResult() {
  return market(scenario.asset, scenario.event, scenario.range);
}

function scenarioExplanation(result) {
  const direction = result.change > 0 ? 'rise' : 'fall';
  return `${result.scenario.cause} The model assumes a ${percent(Math.abs(result.change))} price ${direction} for ${result.asset.name}. A sample portfolio with ${result.shares} shares changes by ${signed(result.impact, credits)}.`;
}

function scenariosView() {
  const result = scenarioResult();
  const choices = (items, key) => items.map(([value, label]) => `<button data-scenario="${key}" data-value="${value}" aria-pressed="${scenario[key] === value}">${label}</button>`).join('');
  const values = Array.from({ length: scenario.range }, (_, index) => index < result.eventDay - 1 ? result.asset.price : result.end);
  return `<section class="card">
    <div><p class="eyebrow">Standalone scenario · Fictional credits</p><h2>Explore a price shock</h2></div>
    <p>Change the event and see how the sample portfolio reacts. The practice trading account has its own market prices.</p>
    <div class="actions" aria-label="Select asset">${choices(watchlist.map((item, index) => [index, item.name]), 'asset')}</div>
    <div class="actions" aria-label="Select event">${choices(scenarios.map((item, index) => [index, item.name]), 'event')}</div>
    <div class="actions" aria-label="Select chart range">${choices([[30, '30 days'], [90, '90 days']], 'range')}</div>
  </section>
  <section class="card"><div class="row"><h2>${result.asset.name}</h2>${chip('Simulated prices')}</div>
    <figure>${lineChart(values, `${result.asset.name} from ${credits(result.asset.price)} to ${credits(result.end)} after ${result.scenario.event}`, value => creditFormat.format(value), result.eventDay - 1)}
      <figcaption class="chart-caption">Day ${result.eventDay} · ${result.scenario.event} · ${signed(result.change, percent)}</figcaption>
    </figure>
    <p>${scenarioExplanation(result)}</p>
    <p>Reflection · Would this change matter differently if you needed the money next week?</p>
    <div class="actions"><button data-mentor="Explain the simulated market scenario">Discuss with Mentor</button></div>
  </section>
  <div class="metrics">
    ${metric('Sample starting funds', credits(result.startingFunds))}
    ${metric('Sample cash balance', credits(result.cash))}
    ${metric('Sample portfolio', credits(result.total), signed(result.impact, credits))}
  </div>`;
}


function missionStatus(item) {
  if (student.rewards.includes(item.id)) return 'Completed';
  if (item.quiz) {
    const required = quizById(item.quiz).questions.length;
    if (bestScore(item.quiz) === required) return 'Ready to claim';
    return Object.hasOwn(student.quizResults, item.quiz) ? 'In progress' : 'Available';
  }
  const { sectors } = portfolio(student.account);
  if (sectors >= 3) return 'Ready to claim';
  return sectors ? 'In progress' : 'Available';
}

function missionsScreen() {
  return `<div class="screen">
    ${heading('Practice and progress', 'Missions &amp; Challenges', 'Find all quizzes here, complete practice missions, and earn XP for what you learn.')}
    <div class="actions tab-row" aria-label="Mission views">
      ${Object.entries(missionTabs).map(([id, label]) => `<button data-mission-tab="${id}" aria-pressed="${missionView === id}">${label}</button>`).join('')}
    </div>
    ${quizId ? quizView(quizById(quizId)) : missionView === 'dashboard' ? missionDashboard() : quizCenter()}
  </div>`;
}

function missionDashboard() {
  const { sectors } = portfolio(student.account);
  return `<div class="metrics">
    ${metric('Learning XP', xpTotal() + ' XP', 'Best quiz scores and mission rewards')}
    ${metric('Missions completed', student.rewards.length + ' / ' + challenges.length)}
    ${metric('Quizzes attempted', quizzes.filter(quiz => Object.hasOwn(student.quizResults, quiz.id)).length + ' / ' + quizzes.length)}
  </div>
  <div class="split equal">
    ${challenges.map(item => {
      const status = missionStatus(item);
      return `<article class="card">
        <div class="row">${chip(status, status === 'Ready to claim' ? 'gold' : '')}<small>+${item.reward} XP</small></div>
        <h2>${item.title}</h2><p>${item.description}</p>
        ${item.id === 'diversifier' ? `<p class="progress-line"><progress max="3" value="${Math.min(sectors, 3)}" aria-label="Sectors in portfolio"></progress><span>${Math.min(sectors, 3)} of 3 sectors</span></p>` : ''}
        <div class="actions">
          ${status === 'Ready to claim' ? `<button class="primary" data-claim="${item.id}">Claim ${item.reward} XP</button>` : ''}
          ${status === 'Available' || status === 'In progress'
            ? item.quiz ? `<button data-quiz="${item.quiz}">Open quiz</button>` : '<button data-market-tab="stocks">Open demo market</button>'
            : ''}
        </div>
      </article>`;
    }).join('')}
  </div>`;
}

function quizCenter() {
  return `<section class="card"><h2>Quiz Center</h2><p>Get feedback on each answer. Each correct answer in your best attempt earns 10 XP.</p>
    <div class="lesson-list">${quizzes.map(quiz => {
      const attempted = Object.hasOwn(student.quizResults, quiz.id);
      return `<article class="lesson-row">
        <span class="lesson-number" aria-hidden="true">${bestScore(quiz.id) === quiz.questions.length ? '✓' : '?'}</span>
        <div><h3>${quiz.title}</h3><small>${quiz.questions.length} questions · ${attempted ? 'Best ' + bestScore(quiz.id) + ' / ' + quiz.questions.length : 'Ready to start'}</small><p>${quiz.description}</p></div>
        <button data-quiz="${quiz.id}" aria-label="${attempted ? 'Retry' : 'Start'} ${quiz.title}">${attempted ? 'Retry' : 'Start quiz'}</button>
      </article>`;
    }).join('')}</div>
  </section>`;
}

function quizView(quiz) {
  return `<section class="card prose">
    <div class="row"><h2 id="quiz-title" tabindex="-1">${quiz.title}</h2>${chip(quiz.questions.length + ' questions')}</div>
    ${quizAttempt ? `<p class="notice" tabindex="-1" id="quiz-result">Score ${quizAttempt.score} / ${quiz.questions.length} · ${quizAttempt.xp ? '+' + quizAttempt.xp + ' XP earned' : 'Best score kept'}</p>` : '<p>Choose an answer for each question to see how you did.</p>'}
    <form id="quiz-form" class="screen">
      ${quiz.questions.map((question, index) => {
        const selected = quizAttempt?.answers[index];
        const correct = selected === question.answer;
        return `<fieldset class="question"${quizAttempt ? ' disabled' : ''}>
          <legend>${index + 1}. ${question.prompt}</legend>
          ${question.choices.map((choice, option) => `<label class="option">
            <input type="radio" name="answer-${index}" value="${option}" required${option === selected ? ' checked' : ''}>${choice}
          </label>`).join('')}
          ${quizAttempt ? `<p class="answer-feedback"><strong class="${correct ? 'positive' : 'negative'}">${correct ? 'Correct' : 'Correct answer · ' + question.choices[question.answer]}</strong>${question.why}</p>` : ''}
        </fieldset>`;
      }).join('')}
      <div class="actions">
        ${quizAttempt ? '<button class="primary" type="button" data-action="retry-quiz">Try again</button>' : '<button class="primary">Check answers</button>'}
        <button type="button" data-mission-tab="quizzes">All quizzes</button>
        ${quizAttempt ? '<button type="button" data-mission-tab="dashboard">View missions</button>' : ''}
      </div>
    </form>
  </section>`;
}

function newsScreen() {
  const styles = { Neutral: 'neutral', Positive: '', Negative: 'negative' };
  return `<div class="screen">
    ${heading('Dated news archive', 'News &amp; Sentiment Lab', 'Read examples from official sources, then examine what each sentiment label describes.')}
    <section class="card">
      <div class="row"><h2>Read the evidence</h2>${chip('Curated examples')}</div>
      <p>Sentiment describes the information in an article. Prices can respond differently as expectations and other news change.</p>
      <div class="actions"><button class="primary" data-quiz="sentiment">Try Sentiment Challenge <span aria-hidden="true">→</span></button></div>
    </section>
    ${news.map(story => `<article class="card news-story">
      <div class="row"><p class="eyebrow">${story.topic}</p>${chip(story.sentiment, styles[story.sentiment])}</div>
      <h2>${story.title}</h2>
      <small>${story.publisher} · <time datetime="${story.date}">${date(story.date)}</time></small>
      <p>${story.summary}</p>
      <details><summary>Why ${story.sentiment.toLowerCase()}?</summary><p>${story.reasoning}</p></details>
      <div class="actions"><a class="button" href="${story.url}" target="_blank" rel="noopener noreferrer">Read source <span aria-hidden="true">↗</span><span class="sr"> (opens in a new tab)</span></a></div>
    </article>`).join('')}
  </div>`;
}

function profileScreen() {
  const summary = portfolio(student.account);
  return `<div class="screen">
    ${heading('Your workspace', 'Demo profile', 'See the learning and investing activity saved in this browser.')}
    <section class="card">
      <div class="profile-name"><span class="avatar" aria-hidden="true">ST</span><div><h2>Student</h2><p>Local demo profile</p></div></div>
      <p>On this device, your completed lessons, scores, virtual trades, and conversations stay available between visits.</p>
    </section>
    <div class="metrics">
      ${metric('Lessons completed', student.completedLessons.length + ' / ' + courses.length)}
      ${metric('Learning XP', xpTotal() + ' XP')}
      ${metric('Virtual portfolio value', rupiah(summary.total))}
    </div>
    <section class="card"><h2>Demo session</h2><p>End this session to open a fresh Mentor chat. You can still reopen saved chats from the sidebar.</p>
      <div class="actions"><button data-action="end-demo">End demo session</button></div>
    </section>
  </div>`;
}

function messageBubbles(items) {
  return items.map(item => {
    const isStudent = item.role === 'You';
    return `<div class="bubble${isStudent ? ' user' : ''}"><strong>${isStudent ? 'You' : 'Mentor'}</strong><p>${escape(item.text)}</p></div>`;
  }).join('');
}

function mentor() {
  const messages = chat?.messages ?? [];
  return `<div class="screen chat-screen">
    <div class="row">
      <h1 class="sr" id="view-title" tabindex="-1">AI Investment Mentor</h1>
      <span class="eyebrow">Learning conversation</span>${chip('Scripted demo', 'neutral')}
    </div>
    ${messages.length ? `<div class="log" role="log" aria-label="Conversation">${messageBubbles(messages)}</div>` : `<div class="chat-intro">
      ${featureImage('mentor')}
      <h2>What would you like to learn?</h2>
      <p>Ask about an investing term or look at the risk in your virtual portfolio.</p>
      <div class="prompt-grid" aria-label="Suggested prompts">${prompts.map(prompt => `<button data-prompt="${escape(prompt)}">${prompt} <span aria-hidden="true">↗</span></button>`).join('')}</div>
    </div>`}
    <div class="composer-wrap">
      <form id="mentor-form" class="composer">
        <label class="sr" for="message">Ask the mentor</label>
        <input id="message" name="message" required maxlength="500" placeholder="Ask about investing…" autocomplete="off">
        <button class="primary">Send <span aria-hidden="true">↑</span></button>
      </form>
      <small>Practice and learning with virtual money.</small>
    </div>
  </div>`;
}

function mentorReply(question) {
  const text = question.toLowerCase();
  if (/should i (buy|sell|invest)|recommend.*(stock|invest)|which stock|guarantee.*(return|profit)|forecast.*price/.test(text)) {
    return 'We can practice comparing virtual holdings, risk, and time horizon. What would you want to check before interpreting a stock’s recent change?';
  }
  if (/portfolio|my holdings/.test(text)) {
    const summary = portfolio(student.account);
    if (summary.total === null || summary.invested === null) return 'Some demo quotes are unavailable. Portfolio valuation and holding weights are currently unavailable. Your saved holdings and trades remain available.';
    if (!summary.positions.length) return 'Your practice portfolio currently holds only virtual cash. After a practice purchase, we can look at how much of the invested amount depends on one company or sector.';
    const largest = summary.positions.reduce((a, b) => a.value >= b.value ? a : b);
    return `Your portfolio holds ${summary.positions.length} ${summary.positions.length === 1 ? 'company' : 'companies'} across ${summary.sectors} ${summary.sectors === 1 ? 'sector' : 'sectors'}. ${largest.stock.name} accounts for ${percent(largest.value / summary.invested)} of the money invested in stocks. If that holding falls, it can have a noticeable effect on the invested portion. What would happen if several of your holdings moved together?`;
  }
  if (/life.stage/.test(text)) return journeySummary(journey);
  if (/market scenario|price shock/.test(text)) return scenarioExplanation(scenarioResult());
  if (/p\s*\/\s*e\b|price.to.earnings/.test(text)) {
    return 'P/E stands for price-to-earnings. Divide share price by earnings per share. A share priced at Rp2,000 with Rp100 in earnings per share has a P/E of 20×. Other context, like growth and debt, matters when you compare two companies.';
  }
  if (/market cap/.test(text)) return 'Market capitalization is a company’s share price multiplied by its total shares outstanding. It describes how the market values the company’s equity at that price.';
  if (/dividend/.test(text)) return 'A dividend is a payment a company may make to shareholders. The company can change the amount or skip the payment as its finances and plans change.';
  const topic = [
    [/compound/, 'Compounding'], [/inflat|buying power/, 'Inflation'], [/diversif/, 'Diversification'],
    [/emergen|saving/, 'Emergency savings'], [/risk|loss/, 'Risk'],
  ].find(([pattern]) => pattern.test(text));
  if (topic) return lessons[topic[1]];
  if (/\bstocks?\b|\bshares?\b/.test(text)) {
    return 'A stock is a unit of ownership in a company. You can gain when its price rises or when the company pays a dividend. The price can also fall. The Academy has a short lesson on how this works.';
  }
  return 'In this demo I can explain stocks, dividends, P/E, market cap, diversification, and the risk in your virtual portfolio. Try one of those topics.';
}

function sendMentor(question) {
  const text = question.trim();
  if (!text) {
    main.querySelector('#message').value = '';
    main.querySelector('#message').focus();
    return;
  }
  sessions = loadSessions(sessions);
  const record = sessions.find(item => item.id === chat?.id) ?? chat ?? {
    id: idForSession(), kind: 'chat', title: text.length > 46 ? text.slice(0, 46) + '…' : text, messages: [],
  };
  student = loadStudent(student);
  const reply = mentorReply(text);
  chat = saveSession({
    ...record,
    messages: [...record.messages, { role: 'You', text }, { role: 'Mentor', text: reply }],
  });
  render();
  focusComposer();
  announce('Mentor replied. ' + reply);
}

function focusComposer(prompt = '') {
  const input = main.querySelector('#message');
  input.value = prompt;
  input.focus({ preventScroll: true });
  window.scrollTo(0, document.documentElement.scrollHeight);
}

function render() {
  const views = { home, academy, market: marketScreen, mentor, missions: missionsScreen, news: newsScreen, profile: profileScreen };
  document.querySelector('#feature-title').textContent = page === 'home' ? 'Home' : sections[page];
  document.querySelector('#location').textContent = sections[page];
  document.title = sections[page] + ' | CaGa CaGa';
  sidebar.querySelectorAll('.feature-rail button').forEach(button => {
    if (button.dataset.page === page) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  renderPanel();
  renderStorageStatus();
  main.innerHTML = views[page]();
}

function openLesson(id) {
  if (id && !unlockedLesson(id)) {
    announce('Complete the earlier lessons to unlock this lesson.');
    return;
  }
  lessonId = id;
  go('academy');
  const activeTab = main.querySelector('[role="tab"][aria-selected="true"]');
  const tabList = main.querySelector('.lesson-tabs');
  if (activeTab && tabList) tabList.scrollLeft = Math.max(0, activeTab.offsetLeft - tabList.offsetLeft - 16);
}

function openMarket(view, focus) {
  marketView = Object.hasOwn(marketTabs, view) ? view : 'tradingview';
  go('market');
  if (focus) main.querySelector(focus)?.focus();
}

function openMissions(view, quiz = null) {
  missionView = view;
  quizId = quiz;
  quizAttempt = null;
  go('missions');
  if (quiz) main.querySelector('#quiz-title').focus();
}

function completeLesson(id) {
  if (!unlockedLesson(id)) return;
  const latest = loadStudent(student);
  if (!latest.completedLessons.includes(id)) {
    saveStudent({ ...latest, completedLessons: [...latest.completedLessons, id] });
  }
  const last = courses.findIndex(course => course.id === id) === courses.length - 1;
  rerender(last ? '#course-title' : '[data-next-lesson]');
  announce('Lesson complete. Your progress has been saved.');
}

function nextLesson(id) {
  if (!unlockedLesson(id)) return;
  const latest = loadStudent(student);
  if (!latest.completedLessons.includes(id)) {
    saveStudent({ ...latest, completedLessons: [...latest.completedLessons, id] });
  }
  const next = courses[courses.findIndex(course => course.id === id) + 1];
  if (next) {
    openLesson(next.id);
    main.querySelector('#course-title').focus({ preventScroll: true });
    announce('Lesson complete. Next lesson opened.');
  }
}

function claimReward(id) {
  student = loadStudent(student);
  const item = challenges.find(challenge => challenge.id === id);
  if (!item || missionStatus(item) !== 'Ready to claim') return;
  saveStudent({ ...student, rewards: [...student.rewards, id] });
  rerender();
  announce('Mission completed. You earned ' + item.reward + ' XP.');
}

function tickDemoQuotes() {
  if (document.hidden || page !== 'market' || !['stocks', 'portfolio'].includes(marketView)) return;
  const latest = loadStudent(student);
  const next = advanceDemoQuotes(latest.account, Date.now());
  student = latest;
  if (next !== latest.account) saveStudent({ ...latest, account: next });
  refreshDemoQuotes();
}

const actions = {
  'new-chat': startChat,
  'end-demo': startChat,
  'retry-quiz': () => {
    quizAttempt = null;
    rerender('#quiz-title');
  },
  'journey-start': () => {
    journey = createJourney();
    openMarket('journey', '#journey-form input');
  },
  'journey-example': () => {
    journey = createJourney(true);
    openMarket('journey', '#journey-form input');
  },
};

function startChat() {
  chat = null;
  go('mentor');
  focusComposer();
  announce('New chat started.');
}

function closeSidebar() {
  setMenu(false);
  menu.focus();
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button === backdrop || button.id === 'close-panel') {
    closeSidebar();
    return;
  }
  if (button === menu) {
    const opening = panel.hidden;
    setMenu(opening);
    if (opening && narrowScreen.matches) document.querySelector('#close-panel').focus();
    return;
  }

  const data = button.dataset;
  if (data.page) go(data.page);
  else if (data.action) actions[data.action]?.();
  else if (data.lesson) openLesson(data.lesson);
  else if (data.completeLesson) completeLesson(data.completeLesson);
  else if (data.nextLesson) nextLesson(data.nextLesson);
  else if (data.quiz) openMissions('quizzes', data.quiz);
  else if (data.missionTab) openMissions(data.missionTab);
  else if (data.claim) claimReward(data.claim);
  else if (data.marketTab) openMarket(data.marketTab);
  else if (data.stock) {
    ticker = data.stock;
    openMarket('stocks', '#stock-title');
  } else if (data.journey) {
    journey = sessions.find(item => item.id === data.journey);
    openMarket('journey', '#journey-form input');
  } else if (data.scenario) {
    scenario[data.scenario] = Number(data.value);
    rerender(`[data-scenario="${data.scenario}"][data-value="${data.value}"]`);
  } else if (data.chat) {
    chat = sessions.find(item => item.id === data.chat) ?? null;
    go('mentor');
    focusComposer();
  } else if (data.prompt) sendMentor(data.prompt);
  else if (data.mentor) {
    go('mentor');
    focusComposer(data.mentor);
  }
});

document.addEventListener('keydown', event => {

  const tab = event.target.closest('[role="tab"][data-lesson]');
  if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const enabled = [...main.querySelectorAll('[role="tab"]:not(:disabled)')];
    const index = enabled.indexOf(tab);
    let target;
    if (event.key === 'Home') target = enabled[0];
    else if (event.key === 'End') target = enabled.at(-1);
    else {
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      target = enabled[(index + offset + enabled.length) % enabled.length];
    }
    openLesson(target.dataset.lesson);
    main.querySelector('[role="tab"][aria-selected="true"]').focus();
    return;
  }

  if (event.key === 'Escape' && !panel.hidden && (sidebar.contains(document.activeElement) || document.activeElement === menu)) {
    closeSidebar();
  }
});

document.addEventListener('input', event => {
  if (event.target.id === 'stock-search') {
    stockSearch = event.target.value;
    main.querySelector('#stock-rows').innerHTML = stockRows();
  } else if (event.target.id === 'trade-quantity') {
    updateTradeEstimate();
    main.querySelector('#trade-error').textContent = '';
  }
});

function placeTrade(form, side) {
  const shownTick = form.dataset.quoteTick === '' ? null : Number(form.dataset.quoteTick);
  const shownPrice = form.dataset.quotePrice === '' ? null : Number(form.dataset.quotePrice);
  student = loadStudent(student);
  if (!demoQuotesAvailable(student.account) || !Number.isSafeInteger(shownTick) || shownTick !== demoQuoteTick(student.account)
    || !Number.isSafeInteger(shownPrice) || shownPrice !== quotePrice(student.account, stockByTicker(ticker))) {
    refreshDemoQuotes();
    main.querySelector('#trade-error').textContent = demoQuotesAvailable(student.account)
      ? 'The demo quote changed. Order paused; review the updated price and submit again.'
      : 'Demo quotes are unavailable. Orders are paused.';
    return;
  }
  const quantity = Number(new FormData(form).get('quantity'));
  const result = executeTrade(student.account, ticker, side, quantity, Date.now());
  if (result.error) {
    main.querySelector('#trade-error').textContent = result.error;
    return;
  }
  saveStudent({ ...student, account: result.account });
  rerender('#trade-quantity');
  const verb = side === 'buy' ? 'Bought' : 'Sold';
  const message = `${verb} ${quantity} ${quantity === 1 ? 'share' : 'shares'} of ${ticker} for ${rupiah(result.trade.value)} in virtual money.`;
  const notice = main.querySelector('#trade-result');
  notice.textContent = message;
  notice.hidden = false;
  announce(message);
}

function checkQuiz(form) {
  if (quizAttempt) return;
  const quiz = quizById(quizId);
  const data = new FormData(form);
  const answers = quiz.questions.map((_, index) => Number(data.get('answer-' + index)));
  const score = quiz.questions.filter((question, index) => answers[index] === question.answer).length;
  student = loadStudent(student);
  const best = bestScore(quiz.id);
  const improved = Math.max(best, score);
  saveStudent({ ...student, quizResults: { ...student.quizResults, [quiz.id]: improved } });
  quizAttempt = { answers, score, xp: (improved - best) * 10 };
  rerender('#quiz-result');
  announce('Quiz score ' + score + ' out of ' + quiz.questions.length + '.');
}

function submitJourney(form, months) {
  const data = new FormData(form);
  const weights = data.getAll('weight').map(Number);
  if (sum(weights) !== 100) {
    main.querySelector('#journey-error').textContent = 'Your allocation totals ' + sum(weights) + '%. Adjust it to 100% before advancing.';
    form.elements.weight[0].focus();
    return;
  }
  const plan = { ...journey.sim, weights, allowance: Number(data.get('allowance')) };
  journey = stepJourney(journey, plan, months);
  rerender(`[name="months"][value="${months}"]`);
  announce('Life-stage simulation advanced to month ' + journey.sim.month + '.');
}

document.addEventListener('submit', event => {
  const form = event.target;
  if (!['mentor-form', 'trade-form', 'quiz-form', 'journey-form'].includes(form.id)) return;
  event.preventDefault();
  if (form.id === 'mentor-form') sendMentor(form.elements.message.value);
  else if (form.id === 'trade-form') placeTrade(form, event.submitter?.value ?? 'buy');
  else if (form.id === 'quiz-form') checkQuiz(form);
  else submitJourney(form, Number(event.submitter?.value ?? 6));
});

window.addEventListener('hashchange', () => {
  const next = route();
  if (next === page || location.hash === '#main') return;
  page = next;
  showPage();
});

window.addEventListener('storage', event => {
  if (event.key === sessionKey) {
    sessions = loadSessions(sessions);
    if (page === 'mentor') renderPanel();
  }
});

document.querySelector('.skip').addEventListener('click', event => {
  event.preventDefault();
  main.focus();
});

narrowScreen.addEventListener('change', event => setMenu(!event.matches));
window.setInterval(tickDemoQuotes, 5000);
setMenu(!narrowScreen.matches);
render();
