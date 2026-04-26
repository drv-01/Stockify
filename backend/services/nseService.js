import axios from 'axios';

const NSE_BASE = 'https://www.nseindia.com/api';

const nseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nseindia.com/',
};

// NSE requires a session cookie — we fetch the homepage first to get it
async function getNSESession() {
    const session = axios.create({ baseURL: NSE_BASE, headers: nseHeaders, withCredentials: true });
    await session.get('https://www.nseindia.com', { headers: nseHeaders });
    return session;
}

export class NSEService {
    static async getNifty50() {
        try {
            const session = await getNSESession();
            const { data } = await session.get('/equity-stockIndices?index=NIFTY%2050');
            return data.data.map(stock => ({
                symbol: stock.symbol,
                price: stock.lastPrice,
                change: stock.change,
                change_pct: stock.pChange,
                open: stock.open,
                high: stock.dayHigh,
                low: stock.dayLow,
                prev_close: stock.previousClose,
                volume: stock.totalTradedVolume,
                sector: stock.industry || 'N/A',
            }));
        } catch (err) {
            console.error('NSE Nifty50 error:', err.message);
            return null;
        }
    }

    static async getMarketStatus() {
        try {
            const session = await getNSESession();
            const { data } = await session.get('/marketStatus');
            return data.marketState?.[0] || null;
        } catch (err) {
            console.error('NSE market status error:', err.message);
            return null;
        }
    }

    static async getSectorData() {
        try {
            const session = await getNSESession();
            const indices = ['NIFTY%20BANK', 'NIFTY%20IT', 'NIFTY%20PHARMA', 'NIFTY%20AUTO', 'NIFTY%20FMCG'];
            const results = await Promise.all(
                indices.map(idx => session.get(`/equity-stockIndices?index=${idx}`).catch(() => null))
            );
            return results
                .filter(r => r !== null)
                .map(r => ({
                    name: r.data.metadata?.indexName,
                    last: r.data.metadata?.last,
                    change_pct: r.data.metadata?.percChange,
                }));
        } catch (err) {
            console.error('NSE sector error:', err.message);
            return null;
        }
    }
}
