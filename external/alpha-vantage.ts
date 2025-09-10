import type { FastifyInstance } from "fastify";

const ENDPOINT = "https://www.alphavantage.co/query";

export default async function getStockDataAsync(
  symbol: string,
  apiKey: string,
  server: FastifyInstance
): Promise<string | null> {
  try {
    const [dividendResponse, etfProfileResponse] = await Promise.all([
      fetch(`${ENDPOINT}?function=DIVIDENDS&symbol=${symbol}&apikey=${apiKey}`),
      fetch(
        `${ENDPOINT}?function=ETF_PROFILE&symbol=${symbol}&apikey=${apiKey}`
      ),
    ]);
    const [dividendData, etfProfileData] = await Promise.all([
      dividendResponse.json(),
      etfProfileResponse.json(),
    ]);

    if (
      dividendResponse.ok &&
      etfProfileResponse.ok &&
      dividendData.data &&
      etfProfileData
    ) {
      return JSON.stringify({
        profile: etfProfileData,
        dividends: dividendData.data,
      });
    }
  } catch (error) {
    server.log.error("Error fetching stock data:", error);
  }
  return null;
}
