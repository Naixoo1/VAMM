export const lessons = {
  Compounding: 'When gains stay in your savings, future growth can apply to the original money and the earlier gains. Losses can compound too.',
  Inflation: 'Inflation means prices rise over time. Inflation-adjusted value estimates what your future balance could buy in today’s prices.',
  Diversification: 'Spreading money across different assets reduces how much one asset can affect the whole portfolio. Several assets can still fall together.',
  Risk: 'Risk is the possibility that the result differs from what you expected. Money you need soon may have less time to recover from a drop.',
  'Emergency savings': 'An emergency fund is money you keep accessible for unexpected expenses, such as replacing a broken device.',
};
export const assets = ['Cash', 'Bonds', 'Broad equities'];
export const annualRates = [.02, .04, .07];
export const inflation = .03;
export const stages = ['Student years', 'First job', 'Independent living', 'Long-term planning'];
const events = [
  { month: 12, name: 'Device repair', amount: -60 },
  { month: 24, name: 'Weekend project payment', amount: 90 },
  { month: 36, name: 'Moving supplies', amount: -80 },
];
export const scenarios = [
  { name: 'Positive earnings', event: 'Simulated company earnings improved', change: .03, cause: 'In this scenario, the company reported stronger earnings than expected.' },
  { name: 'Inflation concerns', event: 'Simulated inflation concerns', change: -.04, cause: 'In this scenario, investors expected inflation to raise costs and interest rates.' },
  { name: 'Market downturn', event: 'Simulated broad market downturn', change: -.08, cause: 'In this scenario, confidence fell across the sample market.' },
];
export const watchlist = [
  { name: 'Fern Labs', price: 100, exposure: 1 },
  { name: 'Harbor Foods', price: 60, exposure: .75 },
  { name: 'Meadow Market Index', price: 200, exposure: .5 },
];
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
export const sum = values => values.reduce((total, value) => total + value, 0);
export const stageAt = month => stages[Math.min(Math.floor(month / 12), stages.length - 1)];

export function advance(sim, months) {
  const balances = [...sim.balances];
  const impacts = [];
  let contributions = 0;
  for (let month = sim.month + 1; month <= sim.month + months; month++) {
    balances.forEach((balance, index) => {
      balances[index] = balance * (1 + annualRates[index]) ** (1 / 12) + sim.allowance * sim.weights[index] / 100;
    });
    contributions += sim.allowance;
    const event = events.find(item => item.month === month);
    if (!event) continue;
    const impact = event.amount < 0 ? Math.max(event.amount, -sum(balances)) : event.amount;
    if (impact < 0) {
      let remaining = -impact;
      balances.forEach((balance, index) => {
        const payment = Math.min(remaining, balance);
        balances[index] -= payment;
        remaining -= payment;
      });
    } else {
      balances[0] += impact;
    }
    impacts.push({ ...event, impact: round(impact) });
  }
  const month = sim.month + months;
  const nominal = round(sum(balances));
  const real = round(sum(balances) / (1 + inflation) ** (month / 12));
  const growth = round(nominal - sum(sim.balances) - contributions - sum(impacts.map(event => event.impact)));
  return { month, balances, nominal, real, impacts, contributions, growth };
}

export function market(assetIndex, scenarioIndex, range) {
  const asset = watchlist[assetIndex];
  const scenario = scenarios[scenarioIndex];
  const change = scenario.change * (scenarioIndex === 2 ? 1 : asset.exposure);
  const end = round(asset.price * (1 + change));
  const shares = 10;
  const startingFunds = 10000;
  const cash = startingFunds - asset.price * shares;
  return {
    asset, scenario, change, end, shares, startingFunds, cash,
    total: round(cash + end * shares),
    impact: round((end - asset.price) * shares),
    eventDay: Math.ceil(range * .6),
  };
}
