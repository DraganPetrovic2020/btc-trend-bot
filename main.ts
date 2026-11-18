// Channel-breakout trend follower for cbBTC/USDC on one-minute bars (agent-fun/bars-replay/v1).
//
// Long only, one position. Each batch carries the bar that just closed; the bot decides on that
// close and its orders fill at the next bar's open.
//   - Enter (all cash) when the close breaks the highest close of the previous ENTRY_LOOKBACK bars
//     by at least BREAKOUT_BPS. A ~26-30 bps round trip needs a real move, so small new highs in
//     chop are ignored; only a clean break of a two-hour range is bought.
//   - Exit the whole position when the close falls under the lowest close of the previous
//     EXIT_LOOKBACK bars (the up-move's channel broke), or TRAIL_BPS under the highest close since
//     entry (a hard trailing stop for a sudden drop).
//   - After an exit, wait COOLDOWN_BARS before re-entering, to avoid churning fees.
// Settings sit in the middle of a range that is profitable on the dev window (breakout margin
// 18-25 bps across lookbacks of 60-240 bars), not at its single best point.
// Prices are compared as integers (BigInt), so two runs on the same bars give the same orders.

import { BPS, runBars, type BarsState, type BuyInput, type SellInput } from './vendor/makefun-bars.ts';

const ENTRY_LOOKBACK = 120;
const BREAKOUT_BPS = 22n;
const EXIT_LOOKBACK = 90;
const TRAIL_BPS = 200n;
const COOLDOWN_BARS = 30;
const BUY_MAX_SLIPPAGE_BPS = 60;
const SELL_MAX_SLIPPAGE_BPS = 300; // an exit must not be refused in a fast drop

const HISTORY = Math.max(ENTRY_LOOKBACK, EXIT_LOOKBACK);
const closes: bigint[] = []; // previous closes, oldest first, at most HISTORY of them
let seen = 0;
let peak = 0n;
let lastExitBar = -1_000_000;

function extreme(n: number, pick: (a: bigint, b: bigint) => bigint): bigint {
  let v = closes[closes.length - n];
  for (let i = closes.length - n + 1; i < closes.length; i++) v = pick(v, closes[i]);
  return v;
}
const max = (a: bigint, b: bigint): bigint => (a > b ? a : b);
const min = (a: bigint, b: bigint): bigint => (a < b ? a : b);

function decide(state: BarsState, symbol: string, close: bigint): (BuyInput | SellInput)[] {
  if (state.warmingUp || closes.length < HISTORY) return [];

  const held = state.positions.get(symbol);
  if (held !== undefined) {
    if (close > peak) peak = close;
    const channelBroke = close < extreme(EXIT_LOOKBACK, min);
    const stopped = close * BPS < peak * (BPS - TRAIL_BPS);
    if (channelBroke || stopped) {
      lastExitBar = seen;
      return [{ side: 'sell', symbol, qty: held.qty, max_slippage_bps: SELL_MAX_SLIPPAGE_BPS }];
    }
    return [];
  }

  if (seen - lastExitBar < COOLDOWN_BARS) return [];
  const rangeHigh = extreme(ENTRY_LOOKBACK, max);
  if (close * BPS <= rangeHigh * (BPS + BREAKOUT_BPS)) return [];

  const { caps, fees } = state.hello;
  const byWeight = (BigInt(caps.max_weight_bps) * state.equity) / BPS;
  const spend = state.cash < byWeight ? state.cash : byWeight;
  if (spend < BigInt(fees.min_notional_quote_units)) return [];
  peak = close;
  return [{ side: 'buy', symbol, notional_quote_units: spend, max_slippage_bps: BUY_MAX_SLIPPAGE_BPS }];
}

await runBars({
  onBatch(state, batch) {
    const orders: (BuyInput | SellInput)[] = [];
    for (const bar of batch.bars) {
      const close = BigInt(bar.c);
      seen++;
      orders.push(...decide(state, bar.symbol, close));
      closes.push(close);
      if (closes.length > HISTORY) closes.shift();
    }
    return orders;
  },
});
