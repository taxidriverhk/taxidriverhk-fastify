import type { FastifyInstance } from "fastify";
import type { StockDocument, OptionData } from "../schemas";

import getStockDataFromAlphaVantageAsync from "./alpha-vantage";
import {
  getStockDataAsync as getStockDataFromYahooFinanceAsync,
  getOptionDataAsync as getOptionDataFromYahooFinanceAsync,
} from "./yahoo-finance";

enum ExternalDataProviders {
  ALPHA_VANTAGE,
  YAHOO_FINANCE,
}

const SELECTED_PROVIDER: ExternalDataProviders =
  ExternalDataProviders.YAHOO_FINANCE;

export async function getStockDataAsync(
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

export async function getOptionDataAsync(
  optionTicker: string,
  server: FastifyInstance
): Promise<OptionData | null> {
  let data: OptionData | null = null;
  switch (SELECTED_PROVIDER) {
    case ExternalDataProviders.ALPHA_VANTAGE:
      // Not implemented for Alpha Vantage
      break;
    case ExternalDataProviders.YAHOO_FINANCE:
      data = await getOptionDataFromYahooFinanceAsync(optionTicker, server);
      break;
  }
  return data;
}
