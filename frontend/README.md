# CaGa CaGa

A local frontend for the Autonomous Life-Stage Simulator. Run this from the folder containing these files with Node.js 18 or newer.

```powershell
node server.mjs
```

Open http://127.0.0.1:8000 in your browser. Keep the terminal open while testing. If port 8000 is busy, run `node server.mjs 8080` and open http://127.0.0.1:8080.

## What to check

1. Use the panel icon in the header to hide or show New Chat and History. The five feature icons stay available. On Home, choose **Try an example** to open a prepared journey at month 12. Choose **Start a simulation** for a fresh journey.
2. Set a monthly allowance and split it across cash, bonds, and broad equities. Try an allocation totaling less than 100%, then correct it. Advance six months or one year and compare the nominal and inflation-adjusted balances. In the composer, try `advance 6 months` or `advance 1 year`.
3. Open **Demo account**. Switch the asset, time range, and scenario. Check that the chart marker, explanation, price change, and portfolio change describe the same event. Ask the coach why the chart moved.
4. Start a **New Chat**, ask about inflation, then return to **History** in the sidebar. Reopen the chat and simulation. Reload the browser to check history on the same localhost address.
5. Open **Learning** and expand a lesson. Narrow the browser window to check the sidebar toggle and coach dialog on a phone-sized screen.

The prototype uses fictional credits, fixed modeled rates, and sample assets. The Simulation Coach uses scripted responses. Recent main chats and simulations are saved in this browser. The separate coach dialog is temporary.
