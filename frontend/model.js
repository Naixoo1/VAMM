const simulationModel = (() => {
  const lessons = {
    Compounding: 'When gains stay in your savings, future growth can apply to the original money and the earlier gains. Losses can compound too.',
    Inflation: 'Inflation means prices rise over time. Inflation-adjusted value estimates what your future balance could buy in today’s prices.',
    Diversification: 'Spreading money across different assets reduces how much one asset can affect the whole portfolio. Several assets can still fall together.',
    Risk: 'Risk is the possibility that the result differs from what you expected. Money you need soon may have less time to recover from a drop.',
    'Emergency savings': 'An emergency fund is money you keep accessible for unexpected expenses, such as replacing a broken device.',
  };
  const assets = ['Cash', 'Bonds', 'Broad equities'];
  const annualRates = [.02, .04, .07];
  const inflation = .03;
  const stages = ['Student years', 'First job', 'Independent living', 'Long-term planning'];
  const events = [
    { month: 12, name: 'Device repair', amount: -60 },
    { month: 24, name: 'Weekend project payment', amount: 90 },
    { month: 36, name: 'Moving supplies', amount: -80 },
  ];
  const scenarios = [
    { name: 'Positive earnings', event: 'Simulated company earnings improved', change: .03, cause: 'In this scenario, the company reported stronger earnings than expected.' },
    { name: 'Inflation concerns', event: 'Simulated inflation concerns', change: -.04, cause: 'In this scenario, investors expected inflation to raise costs and interest rates.' },
    { name: 'Market downturn', event: 'Simulated broad market downturn', change: -.08, cause: 'In this scenario, confidence fell across the sample market.' },
  ];
  const watchlist = [
    { name: 'Fern Labs', price: 100, exposure: 1 },
    { name: 'Harbor Foods', price: 60, exposure: .75 },
    { name: 'Meadow Market Index', price: 200, exposure: .5 },
  ];
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const sum = values => values.reduce((total, value) => total + value, 0);
  const stageAt = month => stages[Math.min(Math.floor(month / 12), stages.length - 1)];

  function advance(sim, months) {
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

  function market(assetIndex, scenarioIndex, range) {
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


  const startingCash = 10_000_000;
  const startingDay = 6;
  const stocks = [
    { ticker: 'FERN', name: 'Fern Labs', sector: 'Technology', description: 'Builds classroom software and digital tools for small businesses.', eps: 155, dividend: 0, prices: [2260, 2290, 2230, 2310, 2390, 2360, 2450, 2510, 2430, 2560, 2610, 2490, 2540, 2630, 2690] },
    { ticker: 'HBRF', name: 'Harbor Foods', sector: 'Consumer goods', description: 'Makes packaged foods and supplies neighborhood grocery stores.', eps: 140, dividend: 45, prices: [1840, 1810, 1825, 1850, 1835, 1880, 1840, 1810, 1860, 1900, 1885, 1910, 1865, 1900, 1940] },
    { ticker: 'BAYE', name: 'Bayline Energy', sector: 'Energy', description: 'Operates small renewable energy projects and sells electricity to utilities.', eps: 215, dividend: 75, prices: [3290, 3330, 3240, 3280, 3210, 3150, 3210, 3060, 3120, 3090, 3170, 3250, 3190, 3160, 3250] },
    { ticker: 'MDSA', name: 'Meadow Transit', sector: 'Industrials', description: 'Provides delivery and maintenance services for regional transit operators.', eps: 175, dividend: 60, prices: [2630, 2680, 2700, 2670, 2740, 2780, 2760, 2810, 2870, 2820, 2790, 2840, 2910, 2880, 2950] },
  ];
  const lastMarketDay = stocks[0].prices.length - 1;

  function newAccount() {
    return {
      cash: startingCash, day: startingDay, holdings: {}, trades: [], quoteTick: 0, quoteUpdatedAt: null,
      quotes: Object.fromEntries(stocks.map(stock => [stock.ticker, stock.prices[startingDay]])),
      quoteHistory: Object.fromEntries(stocks.map(stock => [stock.ticker, stock.prices.slice(0, startingDay + 1)])),
    };
  }

  function quotePrice(account, stock) {
    if (!stock || !Number.isInteger(account?.day) || account.day < 0 || account.day > lastMarketDay) return null;
    if (account.quotes !== undefined && (!account.quotes || typeof account.quotes !== 'object' || Array.isArray(account.quotes))) return null;
    const price = account.quotes === undefined ? stock.prices?.[account.day] : account.quotes[stock.ticker];
    return Number.isSafeInteger(price) && price > 0 ? price : null;
  }

  function quoteSeries(account, stock) {
    if (!stock || !Number.isInteger(account?.day) || account.day < 0 || account.day > lastMarketDay) return [];
    if (account.quoteHistory !== undefined && (!account.quoteHistory || typeof account.quoteHistory !== 'object' || Array.isArray(account.quoteHistory))) return [];
    const history = account.quoteHistory === undefined
      ? Array.isArray(stock.prices) ? stock.prices.slice(0, account.day + 1) : []
      : account.quoteHistory[stock.ticker];
    return Array.isArray(history) && history.every(price => Number.isSafeInteger(price) && price > 0) ? history.slice(-60) : [];
  }

  function advanceDemoQuotes(account, now) {
    if (!account || typeof account !== 'object') return account;
    const previousTick = account.quoteTick === undefined ? 0 : account.quoteTick;
    if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(previousTick) || previousTick < 0 || previousTick === Number.MAX_SAFE_INTEGER) return account;
    if (account.quoteUpdatedAt != null && (!Number.isSafeInteger(account.quoteUpdatedAt) || account.quoteUpdatedAt < 0 || now < account.quoteUpdatedAt)) return account;
    const quoteTick = previousTick + 1;
    const quotes = {};
    const quoteHistory = {};
    for (const [index, stock] of stocks.entries()) {
      const previous = quotePrice(account, stock);
      const history = quoteSeries(account, stock);
      if (previous === null || history.length === 0) return account;
      // Generated demo movements use steps from -0.9% to +0.9%; they are not market observations.
      const movement = ((quoteTick % 19) * 7 + index * 5) % 19 - 9;
      const price = Math.max(1, Math.round(previous * (1 + movement / 1000)));
      if (!Number.isSafeInteger(price)) return account;
      quotes[stock.ticker] = price;
      quoteHistory[stock.ticker] = [...history, price].slice(-60);
    }
    return { ...account, quoteTick, quoteUpdatedAt: now, quotes, quoteHistory };
  }

  function portfolio(account) {
    const positions = stocks.flatMap(stock => {
      const holding = account.holdings[stock.ticker];
      if (!holding?.quantity) return [];
      const price = quotePrice(account, stock);
      const markedValue = price === null ? null : holding.quantity * price;
      const value = Number.isSafeInteger(holding.quantity) && holding.quantity > 0 && Number.isSafeInteger(holding.basis) && holding.basis >= 0
        && Number.isSafeInteger(markedValue) && markedValue >= 0 ? markedValue : null;
      return [{ stock, ...holding, value, gain: value === null ? null : value - holding.basis }];
    });
    const markedInvested = positions.some(position => position.value === null) ? null : sum(positions.map(position => position.value));
    const invested = Number.isSafeInteger(markedInvested) && markedInvested >= 0 ? markedInvested : null;
    const markedTotal = invested === null ? null : account.cash + invested;
    const total = Number.isSafeInteger(account.cash) && account.cash >= 0 && Number.isSafeInteger(markedTotal) ? markedTotal : null;
    return { positions, invested, total, gain: total === null ? null : total - startingCash, sectors: new Set(positions.map(position => position.stock.sector)).size };
  }

  function executeTrade(account, ticker, side, quantity, timestamp) {
    const stock = stocks.find(item => item.ticker === ticker);
    if (!stock || !['buy', 'sell'].includes(side)) return { error: 'Choose a stock and order type.' };
    if (!Number.isSafeInteger(quantity) || quantity < 1) return { error: 'Enter a whole number of shares greater than zero.' };

    const price = quotePrice(account, stock);
    const quoteTick = account?.quoteTick === undefined ? 0 : account.quoteTick;
    if (price === null || !Number.isSafeInteger(quoteTick) || quoteTick < 0) return { error: 'The simulated quote is unavailable. Review the market before trading.' };
    if (!Number.isSafeInteger(timestamp) || timestamp < 0 || !Number.isSafeInteger(account.cash) || account.cash < 0 || !account.holdings || !Array.isArray(account.trades)) return { error: 'The practice account could not be validated.' };
    const value = quantity * price;
    const held = account.holdings[ticker] ?? { quantity: 0, basis: 0 };
    if (!Number.isSafeInteger(value) || !Number.isSafeInteger(held.quantity) || held.quantity < 0 || !Number.isSafeInteger(held.basis) || held.basis < 0) return { error: 'This order exceeds the supported practice amounts.' };
    if (side === 'buy' && value > account.cash) return { error: 'This order exceeds your virtual cash balance.' };
    if (side === 'sell' && quantity > held.quantity) return { error: 'This order exceeds the shares you own.' };

    const holdings = { ...account.holdings };
    const remaining = held.quantity + (side === 'buy' ? quantity : -quantity);
    const cash = account.cash + (side === 'buy' ? -value : value);
    if (!Number.isSafeInteger(remaining) || !Number.isSafeInteger(cash) || (side === 'sell' && !Number.isSafeInteger(held.basis * remaining))) return { error: 'This order exceeds the supported practice amounts.' };
    if (remaining === 0) delete holdings[ticker];
    else {
      const basis = side === 'buy' ? held.basis + value : Math.round(held.basis * remaining / held.quantity);
      if (!Number.isSafeInteger(basis)) return { error: 'This order exceeds the supported practice amounts.' };
      holdings[ticker] = { quantity: remaining, basis };
    }
    const trade = { ticker, side, quantity, price, value, timestamp, day: account.day, quoteTick };
    return {
      account: {
        ...account,
        cash,
        holdings,
        trades: [trade, ...account.trades],
      },
      trade,
    };
  }

  const courses = [
    {
      id: 'stocks', title: 'Introduction to Stocks', level: 'Beginner', group: 'Start with the basics', minutes: 4,
      description: 'Understand what a share represents and what owning one can mean.',
      sections: [
        ['A small piece of a business', 'A stock is a unit of ownership in a company. If a company had 100 equal shares and you owned one, your share would represent 1% of the company.'],
        ['What ownership can change', 'A shareholder can benefit when the share price rises or the company pays a dividend. The share can also lose value if expectations change.'],
      ],
      example: { title: 'One share out of 100', caption: 'Your share represents 1% ownership in this simplified example.', bars: [['Your share', 1, '1 share'], ['Other shareholders', 99, '99 shares']] },
      questions: [
        { prompt: 'What does one share of stock represent?', choices: ['A small ownership stake', 'A guaranteed payment', 'A loan from a bank'], answer: 0, why: 'A share is a unit of ownership in a business.' },
        { prompt: 'Owning a share guarantees that its price will rise.', choices: ['True', 'False'], answer: 1, why: 'Share prices can rise or fall as expectations and demand change.' },
      ],
    },
    {
      id: 'prices', title: 'Stock Prices and Market Mechanics', level: 'Beginner', group: 'Start with the basics', minutes: 5,
      description: 'See how buyers and sellers arrive at a traded price.',
      sections: [
        ['How a trade gets a price', 'A trade happens when a buyer and seller agree on a price. A price on a chart usually reflects a transaction or a recorded quote at a point in time.'],
        ['Why the next trade may differ', 'New information, changing expectations, and the number of buyers and sellers can affect the next trade. Our simulator generates changing example prices for practice.'],
      ],
      example: { title: 'Two practice trades', caption: 'The second trade happened at a higher price. One trade alone tells us little about the next one.', bars: [['First trade', 1000, 'Rp1,000'], ['Second trade', 1050, 'Rp1,050']] },
      questions: [
        { prompt: 'What can change the price of the next trade?', choices: ['The previous price guarantees it', 'A change in supply and demand', 'The company name alone'], answer: 1, why: 'Prices can move as buyers and sellers adjust what they will pay or accept.' },
        { prompt: 'A price chart tells you exactly why each trade occurred.', choices: ['True', 'False'], answer: 1, why: 'The chart records prices. An explanation of causes needs evidence from other sources.' },
      ],
    },
    {
      id: 'returns', title: 'Dividends and Capital Gains', level: 'Beginner', group: 'Start with the basics', minutes: 5,
      description: 'Separate a company payment from a change in the value of a share.',
      sections: [
        ['Two ways a holding can change in value', 'A dividend is a payment that a company may make to shareholders. A capital gain occurs when a share is sold above its purchase price.'],
        ['Unrealized gains and losses', 'An increase in the value of a share you still hold is an unrealized gain. It can change before you sell. A company may also reduce or stop a dividend.'],
      ],
      example: { title: 'A sale above the purchase price', caption: 'The difference is Rp200 before any fees. If you still own the share, the gain is unrealized.', bars: [['Purchase price', 2000, 'Rp2,000'], ['Sale price', 2200, 'Rp2,200']] },
      questions: [
        { prompt: 'You buy a share for Rp2,000 and sell it for Rp2,200. What is the gain before fees?', choices: ['Rp2,200', 'Rp2,000', 'Rp200'], answer: 2, why: 'Subtract the purchase price from the sale price.' },
        { prompt: 'A company can change or stop its dividend.', choices: ['True', 'False'], answer: 0, why: 'Dividend decisions can change with the company’s finances and plans.' },
      ],
    },
    {
      id: 'risk', title: 'Investment Risks', level: 'Beginner', group: 'Build a portfolio', minutes: 6,
      description: 'Spot common risks before you interpret a price or build a portfolio.',
      sections: [
        ['Risk takes several forms', 'A company can disappoint, an entire market can fall, inflation can erode buying power, and a share may be hard to sell quickly. Concentration adds exposure to one company or sector.'],
        ['Consider when you need the money', 'The same price drop can matter more when you need the money soon. A practice portfolio lets you explore that trade-off with virtual funds.'],
      ],
      example: { title: 'One company can move the whole portfolio', caption: 'Compare how much of each sample portfolio depends on the largest holding.', bars: [['Concentrated portfolio', 90, '90%'], ['More spread out', 30, '30%']] },
      questions: [
        { prompt: 'What risk rises when almost all of a portfolio is in one company?', choices: ['Concentration risk', 'The chance of a guaranteed gain', 'The dividend rate'], answer: 0, why: 'One company’s performance affects most of the portfolio.' },
        { prompt: 'What does liquidity risk mean?', choices: ['Prices are always falling', 'You may struggle to sell at a reasonable price when needed', 'A stock pays dividends'], answer: 1, why: 'A lack of willing buyers can make a quick sale difficult.' },
        { prompt: 'Inflation can reduce the buying power of an unchanged balance.', choices: ['True', 'False'], answer: 0, why: 'The same balance buys less when prices rise.' },
        { prompt: 'What kind of risk can affect many companies at once?', choices: ['Market risk', 'The risk of a typing error', 'A single product recall'], answer: 0, why: 'A broad downturn can affect many sectors together.' },
        { prompt: 'A product recall at one company is mainly an example of what?', choices: ['Company-specific risk', 'Guaranteed market growth', 'A dividend policy'], answer: 0, why: 'The problem directly affects that company and may hurt its business.' },
      ],
    },
    {
      id: 'diversification', title: 'Portfolio Diversification', level: 'Beginner', group: 'Build a portfolio', minutes: 5,
      description: 'Explore how spreading holdings can change where your risk comes from.',
      sections: [
        ['Spread exposure across different businesses', 'Diversification spreads holdings across investments that depend on different factors. Owning several companies in the same sector can still leave you exposed to one industry.'],
        ['Check the weights', 'A portfolio can have many holdings and still depend heavily on its largest one. Broad market drops can affect diversified portfolios too.'],
      ],
      example: { title: 'Three sectors, different weights', caption: 'This example spreads exposure, though Technology still represents half of the investment.', bars: [['Technology', 50, '50%'], ['Consumer goods', 30, '30%'], ['Energy', 20, '20%']] },
      questions: [
        { prompt: 'Which choice spreads sector exposure the most?', choices: ['Three software companies', 'One large technology stock', 'One company in each of three sectors'], answer: 2, why: 'Holding companies across sectors spreads industry-specific exposure.' },
        { prompt: 'Diversification prevents all losses.', choices: ['True', 'False'], answer: 1, why: 'Many investments can fall together, especially during a broad market decline.' },
      ],
    },
    {
      id: 'fundamentals', title: 'Fundamental Analysis', level: 'Intermediate', group: 'Read the market', minutes: 7,
      description: 'Look at a business’s revenue, earnings, and valuation.',
      sections: [
        ['Start with the business', 'Revenue is money a business earns from sales before expenses. Earnings are what remains after expenses. Comparing those figures over time helps you ask better questions about performance.'],
        ['Use ratios as context', 'The price-to-earnings ratio divides share price by earnings per share. It can be a useful comparison within an industry. Growth, debt, and how earnings were measured also matter.'],
      ],
      example: { title: 'Calculate a P/E ratio', caption: 'A Rp2,000 share price divided by Rp100 earnings per share gives a P/E of 20×.', bars: [['Share price', 2000, 'Rp2,000'], ['Earnings per share', 100, 'Rp100']] },
      questions: [
        { prompt: 'Which two inputs produce the P/E ratio?', choices: ['Share price and earnings per share', 'Revenue and share count', 'Dividends and cash'], answer: 0, why: 'P/E equals share price divided by earnings per share.' },
        { prompt: 'A low P/E by itself proves a share is undervalued.', choices: ['True', 'False'], answer: 1, why: 'A low ratio can reflect weaker expectations, risk, or a temporary jump in earnings.' },
      ],
    },
    {
      id: 'technical', title: 'Technical Analysis Basics', level: 'Intermediate', group: 'Read the market', minutes: 6,
      description: 'Read trends, volume, and volatility in a price chart.',
      sections: [
        ['Look at the time window', 'A trend describes the overall direction of prices in the period you selected. A chart may look different when you change the time window.'],
        ['Understand volume and volatility', 'Volume counts how many units traded. Volatility describes how much prices move. A chart can help you describe a pattern and ask a question about it.'],
      ],
      example: { title: 'Volume across three days', caption: 'Day 3 had the most trading in this example. Volume alone cannot tell you the next price.', bars: [['Day 1', 150, '150 shares'], ['Day 2', 120, '120 shares'], ['Day 3', 260, '260 shares']] },
      questions: [
        { prompt: 'What does trading volume measure?', choices: ['Number of units traded', 'Next day’s return', 'Total company debt'], answer: 0, why: 'Volume measures units traded during a period.' },
        { prompt: 'A pattern on a past chart guarantees it will repeat.', choices: ['True', 'False'], answer: 1, why: 'Market conditions and the reasons for trades change.' },
      ],
    },
  ];

  const quizzes = [
    ...courses,
    {
      id: 'sentiment', title: 'News Sentiment', level: 'Beginner',
      description: 'Classify the direction of news and explain what the label can tell you.',
      questions: [
        { prompt: 'A central bank holds its policy rate steady while noting uncertainty. Which label fits the decision itself?', choices: ['Positive', 'Neutral', 'Negative'], answer: 1, why: 'The rate decision is unchanged. The surrounding economic risks can be discussed separately.' },
        { prompt: 'A positive headline guarantees that a related stock will rise.', choices: ['True', 'False'], answer: 1, why: 'The headline is one input. Expectations and other information can also affect prices.' },
      ],
    },
    {
      id: 'market-analyst', title: 'Fact vs. Opinion', level: 'Beginner',
      description: 'Separate a verifiable report from a prediction.',
      questions: [
        { prompt: 'Which statement can be checked against a published rate decision?', choices: ['Investors will definitely be happier tomorrow', 'The central bank kept its policy rate unchanged', 'Every related share is a bargain'], answer: 1, why: 'An official release can verify the rate decision. The other choices are judgments or predictions.' },
        { prompt: 'An economic forecast describes a possible outcome under stated assumptions.', choices: ['True', 'False'], answer: 0, why: 'A forecast is an estimate. It can change when its assumptions or data change.' },
      ],
    },
  ];

  const news = [
    {
      id: 'rates', publisher: 'Bank Indonesia', date: '2026-01-21', topic: 'Interest rates', sentiment: 'Neutral',
      title: 'Bank Indonesia keeps its policy rate at 4.75%',
      summary: 'Bank Indonesia held its main policy rate steady in January 2026. The release describes a balance between supporting economic growth and keeping the rupiah stable.',
      reasoning: 'The policy rate itself stayed the same. That supports a neutral reading of the decision, even though the release also describes economic risks and goals.',
      url: 'https://www.bi.go.id/id/publikasi/ruang-media/news-release/pages/sp_281326.aspx',
    },
    {
      id: 'indonesia-growth', publisher: 'World Bank', date: '2025-12-17', topic: 'Indonesia economy', sentiment: 'Positive',
      title: 'World Bank reports resilient growth in Indonesia',
      summary: 'The report put Indonesian growth at 5% over the first nine months of 2025. Investment and net exports helped support the outlook, while the report also noted challenges in the job market.',
      reasoning: 'The growth and investment figures support a positive reading of economic resilience. The labor-market findings add context to that reading.',
      url: 'https://www.worldbank.org/en/news/press-release/2025/12/16/indonesia-s-economy-maintains-resilience-amid-global-uncertainty',
    },
    {
      id: 'global-growth', publisher: 'International Monetary Fund', date: '2025-04-22', topic: 'Global economy', sentiment: 'Negative',
      title: 'IMF lowers its global growth outlook',
      summary: 'The April 2025 report lowered global growth forecasts from its January update amid higher tariffs and uncertainty about trade policy.',
      reasoning: 'The downgrade and the increased risks support a negative reading of the outlook in this report. The forecast was an estimate at the time of publication.',
      url: 'https://www.imf.org/en/publications/weo/issues/2025/04/22/world-economic-outlook-april-2025',
    },
  ];


  const academySources = {
  "stocks": [
    {
      "title": "SEC Investor.gov · Stocks",
      "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks"
    }
  ],
  "prices": [
    {
      "title": "SEC Investor.gov · Executing an Order",
      "url": "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/executing-order"
    }
  ],
  "returns": [
    {
      "title": "SEC Investor.gov · Dividend",
      "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/dividend"
    },
    {
      "title": "SEC Investor.gov · Capital Gain",
      "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/capital-gain"
    }
  ],
  "risk": [
    {
      "title": "SEC Investor.gov · What is Risk?",
      "url": "https://www.investor.gov/introduction-investing/investing-basics/what-risk"
    }
  ],
  "diversification": [
    {
      "title": "SEC Investor.gov · Asset Allocation and Diversification",
      "url": "https://www.investor.gov/introduction-investing/getting-started/asset-allocation"
    }
  ],
  "fundamentals": [
    {
      "title": "FINRA · Evaluating Stocks",
      "url": "https://www.finra.org/investors/investing/investment-products/stocks/evaluating-stocks"
    }
  ],
  "technical": [
    {
      "title": "Fidelity Learn · What is technical analysis?",
      "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/what-is-technical-analysis"
    }
  ]
};

  const learningNotes = {
  "stocks": [
    "Common and preferred shares",
    "Different kinds of shares can have different rights. Common shareholders may be able to vote at shareholder meetings. Preferred shares often have priority for dividend payments and claims on assets. The specific rights depend on the share class."
  ],
  "prices": [
    "A quote is a snapshot",
    "In a real market, the price displayed when you decide to trade may differ from the eventual execution price. Orders take time to reach a trading venue, and prices can move during that time. Our virtual market uses generated example quotes, rather than real market data."
  ],
  "returns": [
    "Follow the money",
    "Imagine you own 10 shares and the company pays a dividend of Rp50 per share. That payment adds Rp500 to cash. Separately, your remaining shares can rise or fall in price. A cash payment and a change in share value are different parts of the total result."
  ],
  "risk": [
    "Recognize five common risks",
    "Company-specific risk comes from one business. Market risk can affect many businesses together. Liquidity risk concerns how easily you can sell. Inflation risk affects buying power. Concentration risk grows when too much depends on one holding or industry. A practice decision can involve several at once."
  ],
  "diversification": [
    "Allocation and diversification work together",
    "Asset allocation describes the split between broad types of investments, such as cash, bonds, and stocks. Diversification also considers the spread within each category. Review both the number of holdings and the size of each position when describing a portfolio."
  ],
  "fundamentals": [
    "Compare like with like",
    "A ratio is more meaningful when you know the industry and the period used in its calculation. Compare earnings, debt, and sales alongside valuation. A single low ratio can leave out an important part of the business story."
  ],
  "technical": [
    "Describe the chart before interpreting it",
    "First identify the time window, price direction, and size of the swings. Then look at trading volume. A moving average can smooth past prices, but it responds to data that has already happened. Indicators can disagree, so a pattern is a starting point for a question."
  ]
};
  courses.forEach(course => {
    course.sections.push(learningNotes[course.id]);
    course.minutes = 3;
  });

  return {
    lessons, assets, annualRates, inflation, stageAt, scenarios, watchlist, advance, market, sum,
    startingCash, lastMarketDay, stocks, newAccount, quotePrice, quoteSeries, advanceDemoQuotes, portfolio, executeTrade, courses, quizzes, news, academySources,
  };
})();
