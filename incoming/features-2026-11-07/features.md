# CaGa CaGa — Complete Website Feature Checklist

**Project:** CaGa CaGa — Student Investment Education Platform  
**Purpose:** An educational website where students learn about investing, practice with virtual money, research market information, and complete challenges.  
**Target:** Hackathon prototype (MVP first, advanced features later)  
**Status:** All checkboxes are initially unchecked so the team can choose and track implementation.

> **Important rule:** All quizzes belong to **Investment Missions & Challenges**. The Learning Academy provides lessons and links students to the appropriate quiz in the Missions & Challenges module. No real-money trading is supported.

## 1. Investment Learning Academy

**Goal:** Teach students stock-investing concepts using structured, interactive lessons.

### Core Features (MVP)

- [ ] **Learning Dashboard** — Show available courses, completed lessons, and learning progress.
- [ ] **Learning Modules** — Organize lessons from beginner to advanced levels.
- [ ] **Interactive Lessons** — Explain concepts using text, diagrams, charts, and practical examples.
- [ ] **Learning Progress Tracking** — Track completed lessons and overall course completion.

### Additional Features

- [ ] **Investment Glossary** — Provide searchable definitions of financial and investment terms.
- [ ] **Course Search & Categories** — Browse lessons by topic or difficulty.
- [ ] **Personalized Learning Recommendations** — Suggest the next lesson based on student progress.

### Suggested Course Topics

1. Introduction to Stocks
2. Stock Prices and Market Mechanics
3. Dividends and Capital Gains
4. Investment Risks
5. Fundamental Analysis
6. Technical Analysis Basics
7. Portfolio Diversification

**Quiz integration:** At the end of each lesson, show a **Take Quiz** link or button that opens the relevant quiz under **Investment Missions & Challenges**. Quiz scores and XP are managed there.

---

## 2. Virtual Stock Trading Simulator (Demo Account)

**Goal:** Let students practice virtual stock trading without risking real money.

### Core Features (MVP)

- [ ] **Virtual Demo Account** — Give each student Rp10,000,000 in simulated starting capital.
- [ ] **Stock Market Dashboard** — Show stock prices, percentage changes, and charts.
- [ ] **Stock Search** — Find companies by name or stock ticker.
- [ ] **Stock Detail Page** — Display company information, price charts, and basic financial data.
- [ ] **Virtual Buy & Sell** — Submit simulated orders with virtual-balance and holding checks.
- [ ] **Portfolio Dashboard** — Display holdings, remaining cash, returns, and asset allocation.
- [ ] **Transaction History** — Record virtual purchases and sales, including quantity, price, and date.

### Additional Features

- [ ] **Stock Watchlist** — Bookmark companies to monitor.
- [ ] **Portfolio Performance Chart** — Chart the value of the simulated portfolio over time.
- [ ] **Live or Delayed Market Data** — Connect a market data API; show the data source and last update time.
- [ ] **Dividend Simulation** — Credit applicable simulated dividends to a demo account.
- [ ] **Instrument Comparison** — Compare stocks using financial metrics and historical price performance.

**Simulation rules:** Every purchase, sale, gain, loss, dividend, and balance is virtual. Label simulated or delayed prices clearly. Provide fallback demo data if the market API is unavailable.

---

## 3. AI Investment Mentor

**Goal:** Help students understand concepts, analyze available information, and reflect on virtual investment decisions.

### Core Features (MVP)

- [ ] **AI Chat Interface** — Let students ask investment-related questions in natural language.
- [ ] **Investment Term Explainer** — Explain stocks, dividends, P/E ratios, market capitalization, and similar terms.
- [ ] **Portfolio Analysis & Feedback** — Discuss concentration, diversification, and risk in simulated holdings.
- [ ] **Suggested AI Prompts** — Provide clickable example questions to start a conversation.

### Additional Features

- [ ] **Stock Chart Explanation** — Explain trends, volatility, and chart terminology.
- [ ] **Company Comparison** — Explain differences between selected companies using available data.
- [ ] **Financial News Explanation** — Explain economic events and financial news in student-friendly language.
- [ ] **AI Chat History** — Save previous educational conversations.
- [ ] **Context-Aware AI** — Give the AI access to the currently selected stock, article, or virtual portfolio.

**AI behavior:** The mentor should explain uncertainty, distinguish factual data from opinion, avoid guaranteeing returns, and provide education rather than personalized real-money investment instructions.

---

## 4. Investment Missions & Challenges

**Goal:** Centralize **every quiz** and make learning engaging with practical missions, XP, and achievements.

### Core Features (MVP)

- [ ] **Quiz Center** — Provide a dedicated hub containing all investment quizzes.
- [ ] **Learning Module Quizzes** — Link each Academy lesson to a quiz hosted in this section.
- [ ] **Multiple Choice & True/False** — Support question formats with feedback and explanations.
- [ ] **Mission Dashboard** — Show available, ongoing, and completed challenges.
- [ ] **Portfolio Diversification Missions** — Challenge students to build diversified simulated holdings.
- [ ] **XP & Reward Points** — Reward understanding, responsible reasoning, and task completion.

