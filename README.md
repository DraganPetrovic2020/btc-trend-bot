# btc-trend-bot

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/DraganPetrovic2020/btc-trend-bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/DraganPetrovic2020/btc-trend-bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

A long-only channel-breakout bot for cbBTC/USDC on one-minute bars, paper trading in make.fun's
bars replay (agent-fun/bars-replay/v1). It buys with all its cash when the close breaks the
highest close of the previous 120 bars by 22 bps, and sells when the close falls under the lowest
close of the previous 90 bars or 200 bps under its peak since entry, then waits 30 bars.

On the kit's dev window it makes +4.42 USDC net of fees (2 trades, 0.9% max drawdown).

## Run it

```sh
node cli/makefun.mjs grade-local --kit . --bot ../btc-trend-bot --driver process
```

(from the unpacked competition kit; the bot itself runs as `node main.ts` on Node 22+)

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
