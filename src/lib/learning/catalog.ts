import type { LearningLesson, LearningTrack, QuizPack } from "./types";

/** Adapted authored learning content; examples are hypothetical, never simulator inputs. */
export const LESSON_POINTS = 10;
export const QUIZ_PASS_XP = 100;
export const LESSONS: readonly LearningLesson[] = [
  {
    "id": "stocks",
    "title": "Introduction to Stocks",
    "description": "Understand what a share represents and what owning one can mean.",
    "level": "Beginner",
    "minutes": 4,
    "objectives": [
      "Explain ownership in shares",
      "Calculate a simple ownership percentage",
      "Recognize that returns are uncertain"
    ],
    "sections": [
      [
        "A share is ownership",
        "A share represents part of a business. In a fictional company with 100 equal shares, owning one represents 1% ownership. That percentage does not promise a return."
      ],
      [
        "Returns remain uncertain",
        "A shareholder may receive dividends or sell a share for more than its purchase price. Prices can also fall, and a company may reduce or stop its dividend."
      ]
    ],
    "takeaways": [
      "A share is a claim on part of a business.",
      "Ownership percentage depends on total shares outstanding.",
      "Share prices and dividend payments can change."
    ],
    "watchout": "A familiar company can still be a risky investment. A low share price alone does not make it cheap.",
    "reflection": {
      "prompt": "A fictional business has 200 equal shares. You own 5. What percentage do you own?",
      "answer": "5 ÷ 200 × 100 = 2.5%. This describes your ownership, not a guaranteed share-price return."
    },
    "sources": [
      {
        "title": "Stocks",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks"
      }
    ]
  },
  {
    "id": "prices",
    "title": "Stock Prices and Market Mechanics",
    "description": "See how buyers and sellers arrive at a traded price.",
    "level": "Beginner",
    "minutes": 5,
    "objectives": [
      "Read a bid and an ask",
      "Explain the spread",
      "Distinguish a quote from a filled trade"
    ],
    "sections": [
      [
        "Read both sides of a quote",
        "The bid is a quoted buying price and the ask is a quoted selling price. An illustrative bid of Rp990 and ask of Rp1,010 have a Rp20 spread per share."
      ],
      [
        "A quote is not a completed trade",
        "Orders, available quantities, and prices can change before execution. A chart records price observations; it does not prove what caused them or guarantee the next trade."
      ]
    ],
    "takeaways": [
      "The bid is a quoted buying price; the ask is a quoted selling price.",
      "Ask minus bid is the spread.",
      "A displayed quote can change before your order fills."
    ],
    "watchout": "A market order does not guarantee a particular execution price. A limit order controls price but may not fill.",
    "reflection": {
      "prompt": "The displayed ask is Rp1,010. Is your next market buy guaranteed to fill at Rp1,010?",
      "answer": "No. Available shares and prices may change before execution. Review the order type, available liquidity, and final fill."
    },
    "sources": [
      {
        "title": "Types of Orders",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders"
      },
      {
        "title": "Ask Price",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/glossary/ask-price"
      }
    ]
  },
  {
    "id": "returns",
    "title": "Dividends and Capital Gains",
    "description": "Separate a company payment from a change in the value of a share.",
    "level": "Beginner",
    "minutes": 5,
    "objectives": [
      "Separate dividends from price gains",
      "Distinguish realized and unrealized gains",
      "Include costs in a return calculation"
    ],
    "sections": [
      [
        "Separate the sources of a return",
        "A cash dividend is separate from proceeds from selling a share. A change in a share you still hold is unrealized and can change before a sale."
      ],
      [
        "Include costs",
        "In a fictional example, Rp2,200 sale proceeds minus a Rp2,000 purchase, plus a Rp50 dividend and minus Rp20 total costs, leaves Rp230 before tax. Dividends and gains are not guaranteed."
      ]
    ],
    "takeaways": [
      "Selling above the purchase price realizes a capital gain.",
      "A paid cash dividend is separate from the sale proceeds.",
      "Fees and taxes can reduce the amount you keep."
    ],
    "watchout": "Dividends are not guaranteed and do not create free money. The share price may adjust around a distribution.",
    "reflection": {
      "prompt": "Buy one share for Rp2,000, receive Rp50, then sell for Rp1,900 with Rp20 total costs. What is the result before tax?",
      "answer": "Rp1,900 − Rp2,000 + Rp50 − Rp20 = −Rp70. Receiving a dividend did not prevent an overall loss."
    },
    "sources": [
      {
        "title": "Stocks",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks"
      }
    ]
  },
  {
    "id": "risk",
    "title": "Investment Risks",
    "description": "Spot common risks before you interpret a price or build a portfolio.",
    "level": "Beginner",
    "minutes": 6,
    "objectives": [
      "Identify different sources of risk",
      "Connect risk with when you need cash",
      "Recognize that losses can be permanent"
    ],
    "sections": [
      [
        "Risk has several sources",
        "A business problem can affect one company, while market conditions can affect many. Concentration, difficulty selling, and rising consumer prices create other risks."
      ],
      [
        "Consider deadlines",
        "If an expense is due during a price decline, selling may make the loss permanent. Educational examples help explain that trade-off; a longer holding period does not guarantee recovery."
      ]
    ],
    "takeaways": [
      "Volatility describes fluctuations, not every possible risk.",
      "Selling to meet a near-term expense can lock in a loss.",
      "A longer time horizon does not guarantee recovery."
    ],
    "watchout": "A past recovery is not a promise. A business can fail, and investments can lose their entire value.",
    "reflection": {
      "prompt": "You need tuition money next month. Your shares fall 20%. What makes that deadline relevant?",
      "answer": "You may have to sell while the price is down to pay the bill. Review how much money must remain accessible and how much loss you could absorb."
    },
    "sources": [
      {
        "title": "Asset Allocation",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/getting-started/asset-allocation"
      }
    ]
  },
  {
    "id": "diversification",
    "title": "Portfolio Diversification",
    "description": "Explore how spreading holdings can change where your risk comes from.",
    "level": "Beginner",
    "minutes": 5,
    "objectives": [
      "Read portfolio weights",
      "Spot overlapping exposures",
      "Distinguish sector spread from asset allocation"
    ],
    "sections": [
      [
        "Look through the names",
        "Several holdings can depend on the same industry or businesses. Check their underlying exposures, not only how many names appear in a list."
      ],
      [
        "Read the weights",
        "A fictional mix of 50% technology, 30% consumer goods, and 20% energy still puts half its value in one sector. This illustrates weights rather than recommending an allocation. Diversified holdings can fall together."
      ]
    ],
    "takeaways": [
      "Count position sizes as well as the number of holdings.",
      "Different stock names may depend on the same industry.",
      "Diversified investments can still decline together."
    ],
    "watchout": "The sample 50/30/20 mix illustrates weights. It is not a recommended allocation or protection from loss.",
    "reflection": {
      "prompt": "You own three funds, but all have the same technology companies as their largest holdings. Are you broadly diversified?",
      "answer": "Not necessarily. Look through each fund to its underlying holdings and weights, then check sector, asset-class, and geographic overlap."
    },
    "sources": [
      {
        "title": "Asset Allocation",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/getting-started/asset-allocation"
      }
    ]
  },
  {
    "id": "fundamentals",
    "title": "Fundamental Analysis",
    "description": "Look at a business’s revenue, earnings, and valuation.",
    "level": "Intermediate",
    "minutes": 7,
    "objectives": [
      "Separate revenue from earnings",
      "Calculate a simple P/E ratio",
      "Compare businesses using context"
    ],
    "sections": [
      [
        "Distinguish sales and earnings",
        "Revenue measures sales before expenses. Earnings remain after expenses. Read their reporting periods and compare similar businesses before drawing a conclusion."
      ],
      [
        "A ratio needs context",
        "In a hypothetical example, a Rp2,000 share price divided by Rp100 earnings per share gives a P/E of 20. Earnings quality, debt, growth, and unusual items can change how useful that comparison is."
      ]
    ],
    "takeaways": [
      "Revenue is sales before expenses; earnings remain after expenses.",
      "P/E divides share price by earnings per share.",
      "Compare the same reporting period and similar businesses."
    ],
    "watchout": "A low P/E does not prove a bargain. Negative or unusually high one-off earnings can make the ratio misleading.",
    "reflection": {
      "prompt": "Two companies have P/E ratios of 10× and 20×. Can you conclude that the first is the better investment?",
      "answer": "No. Check the industry, earnings quality, growth, debt, cash flow, and reporting period. A single ratio cannot resolve the whole decision."
    },
    "sources": [
      {
        "title": "Stock Analysis",
        "publisher": "Fidelity Learn",
        "url": "https://www.fidelity.com/learning-center/trading-investing/stock-analysis"
      }
    ]
  },
  {
    "id": "technical",
    "title": "Technical Analysis Basics",
    "description": "Read trends, volume, and volatility in a price chart.",
    "level": "Intermediate",
    "minutes": 6,
    "objectives": [
      "Read the chart’s time window and axes",
      "Separate price from trading volume",
      "Describe a pattern without predicting a return"
    ],
    "sections": [
      [
        "Start with axes and time",
        "Read the time window, scale, and quote currency before describing a chart. Changing the window can change the pattern that appears."
      ],
      [
        "Describe rather than predict",
        "Price and volume measure different observations. Indicators summarize data and can disagree. Neither a rising line nor a volume spike establishes the next price move or a buy/sell recommendation."
      ]
    ],
    "takeaways": [
      "A price line and volume bars measure different things.",
      "Changing the time window changes the pattern you see.",
      "Indicators summarize past data and can disagree."
    ],
    "watchout": "A rising line or high volume is not a buy signal by itself. Chart patterns do not guarantee future results.",
    "reflection": {
      "prompt": "A sample price rises while volume falls. What can you state confidently?",
      "answer": "Describe the observations: price rose in that period and fewer shares traded. The chart alone cannot establish the cause or guarantee the next price move."
    },
    "sources": [
      {
        "title": "What Is Technical Analysis?",
        "publisher": "Fidelity Learn",
        "url": "https://www.fidelity.com/learning-center/trading-investing/technical-analysis/what-is-technical-analysis"
      }
    ]
  },
  {
    "id": "compounding",
    "title": "Compounding Over Time",
    "description": "Follow how earlier gains can change the amount that earns a return next year.",
    "level": "Beginner",
    "minutes": 5,
    "objectives": [
      "Distinguish simple and compound growth",
      "Calculate two years of hypothetical growth",
      "Identify the assumptions behind a projection"
    ],
    "sections": [
      [
        "Allow the starting amount to change",
        "At an illustrative 5% annual gain, Rp1,000,000 becomes Rp1,050,000 after one year. Keeping that gain invested makes the second year begin with a larger amount."
      ],
      [
        "State the assumptions",
        "A second hypothetical 5% gain adds Rp52,500, giving Rp1,102,500 before costs. Real returns can vary or be negative; this fixed-rate example excludes deposits, withdrawals, taxes, and fees."
      ]
    ],
    "takeaways": [
      "Reinvested gains can add to next year’s starting balance.",
      "Changing the time or rate changes the outcome.",
      "A projected balance depends on its assumptions."
    ],
    "watchout": "The fixed rate is an example. It does not promise a stock market return.",
    "reflection": {
      "prompt": "If you withdraw the Rp50,000 first-year gain, how much would a 5% gain add in year two?",
      "answer": "Rp50,000. Year two would start at Rp1,000,000 again, so the first year’s gain would not earn a return."
    },
    "sources": [
      {
        "title": "Small Savings Add Up to Big Money",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/small-savings-add-big-money"
      }
    ]
  },
  {
    "id": "inflation",
    "title": "Inflation and Buying Power",
    "description": "Compare a balance in rupiah with what it can buy.",
    "level": "Beginner",
    "minutes": 5,
    "objectives": [
      "Explain inflation in everyday terms",
      "Separate nominal value from purchasing power",
      "Compare a growth rate with rising prices"
    ],
    "sections": [
      [
        "Separate an amount from its buying power",
        "An unchanged balance buys less when the same basket of goods costs more. An inflation measure describes a basket; an individual household can experience different price changes."
      ],
      [
        "Compare consistent periods",
        "If a hypothetical basket rises 5% in price, Rp1,000,000 divided by 1.05 has buying power of about Rp952,381 at starting prices. Match the return and inflation periods before making a comparison."
      ]
    ],
    "takeaways": [
      "The number on a balance and its buying power can move differently.",
      "Inflation measures a basket, so personal spending can differ.",
      "Use comparable periods when comparing returns with inflation."
    ],
    "watchout": "Do not substitute one product’s price change for a published inflation rate.",
    "reflection": {
      "prompt": "Your balance grows 5% while the same basket also costs 5% more. Did your basket buying power increase?",
      "answer": "It stayed the same in this simplified example: both the amount available and the basket cost grew at the same rate."
    },
    "sources": [
      {
        "title": "Inflasi",
        "publisher": "Bank Indonesia",
        "url": "https://www.bi.go.id/id/fungsi-utama/moneter/inflasi/Default.aspx"
      }
    ]
  },
  {
    "id": "costs",
    "title": "Fees and Net Returns",
    "description": "Compare what an investment earns with what remains after costs.",
    "level": "Beginner",
    "minutes": 5,
    "objectives": [
      "Distinguish gross and net gains",
      "Identify one-time and ongoing costs",
      "Compare two hypothetical fee schedules"
    ],
    "sections": [
      [
        "Small costs affect what remains",
        "Fees and expenses reduce the amount kept from an investment. Learn what each charge covers and whether it is fixed, recurring, or linked to a transaction."
      ],
      [
        "Use comparable assumptions",
        "In a simplified one-period example, a 5% gross return and a 1% fee based on the same starting amount leave 4% before other costs or tax. Actual fee timing and calculation methods can differ."
      ]
    ],
    "takeaways": [
      "Read the fee schedule and what a quoted return includes.",
      "Compare the same time period and starting amount.",
      "Small ongoing fees can add up and reduce future compounding."
    ],
    "watchout": "Lower fees are one comparison factor. Compare the risk and services as well.",
    "reflection": {
      "prompt": "Two comparable products both show Rp50,000 of gross gain. One costs Rp10,000 and the other Rp20,000. How much more net gain does the lower-cost example retain?",
      "answer": "Rp10,000 more before taxes: Rp40,000 instead of Rp30,000. This isolates costs, assuming the same gain."
    },
    "sources": [
      {
        "title": "How Fees and Expenses Affect Your Investment Portfolio",
        "publisher": "SEC Investor.gov",
        "url": "https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated"
      }
    ]
  }
];

