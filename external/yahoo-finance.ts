import YahooFinance from "yahoo-finance2";
import type { FastifyInstance } from "fastify";
import type { StockDocument, OptionData } from "../schemas";

export async function getStockDataAsync(
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

export async function getOptionDataAsync(
  optionTicker: string,
  _: FastifyInstance
): Promise<OptionData | null> {
  const yahooFinance = new YahooFinance();
  const match = optionTicker.match(/^([A-Za-z]+)(\d{6})/);
  if (!match) {
    return null;
  }
  const symbol = match[1];
  const dateStr = match[2];
  const year = parseInt("20" + dateStr.substring(0, 2));
  const month = parseInt(dateStr.substring(2, 4)) - 1;
  const day = parseInt(dateStr.substring(4, 6));
  const expirationDate = new Date(Date.UTC(year, month, day));

  const options = await yahooFinance.options(symbol, { date: expirationDate });
  if (options.options.length === 0) {
    return null;
  }

  const flattenOptions = [
    ...options.options.flatMap((o) => o.calls),
    ...options.options.flatMap((o) => o.puts),
  ];
  const option = flattenOptions.find((o) => o.contractSymbol === optionTicker);
  if (option == null) {
    return null;
  }

  return {
    expirationDate: option.expiration.toISOString().slice(0, 10),
    lastPrice: option.lastPrice.toString(),
    strikePrice: option.strike.toString(),
    type: option.contractSymbol.includes("C") ? "call" : "put",
  };
}
