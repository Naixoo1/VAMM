# CaGa CaGa

Open `index.html` in a browser to try the Student Investment Lab. Keep `index.html`, `style.css`, `model.js`, `app.js`, and the `images/` folder together. In VS Code, open this entire folder. You can also use Live Server.

For a localhost address with Node.js 18 or newer, run this command from the same folder.

```powershell
node server.mjs
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). If port 8000 is in use, run `node server.mjs 8080` and open [http://127.0.0.1:8080](http://127.0.0.1:8080).

## Try the demo

1. Select a feature image in the left rail. The title and contents of the sidebar change with the feature. Use the panel button at the top to collapse or reopen it.
2. Open **Learning Academy**. Use the large lesson tabs to review unlocked lessons. **Lesson Complete** saves your progress and unlocks the next step. **Next Lesson** confirms completion and opens the next step. Each lesson includes source links. Quizzes are available from **Missions & Challenges**.
3. In **Market & Simulator**, use the three links under **Practice Workspace**. **Real Market** opens TradingView on NASDAQ:AAPL with daily candles and symbol switching. **Simulator** lets you buy and sell fictional stocks with virtual IDR. Its generated demo prices and chart update every five seconds while Simulator or Portfolio is visible. **Portfolio** shows cash, holdings, profit/loss, and the fixed price of each completed transaction. The Home balance shows available virtual cash.
4. Open **AI Investment Mentor** and send a question. **New Chat** starts an empty conversation, and **Your chats** reopens saved conversations. A conversation is saved after its first message. Reopen the page or choose **End demo session** in **Demo profile** to begin with a fresh chat while keeping earlier messages.
5. Open **News & Sentiment Lab** to read curated summaries and their original sources. **Try Sentiment Challenge** opens the quiz in Missions & Challenges.

Your progress, trades, and conversations are saved in the current browser at the address you use to open the demo. Choose the same file path or localhost address when you return.

Simulator prices are generated examples. They update independently of the external TradingView chart.

The Mentor uses scripted educational responses. The news stories and sentiment labels are curated examples, and the trading data is simulated. The demo profile is stored locally. The five feature images are SVG placeholders in `images/` and can be replaced with your own artwork.

The Next.js website is maintained separately in [Naixoo1/VAMM](https://github.com/Naixoo1/VAMM). Its /market page includes TradingView and Original Chart for Learning.