export const TRACKS: readonly LearningTrack[] = [
  {
    "id": "stock-essentials",
    "title": "Stock Market Essentials",
    "description": "Understand shares, follow a trade from quote to fill, and calculate what a holding earned.",
    "level": "Beginner",
    "art": "academy",
    "lessons": [
      "stocks",
      "prices",
      "returns"
    ]
  },
  {
    "id": "portfolio-risk",
    "title": "Portfolio & Risk",
    "description": "Identify the risks you take and read where a portfolio is concentrated.",
    "level": "Beginner",
    "art": "market",
    "lessons": [
      "risk",
      "diversification"
    ]
  },
  {
    "id": "market-research",
    "title": "Company Research & Charts",
    "description": "Read earnings and valuation figures, then interpret price and volume without jumping to a forecast.",
    "level": "Intermediate",
    "art": "news",
    "lessons": [
      "fundamentals",
      "technical"
    ]
  },
  {
    "id": "long-term",
    "title": "Long-Term Investing",
    "description": "See how growth, rising prices, and fees change what an investment can buy over time.",
    "level": "Beginner",
    "art": "missions",
    "lessons": [
      "compounding",
      "inflation",
      "costs"
    ]
  }
];

export const QUIZ_PACKS: readonly QuizPack[] = [
  {
    "id": "stocks-101",
    "title": "Stock Basics",
    "icon": "academy",
    "description": "Understand stock ownership, dividends, and changes in value.",
    "concepts": [
      "A share represents part ownership in a company.",
      "Companies can issue new shares to raise money for the business.",
      "Share prices can rise or fall, and dividends are not guaranteed."
    ],
    "questions": [
      {
        "id": "stocks-101-q1",
        "prompt": "What do you own when you buy a share of a company?",
        "choices": [
          "A guaranteed payment from the company",
          "Part ownership in the company",
          "The right to take company property",
          "A savings balance with fixed interest"
        ],
        "answer": 1,
        "why": "A share represents part ownership in a company. It does not guarantee a fixed payment.",
        "tag": "Ownership"
      },
      {
        "id": "stocks-101-q2",
        "prompt": "Why might a company issue new shares?",
        "choices": [
          "To keep its share price fixed",
          "To guarantee a profit for shareholders",
          "To raise money for the business",
          "To stop selling products"
        ],
        "answer": 2,
        "why": "Selling new shares can raise capital, for example to expand the business.",
        "tag": "Raising capital"
      },
      {
        "id": "stocks-101-q3",
        "prompt": "What is a payment a company may distribute to its shareholders called?",
        "choices": [
          "A dividend",
          "Inflation",
          "Personal debt",
          "The purchase price"
        ],
        "answer": 0,
        "why": "A dividend is a distribution to shareholders. Payment policies vary by company.",
        "tag": "Dividends"
      },
      {
        "id": "stocks-101-q4",
        "prompt": "Every stock pays a dividend each month.",
        "choices": [
          "True",
          "False"
        ],
        "answer": 1,
        "why": "Some companies do not pay dividends. Those that do can follow different payment schedules.",
        "tag": "Dividends"
      },
      {
        "id": "stocks-101-q5",
        "prompt": "In a fictional trade, a share bought for Rp10,000 is sold for Rp12,000. What is the change before fees and taxes?",
        "choices": [
          "Rp2,000 loss",
          "No change",
          "Rp12,000 gain",
          "Rp2,000 gain"
        ],
        "answer": 3,
        "why": "Subtract the purchase price from the sale price: Rp12,000 − Rp10,000 = Rp2,000.",
        "tag": "Change in value"
      }
    ]
  },
  {
    "id": "risk-and-return",
    "title": "Risk Detective",
    "icon": "missions",
    "description": "Spot losses, uncertainty, and concentration in a portfolio.",
    "concepts": [
      "Investment values can change, and returns are uncertain.",
      "Putting all your money into one company increases your exposure to that company.",
      "Diversification spreads exposure, but losses remain possible."
    ],
    "questions": [
      {
        "id": "risk-and-return-q1",
        "prompt": "A virtual investment falls from Rp100,000 to Rp80,000 without any deposits or withdrawals. What happened?",
        "choices": [
          "It fell by Rp80,000",
          "It rose by Rp20,000",
          "It fell by Rp20,000",
          "It stayed at Rp100,000"
        ],
        "answer": 2,
        "why": "Rp100,000 minus Rp80,000 is Rp20,000. An investment can lose value without a withdrawal.",
        "tag": "Investment losses"
      },
      {
        "id": "risk-and-return-q2",
        "prompt": "Rani puts all her virtual money into one company. What risk stands out?",
        "choices": [
          "Her result depends heavily on one company",
          "She owns too many types of investment",
          "She has removed market risk",
          "Her result is the same as holding many companies"
        ],
        "answer": 0,
        "why": "A portfolio concentrated in one company is more exposed to problems at that company.",
        "tag": "Concentration"
      },
      {
        "id": "risk-and-return-q3",
        "prompt": "Which statement about diversification is correct?",
        "choices": [
          "It guarantees there are no losses",
          "It makes all investments rise together",
          "It means holding one famous company",
          "It spreads exposure while some risk remains"
        ],
        "answer": 3,
        "why": "Diversification can reduce dependence on any single investment. It cannot prevent all losses.",
        "tag": "Diversification"
      },
      {
        "id": "risk-and-return-q4",
        "prompt": "A riskier investment always delivers a bigger gain.",
        "choices": [
          "True",
          "False"
        ],
        "answer": 1,
        "why": "A higher potential return is not a guarantee. Taking more risk can also lead to a larger loss.",
        "tag": "Uncertainty"
      },
      {
        "id": "risk-and-return-q5",
        "prompt": "A chart that rose for several days proves the price will rise tomorrow.",
        "choices": [
          "True",
          "False"
        ],
        "answer": 1,
        "why": "Past price changes do not settle future outcomes. New information and market conditions can change prices.",
        "tag": "Past performance"
      }
    ]
  },
  {
    "id": "facts-and-news",
    "title": "Facts, Opinions & News",
    "icon": "news",
    "description": "Separate verifiable claims, opinions, and predictions in market stories.",
    "concepts": [
      "A factual claim can be checked against evidence.",
      "An opinion expresses a judgment. A prediction describes something that has not happened.",
      "A positive headline cannot establish how a share price will move."
    ],
    "questions": [
      {
        "id": "facts-and-news-q1",
        "prompt": "Which statement is a factual claim you could check against a source?",
        "choices": [
          "I find this company the most interesting",
          "The company reported Rp20 billion in annual revenue",
          "This stock will definitely be the best choice next year",
          "I prefer this brand to its competitors"
        ],
        "answer": 1,
        "why": "You can compare reported revenue with an annual report. Being checkable does not make the claim proven.",
        "tag": "Factual claims"
      },
      {
        "id": "facts-and-news-q2",
        "prompt": "Which statement expresses a personal opinion?",
        "choices": [
          "The invitation says the meeting starts at 10 a.m.",
          "The report lists 120 stores at year-end",
          "The recorded closing price was Rp1,500",
          "I think this company has the most attractive product design"
        ],
        "answer": 3,
        "why": "The final statement expresses someone’s judgment. The other claims could be checked against records.",
        "tag": "Opinion"
      },
      {
        "id": "facts-and-news-q3",
        "prompt": "A positive headline is enough to guarantee that a stock will rise.",
        "choices": [
          "True",
          "False"
        ],
        "answer": 1,
        "why": "A headline’s tone does not determine a stock price. Other information and market expectations matter.",
        "tag": "Headlines and prices"
      },
      {
        "id": "facts-and-news-q4",
        "prompt": "Fictional news: “A company opened new stores, but costs rose and profit fell.” How would you describe the news?",
        "choices": [
          "Mixed: expansion alongside pressure on profit",
          "Only positive: nothing else changed",
          "Only negative: no positive development",
          "Neutral: the excerpt describes no changes"
        ],
        "answer": 0,
        "why": "Opening stores and falling profit point in different directions. Reading both gives a more complete picture.",
        "tag": "Context"
      },
      {
        "id": "facts-and-news-q5",
        "prompt": "A screenshot claims “the price will rise tomorrow” without a date or source. What should you check first?",
        "choices": [
          "Whether it was shared many times",
          "Whether you like the company",
          "The original source, date, and evidence",
          "Whether sharing it will make others agree"
        ],
        "answer": 2,
        "why": "The original source, timing, and evidence help you assess the claim. Popularity is not verification.",
        "tag": "Checking sources"
      }
    ]
  }
];

