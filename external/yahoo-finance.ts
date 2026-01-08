import YahooFinance from "yahoo-finance2";
import type { FastifyInstance } from "fastify";
import type { StockDocument } from "../schemas";

export default async function getStockDataAsync(
  symbol: string,
  _: FastifyInstance
): Promise<StockDocument | null> {
  const yahooFinance = new YahooFinance();
  const quoteSummary = await yahooFinance.quoteSummary(symbol);
  const fundProfile = (await yahooFinance.quote(symbol)) as {
    netExpenseRatio?: number;
  };
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const historical = await yahooFinance.historical(symbol, {
    period1: oneYearAgo,
    period2: new Date(),
    events: "dividends",
  });

  const price = quoteSummary.price?.regularMarketPrice;
  const netExpenseRatio = fundProfile.netExpenseRatio;
  const dividends = historical.map((payment) => ({
    amount: payment.dividends.toString(),
    ex_dividend_date: payment.date.toISOString().slice(0, 10),
  }));

  return {
    price: (price ?? 0).toString(),
    profile: {
      net_expense_ratio: ((netExpenseRatio ?? 0) / 100.0).toString(),
    },
    dividends,
  };
}
