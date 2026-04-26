import YahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';

dotenv.config();

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export class StockService {
    static async getStockData(ticker, period = '1mo', interval = '1d') {
        try {
            const symbol = ticker.includes('.NS') ? ticker : `${ticker}.NS`;
            const result = await yahooFinance.chart(symbol, {
                period1: this._getStartDate(period),
                period2: new Date(),
                interval: interval
            });

            if (!result || !result.quotes) return null;

            return result.quotes.map(quote => ({
                Date: new Date(quote.date).toISOString().split('T')[0],
                Open: quote.open,
                High: quote.high,
                Low: quote.low,
                Close: quote.close,
                Volume: quote.volume
            })).filter(q => q.Close !== null);
        } catch (error) {
            console.error(`Error fetching data for ${ticker}:`, error);
            return null;
        }
    }

    static async getRealTimeQuote(ticker) {
        try {
            const symbol = ticker.includes('.NS') || ticker.startsWith('^') ? ticker : `${ticker}.NS`;
            const q = await yahooFinance.quote(symbol);
            return {
                price: q.regularMarketPrice,
                change: q.regularMarketChange,
                change_pct: q.regularMarketChangePercent,
                high: q.regularMarketDayHigh,
                low: q.regularMarketDayLow,
                open: q.regularMarketOpen,
                prev_close: q.regularMarketPreviousClose,
            };
        } catch (error) {
            console.error(`Yahoo quote error for ${ticker}:`, error.message);
            return null;
        }
    }

    static async getNifty50Overview() {
        const tickers = ['RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY'];
        const results = await Promise.all(tickers.map(async (ticker) => {
            const quote = await this.getRealTimeQuote(ticker);
            if (quote) {
                return {
                    symbol: ticker,
                    price: quote.price,
                    change: quote.change,
                    change_pct: quote.change_pct,
                    sector: 'Market Leader'
                };
            }
            return null;
        }));
        return results.filter(r => r !== null);
    }

    static _getStartDate(period) {
        const now = new Date();
        switch (period) {
            case '1mo': now.setMonth(now.getMonth() - 1); break;
            case '3mo': now.setMonth(now.getMonth() - 3); break;
            case '6mo': now.setMonth(now.getMonth() - 6); break;
            case '1y': now.setFullYear(now.getFullYear() - 1); break;
            default: now.setMonth(now.getMonth() - 1);
        }
        return now;
    }
}
