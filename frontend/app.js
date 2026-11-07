const { lessons, assets, annualRates, inflation, stageAt, scenarios, watchlist, advance, market, sum } = simulationModel;

const main = document.querySelector('main');
const sidebar = document.querySelector('#sidebar');
const chatPanel = document.querySelector('#chat-panel');
const historyPanel = document.querySelector('#sidebar-history');
const narrowScreen = window.matchMedia('(max-width: 720px)');
const menu = document.querySelector('#menu');
const dialog = document.querySelector('#coach-dialog');
const names = { home: 'Home', chat: 'New chat', sim: 'Simulator', demo: 'Demo account', learn: 'Learning' };
const storageKey = 'caga-caga-sessions-v1';
let sessions = [];
let storageIssue = false;
try {
  sessions = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (!Array.isArray(sessions)) throw new Error('Invalid session list');
} catch {
  sessions = [];
  storageIssue = true;
}
let page = 'home';
let session = null;
let demo = { asset: 0, scenario: 0, range: 30 };
let panelMessages = [];

const moneyFormat = new Intl.NumberFormat('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = value => moneyFormat.format(value) + ' credits';
const signed = value => (value > 0 ? '+' : value < 0 ? '−' : '') + money(Math.abs(value));
const percent = value => new Intl.NumberFormat('en', { style: 'percent', maximumFractionDigits: 2 }).format(value);
const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

function persist() {
  session.updated = Date.now();
  sessions = [session, ...sessions.filter(item => item.id !== session.id)].slice(0, 20);
  renderHistory();
  try {
    localStorage.setItem(storageKey, JSON.stringify(sessions));
  } catch {
    storageIssue = true;
  }
}

function newSession(kind, example = false) {
  session = {
    id: crypto.randomUUID?.() ?? crypto.getRandomValues(new Uint32Array(4)).join('-'), kind, title: kind === 'chat' ? 'Coach conversation' : example ? 'Example · First allowance' : 'Life-stage simulation',
    messages: [],
  };
  if (kind === 'sim') {
    session.sim = { allowance: example ? 50 : 25, weights: example ? [40, 20, 40] : [50, 20, 30], month: 0, balances: [0, 0, 0], timeline: [] };
    if (example) step(12);
  }
  return session;
}

function go(next) {
  page = next;
  panelMessages = [];
  if (narrowScreen.matches) setMenu(false);
  render();
  main.focus();
  window.scrollTo(0, 0);
}

function setMenu(open) {
  chatPanel.hidden = !open;
  document.body.classList.toggle('sidebar-collapsed', !open);
  const label = open ? 'Hide chat sidebar' : 'Show chat sidebar';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', label);
  menu.title = label;
}

function renderHistory() {
  if (!sessions.length) {
    historyPanel.innerHTML = '<p>No chats yet.</p>';
    return;
  }
  historyPanel.innerHTML = `<div class="history">${sessions.map(item => {
    const current = item.id === session?.id && item.kind === page ? ' aria-current="true"' : '';
    return `<button data-session="${escape(item.id)}" title="${escape(item.title)}"${current}>${escape(item.title)}</button>`;
  }).join('')}</div>`;
}

function heading(kicker, title, description) {
  return `<section><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${description}</p></section>`;
}

function composer(label = 'Ask the coach or enter a simulation action') {
  return `<form id="message-form" class="composer"><label class="sr" for="message">${label}</label>
  <input id="message" name="message" required maxlength="500" placeholder="${label}…"><button class="primary">Send</button></form>`;
}

function home() {
  return `${heading('Educational simulation · No real money involved', 'Autonomous Life-Stage Simulator', 'Practice long-term financial choices with fictional money. Explore how compounding, inflation, asset allocation, and unexpected events can affect outcomes over time.')}
    <section class="card feature"><span class="logo" aria-hidden="true">✧</span><span class="eyebrow">Your learning companion</span><h2>Meet your AI Simulation Coach</h2>
      <p>I can help you explore how saving, simulated investing, inflation, and life events affect your financial journey. Choose an example or start a simulation.</p>
      <div class="actions"><button class="primary" data-action="example">Try an example</button><button data-action="start">Start a simulation</button><button data-page="demo">Open demo account</button></div>
    </section>
    <section class="card"><h2>Recent chats</h2>
    ${sessions.length ? `<div class="history">${sessions.map(item => `<button data-session="${escape(item.id)}"><span>${escape(item.title)}</span><small>${new Date(item.updated).toLocaleString()}</small></button>`).join('')}</div>` : '<p>Your chats and simulations will appear here after you start one.</p>'}
    </section><section class="card"><h2>Ask the coach</h2>${composer('Ask a question')}</section>`;
}

function messages(items) {
  return items.map(item => `<div class="bubble ${item.role === 'You' ? 'user' : ''}"><strong>${item.role}</strong><p>${escape(item.text)}</p></div>`).join('');
}

function conversation() {
  return `${heading('Simulation Coach · Scripted local demo', 'Coach conversation', 'Ask about compounding, inflation, diversification, risk, or emergency savings.')}
    <section class="card conversation-card"><div class="log" role="log" aria-label="Conversation">${messages(session.messages)}</div>${composer('Type a message')}</section>`;
}

function metric(label, value) {
  return `<div class="metric"><small>${label}</small><strong>${value}</strong></div>`;
}

function eventText(event) {
  const limit = event.amount !== event.impact ? ` (modeled expense ${money(-event.amount)}, limited to available funds)` : '';
  return `${event.name} · ${signed(event.impact)}${limit}`;
}

function simulator() {
  const sim = session.sim;
  const latest = sim.timeline.at(-1);
  return `${heading('Fictional money · Modeled results', 'Life-stage simulator', 'Choose how to split your monthly allowance. Advance the timeline to see how growth, inflation, and life events affect your balance.')}
    <section class="card"><h2>Plan your next step</h2>
      <form id="sim-form" class="card">
        <label class="fields"><span>Monthly allowance (credits)</span><input name="allowance" type="number" min="0" max="10000" step=".01" required value="${sim.allowance}"></label>
        <fieldset><legend>Allocation (must total 100%)</legend><div class="fields">
        ${assets.map((asset, index) => `<label>${asset} (%)<input name="weight" type="number" required min="0" max="100" step="1" value="${sim.weights[index]}"></label>`).join('')}
        </div></fieldset>
        <p class="error" id="sim-error" role="alert"></p>
        <div class="actions"><button class="primary" name="months" value="6">Advance 6 months</button><button name="months" value="12">Advance 1 year</button></div>
        <p><small>Fixed annual demo rates · ${assets.map((asset, index) => asset + ' ' + percent(annualRates[index])).join(' · ')} · Inflation ${percent(inflation)}.</small></p>
      </form>
    </section>
    <section class="card"><div class="row"><h2>${stageAt(sim.month)}</h2><span class="badge">Month ${sim.month}</span></div>
      <div class="metrics">${metric('Nominal balance', money(latest?.nominal ?? 0))}${metric('In today’s prices', money(latest?.real ?? 0))}</div>
      <p>${assets.map((asset, index) => asset + ' ' + money(sim.balances[index])).join(' · ')}</p>
    </section>
    <section class="card"><h2>Timeline</h2>${latest ? `<div class="table-wrap"><table><thead><tr><th scope="col">Month / stage</th><th scope="col">Nominal</th><th scope="col">In today’s prices</th><th scope="col">Life event</th></tr></thead><tbody>${sim.timeline.map(row => `<tr><th scope="row">${row.month} · ${stageAt(row.month)}</th><td>${money(row.nominal)}</td><td>${money(row.real)}</td><td>${row.impacts.map(eventText).join('<br>') || 'No event'}</td></tr>`).join('')}</tbody></table></div>` : '<p>Your timeline starts when you advance the simulation.</p>'}</section>
    <section class="card"><h2>Simulation Coach debrief</h2><p>${simSummary()}</p><p>Reflection · How much of your next allowance would you want available for a surprise expense?</p>
    <div class="log" role="log" aria-label="Conversation">${messages(session.messages)}</div>${composer('Ask a question or type “advance 6 months”')}</section>`;
}

function simSummary() {
  const latest = session?.sim?.timeline.at(-1);
  if (!latest) return 'Advance the simulation to compare the balance with its buying power after inflation.';
  const impacts = latest.impacts.length ? latest.impacts.map(eventText).join('. ') + '.' : 'No life event occurred in this step.';
  return `You added ${money(latest.contributions)} in allowance. Modeled growth added ${money(latest.growth)}. ${impacts} Your fictional balance is ${money(latest.nominal)}, with buying power of ${money(latest.real)} in starting prices.`;
}

function chart(result) {
  const high = Math.max(result.asset.price, result.end) * 1.025;
  const low = Math.min(result.asset.price, result.end) * .975;
  const y = value => 132 - (value - low) / (high - low) * 94;
  const x = 42 + 337 * (result.eventDay - 1) / (demo.range - 1);
  const from = y(result.asset.price);
  const to = y(result.end);
  const direction = result.change > 0 ? '↑' : '↓';
  return `<svg class="chart" viewBox="0 0 410 163" role="img" aria-labelledby="chart-title chart-desc">
    <title id="chart-title">${result.asset.name} simulated price chart</title>
    <desc id="chart-desc">From ${money(result.asset.price)} to ${money(result.end)}. Day ${result.eventDay}: ${result.scenario.event}.</desc>
    <path d="M42 28V137H379" fill="none" stroke="#79958a"/>
    <path d="M${x} 28V137" stroke="#79958a" stroke-dasharray="4 4"/>
    <path d="M42 ${from}H${x}V${to}H379" fill="none" stroke="#16634f" stroke-width="3"/>
    <circle cx="${x}" cy="${to}" r="5" fill="#16634f"/>
    <g fill="#284b40" font-size="12"><text x="40" y="${from - 8}">${result.asset.price.toFixed(2)}</text><text x="381" y="${to - 8}" text-anchor="end">${result.end.toFixed(2)}</text>
    <text x="${x}" y="20" text-anchor="middle">${direction} Event · day ${result.eventDay}</text><text x="42" y="154">Day 1</text><text x="379" y="154" text-anchor="end">Day ${demo.range}</text></g>
    </svg>`;
}

function marketExplanation(result) {
  const direction = result.change > 0 ? 'rise' : 'fall';
  return `${result.scenario.cause} The model assumes a ${percent(Math.abs(result.change))} price ${direction} for ${result.asset.name}. Your portfolio changed by ${signed(result.impact)} because it holds ${result.shares} fictional units of that asset.`;
}

function demoAccount() {
  const result = market(demo.asset, demo.scenario, demo.range);
  const buttons = (items, key, active, label) => items.map((item, index) => `<button data-demo="${key}" data-value="${item.value ?? index}" aria-pressed="${(item.value ?? index) === active}">${label(item)}</button>`).join('');
  return `${heading('Simulated data · Fictional funds', 'Demo account', 'Explore how a sample market event can change an account. Pick an asset and a scenario to see what happened.')}
    <section class="card"><h2>Watchlist</h2><div class="actions">${buttons(watchlist, 'asset', demo.asset, item => item.name)}</div></section>
    <section class="card"><div class="row"><h2>${result.asset.name}</h2><div class="actions" aria-label="Chart time range">${buttons([{ value: 30 }, { value: 90 }], 'range', demo.range, item => item.value + ' days')}</div></div>
      <p>Simulated price (credits per unit)</p>${chart(result)}
      <p><strong>Day ${result.eventDay} · ${result.scenario.event}</strong> · ${result.change > 0 ? '↑' : '↓'} ${percent(Math.abs(result.change))}</p>
    </section>
    <section class="card"><h2>Try a scenario</h2><div class="actions">${buttons(scenarios, 'scenario', demo.scenario, item => item.name)}</div>
      <h3>What changed?</h3><p>${marketExplanation(result)}</p>
      <p>Reflection · Would this price change matter differently if you needed the money next week?</p><div><button data-action="coach">Ask the coach</button></div>
    </section>
    <section class="card"><h2>Fictional portfolio</h2><p>${result.shares} units of ${result.asset.name} at ${money(result.end)} each</p>
      <div class="metrics">${metric('Starting funds', money(result.startingFunds))}${metric('Cash balance', money(result.cash))}${metric('Portfolio value', money(result.total))}${metric('Change over ' + demo.range + ' days', signed(result.impact))}</div>
    </section>`;
}

function learning() {
  return `${heading('Learning library', 'Small lessons for big decisions', 'Explore five ideas you can try in the simulator.')}
    ${Object.entries(lessons).map(([topic, explanation]) => `<details><summary>${topic}</summary><p>${explanation}</p></details>`).join('')}`;
}

function render() {
  renderHistory();
  const views = { home, chat: conversation, sim: simulator, demo: demoAccount, learn: learning };
  document.querySelector('#location').textContent = names[page];
  sidebar.querySelectorAll('nav button').forEach(button => {
    if (button.dataset.page === page) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  main.innerHTML = views[page]() + (storageIssue ? '<p role="status">Session storage is unavailable or could not be read. History may only be available during this visit.</p>' : '');
  const log = main.querySelector('.log');
  if (log) log.scrollTop = log.scrollHeight;
}

function coachReply(question) {
  const q = question.toLowerCase();
  if (/recommend|should i (buy|sell|invest)|forecast|real stock|which stock/.test(q)) {
    return 'I can explain fictional scenarios and general concepts. What kind of risk would you like to explore in the demo?';
  }
  if (page === 'demo' && /why|chart|move|drop|rise|fall|event|portfolio|balance|scenario|change|happen/.test(q)) {
    return marketExplanation(market(demo.asset, demo.scenario, demo.range)) + ' How might your time horizon affect your reaction?';
  }
  if (page === 'sim' && /why|balance|event|portfolio|result|timeline|happen|change/.test(q)) {
    return simSummary() + ' What would you change for the next step?';
  }
  const topics = [
    [/compound|growth/, 'Compounding'], [/inflat|buying power|real value/, 'Inflation'],
    [/diversif|allocat/, 'Diversification'], [/emergen|saving|surprise/, 'Emergency savings'], [/risk|loss/, 'Risk'],
  ];
  const topic = topics.find(([pattern]) => pattern.test(q));
  return topic ? lessons[topic[1]] + ' Where might you see this in a simulation?' :
    'Try asking about inflation, compounding, diversification, risk, or emergency savings. In a scenario, you can ask what changed.';
}

function addReply(list, question) {
  list.push({ role: 'You', text: question }, { role: 'Coach', text: coachReply(question) });
}

function step(months) {
  const sim = session.sim;
  const { balances, ...entry } = advance(sim, months);
  sim.balances = balances;
  sim.month = entry.month;
  sim.timeline.push(entry);
  persist();
}

function readPlan() {
  const form = document.querySelector('#sim-form');
  if (!form.reportValidity()) return false;
  const data = new FormData(form);
  const weights = data.getAll('weight').map(Number);
  const error = document.querySelector('#sim-error');
  if (sum(weights) !== 100) {
    error.textContent = `Your allocation totals ${sum(weights)}%. Adjust it to 100% before advancing.`;
    form.elements.weight[0].focus();
    return false;
  }
  error.textContent = '';
  Object.assign(session.sim, { allowance: Number(data.get('allowance')), weights });
  return true;
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button === menu) {
    const opening = chatPanel.hidden;
    setMenu(opening);
    if (opening && narrowScreen.matches) chatPanel.querySelector('.new').focus();
    return;
  }
  const { action, page: next, session: id, demo: setting, value } = button.dataset;
  if (next) {
    if (next === 'sim' && session?.kind !== 'sim') newSession('sim');
    go(next);
  } else if (id) {
    session = sessions.find(item => item.id === id);
    go(session.kind);
  } else if (setting) {
    demo[setting] = Number(value);
    panelMessages = [];
    render();
    main.querySelector(`[data-demo="${setting}"][data-value="${value}"]`).focus();
  } else if (action === 'coach') {
    if (narrowScreen.matches) setMenu(false);
    document.querySelector('#coach-log').innerHTML = messages(panelMessages);
    dialog.showModal();
    document.querySelector('#coach-question').focus();
  } else if (action === 'close-coach') {
    dialog.close();
  } else if (action === 'new') {
    newSession('chat');
    go('chat');
    document.querySelector('#message').focus();
  } else if (action === 'start' || action === 'example') {
    newSession('sim', action === 'example');
    go('sim');
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !dialog.open && !chatPanel.hidden && (sidebar.contains(document.activeElement) || document.activeElement === menu)) {
    setMenu(false);
    menu.focus();
  }
});

document.addEventListener('submit', event => {
  const form = event.target;
  event.preventDefault();
  if (form.id === 'sim-form') {
    if (readPlan()) {
      const months = Number(event.submitter?.value || 6);
      step(months);
      render();
      main.querySelector(`button[name="months"][value="${months}"]`).focus();
    }
    return;
  }
  const input = form.querySelector('input');
  const question = input.value.trim();
  if (!question) {
    input.value = '';
    input.focus();
    return;
  }
  if (form.id === 'coach-form') {
    addReply(panelMessages, question);
    const log = document.querySelector('#coach-log');
    log.innerHTML = messages(panelMessages);
    log.scrollTop = log.scrollHeight;
    input.value = '';
    input.focus();
    return;
  }
  const command = question.toLowerCase();
  if (page === 'sim' && /^advance (6 months|1 year)[.!]?$/.test(command)) {
    if (!readPlan()) return;
    step(command.includes('6 months') ? 6 : 12);
    render();
  } else if (page === 'home') {
    newSession('chat');
    page = 'chat';
    addReply(session.messages, question);
    session.title = question.length > 45 ? question.slice(0, 45) + '…' : question;
    persist();
    go('chat');
  } else {
    const log = main.querySelector('.log');
    const firstNew = session.messages.length;
    addReply(session.messages, question);
    if (page === 'chat' && firstNew === 0) session.title = question.length > 45 ? question.slice(0, 45) + '…' : question;
    persist();
    log.insertAdjacentHTML('beforeend', messages(session.messages.slice(firstNew)));
    log.scrollTop = log.scrollHeight;
    input.value = '';
  }
  document.querySelector('#message').focus();
});

narrowScreen.addEventListener('change', event => setMenu(!event.matches));
setMenu(!narrowScreen.matches);
render();
