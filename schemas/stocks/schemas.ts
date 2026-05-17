// Data models
export type StockDocument = {
  price: string;
  profile: {
    net_expense_ratio: string;
  };
  dividends: Array<{
    amount: string;
    ex_dividend_date: string;
  }>;
};

export type OptionData = {
  expirationDate: string;
  lastPrice: string;
  strikePrice: string;
  type: string;
};

// API models
export type GetStockDataResponse = StockDocument | string;