### Additional Features

- [ ] **Investment Risk Challenges** — Ask students to identify and assess financial risks.
- [ ] **Fact vs. Opinion Challenges** — Teach students to differentiate verified facts from market opinions.
- [ ] **News Sentiment Challenges** — Let students classify and explain the sentiment of headlines.
- [ ] **Badges & Achievements** — Unlock awards after educational milestones.
- [ ] **Learning Leaderboard** — Rank educational achievements, not investment returns.
- [ ] **Weekly Challenges** — Rotate new educational missions.

### Suggested Starter Missions

- **First Investment** — Complete the introductory stocks quiz.
- **Smart Diversifier** — Construct a virtual portfolio across at least three sectors.
- **Risk Detective** — Identify five investment risks.
- **Market Analyst** — Distinguish facts from opinions in market statements.

**Scoring rule:** Points reflect correct answers, explanations, and risk awareness—not the largest simulated profit.

---

## 5. Market News & Sentiment Lab

**Goal:** Teach students to interpret financial news and understand why positive or negative sentiment does not guarantee price movements.

### Core Features (MVP)

- [ ] **Financial News Feed** — Display headlines with publisher, publication date, and source link.
- [ ] **AI News Summarizer** — Explain complex news in simple, student-friendly language.
- [ ] **AI Sentiment Classification** — Label analyzed news as positive, neutral, or negative.
- [ ] **Sentiment Reasoning** — Show the evidence and reasoning behind each sentiment label.

### Additional Features

- [ ] **News Search & Filters** — Filter news by company, topic, or category.
- [ ] **Related Stock Information** — Show stocks or companies relevant to a story.
- [ ] **News vs. Stock Price Comparison** — Explore historical news events alongside price charts.
- [ ] **Sentiment Trend Chart** — Visualize changes in sentiment over time.
- [ ] **Source Comparison** — Compare coverage of the same event from different publishers.

**Quiz integration:** A **Try Sentiment Challenge** link should open a quiz or mission in **Investment Missions & Challenges**. Do not build a separate quiz engine inside the News module.

---

## 6. Website Foundation

**Goal:** Supply the shared navigation, student profile, and data persistence required by all five programs.

### Core Features (MVP)

- [ ] **Home Dashboard** — Unified homepage with learning, market, missions, and portfolio highlights.
- [ ] **Website Navigation** — Responsive navigation across desktop and mobile.
- [ ] **Demo User Profile** — Display a student profile for the hackathon demo.
- [ ] **Persistent User Data** — Preserve virtual trades, portfolio balances, completed lessons, and earned XP.

### Additional Features

- [ ] **Login & Registration** — Support separate student accounts.
- [ ] **Dark & Light Mode** — Let students switch the visual appearance.

---

## Suggested Website Navigation

- **Home** — Overall dashboard and highlights.
- **Learning Academy** — Courses and lessons; links to Missions quizzes.
- **Market & Simulator** — Stock dashboard, virtual trades, watchlist, portfolio.
- **AI Investment Mentor** — Chat and explanations.
- **Missions & Challenges** — All quizzes, tasks, XP, badges, and achievements.
- **News & Sentiment Lab** — Headlines, sentiment explanations, stock-news connections.
- **Profile** — Student information, virtual portfolio stats, learning progress.

## Feature Summary

| Program | MVP features | Additional features | Total |
|---|---:|---:|---:|
| Investment Learning Academy | 4 | 3 | 7 |
| Virtual Stock Trading Simulator | 7 | 5 | 12 |
| AI Investment Mentor | 4 | 5 | 9 |
| Investment Missions & Challenges | 6 | 6 | 12 |
| Market News & Sentiment Lab | 4 | 5 | 9 |
| Website Foundation | 4 | 2 | 6 |
| **Total** | **29** | **26** | **55** |

## Recommended Hackathon Development Order

1. **Website Foundation** — Build the shared layout, navigation, and demo user model.
2. **Virtual Stock Trading Simulator** — Build virtual balance, charts, buy/sell, and portfolio.
3. **Investment Learning Academy** — Publish foundational lessons and progress tracking.
4. **Missions & Challenges** — Add quiz engine, missions, and XP; connect Academy lessons.
5. **AI Investment Mentor** — Integrate educational chat and portfolio explanations.
6. **Market News & Sentiment Lab** — Add news cards, summaries, and sentiment labels; link to challenges.
7. **Integration and Demo** — Test the end-to-end student learning flow, responsive UI, and fallback data.

## End-to-End Student Flow

**Learn in Academy → Take quiz in Missions & Challenges → Earn XP → Trade with virtual money → Review portfolio with AI Mentor → Read News & Sentiment Lab → Complete new Missions.**

---

*This is a product feature checklist, not a claim that any feature is already implemented.*