export const ACADEMY_MILESTONES = [
  {
    "points": 20,
    "title": "First Steps",
    "xp": 20
  },
  {
    "points": 50,
    "title": "Building Knowledge",
    "xp": 30
  },
  {
    "points": 80,
    "title": "Market Reader",
    "xp": 40
  },
  {
    "points": 100,
    "title": "Well-Rounded Learner",
    "xp": 50
  }
] as const;

export const GLOSSARY: readonly { term: string; definition: string }[] = [
  {
    "term": "Compounding",
    "definition": "When gains stay in your savings, future growth can apply to the original money and the earlier gains. Losses can compound too."
  },
  {
    "term": "Inflation",
    "definition": "Inflation means prices rise over time. Inflation-adjusted value estimates what your future balance could buy in today’s prices."
  },
  {
    "term": "Diversification",
    "definition": "Spreading money across different assets reduces how much one asset can affect the whole portfolio. Several assets can still fall together."
  },
  {
    "term": "Risk",
    "definition": "Risk is the possibility that the result differs from what you expected. Money you need soon may have less time to recover from a drop."
  },
  {
    "term": "Emergency savings",
    "definition": "An emergency fund is money you keep accessible for unexpected expenses, such as replacing a broken device."
  }
];

export function getLesson(id: string) { return LESSONS.find(lesson => lesson.id === id); }
export function getQuizPack(id: string) { return QUIZ_PACKS.find(pack => pack.id === id); }
export function isLessonAvailable(lessonId: string, completedLessonIds: readonly string[]): boolean {
  const track = TRACKS.find(item => item.lessons.some(id => id === lessonId));
  if (!track) return false;
  const index = track.lessons.findIndex(id => id === lessonId);
  return track.lessons.slice(0, index).every(id => completedLessonIds.includes(id));
}
