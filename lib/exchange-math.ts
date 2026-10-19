import Decimal from "decimal.js";
Decimal.set({ precision: 40 });
export function calculateExchange(
  amount: string,
  rate: string,
  feePercent: string,
  decimals = 2,
) {
  const send = new Decimal(amount),
    exchangeRate = new Decimal(rate),
    percent = new Decimal(feePercent);
  if (
    !send.isFinite() ||
    !send.gt(0) ||
    !exchangeRate.isFinite() ||
    !exchangeRate.gt(0) ||
    !percent.isFinite() ||
    percent.lt(0) ||
    percent.gte(100)
  )
    throw new Error("Invalid exchange values");
  const fee = send.mul(percent).div(100);
  const receive = send
    .minus(fee)
    .mul(exchangeRate)
    .toDecimalPlaces(decimals, Decimal.ROUND_DOWN);
  return {
    send: send.toFixed(),
    fee: fee.toFixed(),
    receive: receive.toFixed(decimals),
    rate: exchangeRate.toFixed(),
  };
}
export function normalizeTrxId(value: string) {
  return value.trim().toUpperCase();
}
