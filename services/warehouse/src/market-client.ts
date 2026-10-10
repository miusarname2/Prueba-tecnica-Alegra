import https from 'https';
import http from 'http';

const MARKET_API_URL = process.env.MARKET_API_URL || 'https://recruitment.alegra.com/api/farmers-market/buy';

interface MarketResponse {
  quantitySold: number;
}

export async function buyFromMarket(ingredientNameEn: string, maxRetries = 5): Promise<number> {
  let totalBought = 0;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);

    try {
      const result = await fetchFromMarket(ingredientNameEn);

      if (result.quantitySold > 0) {
        totalBought += result.quantitySold;
        console.log(`[market] Bought ${result.quantitySold}x ${ingredientNameEn} (attempt ${attempt})`);
        return totalBought;
      }

      console.log(`[market] ${ingredientNameEn} unavailable (attempt ${attempt}/${maxRetries})`);
      if (attempt < maxRetries) await sleep(delay);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[market] Error buying ${ingredientNameEn} (attempt ${attempt}): ${msg}`);
      if (attempt < maxRetries) await sleep(delay);
    }
  }

  return totalBought;
}

function fetchFromMarket(ingredient: string): Promise<MarketResponse> {
  const url = `${MARKET_API_URL}?ingredient=${encodeURIComponent(ingredient)}`;

  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as MarketResponse);
        } catch {
          reject(new Error(`Invalid JSON from market: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Market request timeout')));
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
