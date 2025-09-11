import type { FastifyInstance } from "fastify";
import type { StockDocument } from "../schemas";

import getStockDataFromAlphaVantageAsync from "./alpha-vantage";
import getStockDataFromYahooFinanceAsync from "./yahoo-finance";

enum ExternalDataProviders {
  ALPHA_VANTAGE,
  YAHOO_FINANCE,
}

const SELECTED_PROVIDER: ExternalDataProviders =
  ExternalDataProviders.YAHOO_FINANCE;

export default async function getStockDataAsync(
  symbol: string,
  apiKey: string,
  server: FastifyInstance
): Promise<StockDocument | null> {
  let data: StockDocument | null;
  switch (SELECTED_PROVIDER) {
    case ExternalDataProviders.ALPHA_VANTAGE:
      data = await getStockDataFromAlphaVantageAsync(symbol, apiKey, server);
    case ExternalDataProviders.YAHOO_FINANCE:
      data = await getStockDataFromYahooFinanceAsync(symbol, server);
  }
  return data;
}
