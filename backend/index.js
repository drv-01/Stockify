import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { StockService } from './services/stockService.js';
import { SentimentService } from './services/sentimentService.js';
import { ForecastService } from './services/forecastService.js';
import { AiService } from './services/aiService.js';
import { NSEService } from './services/nseService.js';
import { AlphaVantageService } from './services/alphaVantageService.js';
import { RSSService } from './services/rssService.js';
import { GlobalMarketsService } from './services/globalMarketsService.js';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
let isConnected = false;
const connectDB = async () => {
    if (isConnected) {
        console.log('=> Using existing database connection');
        return;
    }

    try {
        const db = await mongoose.connect(process.env.MONGO_URI);
        isConnected = db.connections[0].readyState;
        console.log('=> New database connection established');
    } catch (error) {
        console.error('Error connecting to database:', error.message);
        throw error;
    }
};

// Middleware to ensure DB is connected
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(500).json({ error: "Database connection failed" });
    }
});

// Routes
app.use('/api/auth', authRoutes);

const sentimentService = new SentimentService();

app.get('/', (req, res) => {
    res.json({ message: "Welcome to Stockify AI API", status: "operational" });
});

// ── Original routes ──────────────────────────────────────────────────────────

app.get('/api/stocks/overview', async (req, res) => {
    try {
        const overview = await StockService.getNifty50Overview();
        res.json(overview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/stocks/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const { period = "1mo" } = req.query;
        const data = await StockService.getStockData(ticker, period);
        if (!data) return res.status(404).json({ error: "Stock data not found" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/analysis/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const { period = "3mo" } = req.query;

        const [histData, realTime] = await Promise.all([
            StockService.getStockData(ticker, period),
            StockService.getRealTimeQuote(ticker)
        ]);

        if (!histData) return res.status(404).json({ error: "Stock data not found" });

        const forecast = await ForecastService.generateForecast(histData);
        const sentiment = await sentimentService.getNewsSentiment(ticker);
        const aiInsights = await AiService.generateAnalysis(ticker, histData, sentiment, forecast);

        res.json({
            ticker,
            current: realTime,
            historical: histData.slice(-30),
            forecast,
            sentiment,
            aiInsights,
            summary: {
                risk_level: sentiment.overall === "Neutral" ? "Medium" : (sentiment.overall === "Bullish" ? "Low" : "High"),
                recommendation: sentiment.overall === "Neutral" ? "Hold" : (sentiment.overall === "Bullish" ? "Accumulate" : "Caution"),
            },
        });
    } catch (error) {
        console.error("Analysis route error:", error);
        res.status(500).json({ error: error.message });
    }
});

// ── NEW: NSE routes ───────────────────────────────────────────────────────────

// Full NIFTY 50 live data
app.get('/api/nifty50', async (req, res) => {
    try {
        const data = await NSEService.getNifty50();
        if (!data) return res.status(503).json({ error: "NSE data unavailable" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Real market open/close status from NSE
app.get('/api/market-status', async (req, res) => {
    try {
        const status = await NSEService.getMarketStatus();
        res.json(status || { marketStatus: 'Unknown' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sector indices (Bank, IT, Pharma, Auto, FMCG)
app.get('/api/sectors', async (req, res) => {
    try {
        const data = await NSEService.getSectorData();
        if (!data) return res.status(503).json({ error: "Sector data unavailable" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── NEW: Alpha Vantage routes ─────────────────────────────────────────────────

// RSI + MACD + Bollinger Bands
app.get('/api/indicators/:ticker', async (req, res) => {
    try {
        const data = await AlphaVantageService.getIndicators(req.params.ticker);
        if (!data) return res.status(503).json({ error: "Indicator data unavailable (rate limit?)" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Company fundamentals (P/E, EPS, market cap, 52w high/low, beta)
app.get('/api/fundamentals/:ticker', async (req, res) => {
    try {
        const data = await AlphaVantageService.getFundamentals(req.params.ticker);
        if (!data) return res.status(503).json({ error: "Fundamentals unavailable (rate limit?)" });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ticker search / autocomplete
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const results = await AlphaVantageService.searchTicker(q);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── NEW: RSS News Feed ───────────────────────────────────────────────────────

// General market news from ET + MoneyControl
app.get('/api/news/rss', async (req, res) => {
    try {
        const news = await RSSService.fetchAllFeeds(20);
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ticker-specific news from RSS
app.get('/api/news/rss/:ticker', async (req, res) => {
    try {
        const news = await RSSService.fetchForTicker(req.params.ticker);
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── NEW: Global Indices via Yahoo Finance ─────────────────────────────────────

app.get('/api/global-indices', async (req, res) => {
    try {
        const tickers = [
            { symbol: '^GSPC', name: 'S&P 500' },
            { symbol: '^IXIC', name: 'NASDAQ' },
            { symbol: '^FTSE', name: 'FTSE 100' },
            { symbol: '^N225', name: 'Nikkei 225' },
            { symbol: '^HSI', name: 'Hang Seng' },
            { symbol: '^NSEI', name: 'NIFTY 50' },
        ];
        const results = await Promise.all(
            tickers.map(async ({ symbol, name }) => {
                try {
                    const quote = await StockService.getRealTimeQuote(symbol);
                    return quote ? { symbol, name, ...quote } : null;
                } catch { return null; }
            })
        );
        res.json(results.filter(Boolean));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── NEW: Fear & Greed Index (Alternative.me — no key needed) ──────────────────

app.get('/api/fear-greed', async (req, res) => {
    try {
        const { data } = await axios.get('https://api.alternative.me/fng/?limit=7');
        res.json(data.data.map(d => ({
            value: parseInt(d.value),
            label: d.value_classification,
            timestamp: new Date(d.timestamp * 1000).toISOString().split('T')[0],
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ── Chat endpoint ────────────────────────────────────────────────────────────
app.post('/api/chat/:ticker', async (req, res) => {
    try {
        const { ticker } = req.params;
        const { messages, context } = req.body; // messages: [{role, content}], context: stock snapshot

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array required' });
        }

        const systemPrompt = `You are an expert equity analyst and financial advisor specializing in Indian stock markets (NSE/BSE).

You are currently analyzing: ${ticker} (NSE)
${context ? `
Live Stock Context:
- Current Price: ₹${context.currentPrice}
- 5-Day Change: ${context.weekChange}%
- AI Forecast Trend: ${context.trend} (${context.confidence}% confidence)
- Projected 5-day move: ${context.forecastChange}%
- Forecast range: ₹${context.forecastLow} – ₹${context.forecastHigh}
- Market Sentiment: ${context.sentiment}
- Recent closes: ${context.recentCloses}` : ''}

Answer questions about this stock concisely and accurately. Use ₹ for prices. If asked about something unrelated to finance or this stock, politely redirect. Never give definitive buy/sell advice — always note that investments carry risk.`;

        const { AiService } = await import('./services/aiService.js');
        const reply = await AiService.chat(systemPrompt, messages);
        res.json({ reply });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Global Market Selection ───────────────────────────────────────────────────

// Returns all countries that have a stock exchange
app.get('/api/countries-with-markets', async (req, res) => {
    try {
        const countries = await GlobalMarketsService.getCountries();
        res.json(countries);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Returns markets/indexes for a given country code
// GET /api/markets?country=IN
app.get('/api/markets', (req, res) => {
    try {
        const { country } = req.query;
        if (!country) return res.status(400).json({ error: 'country query param required' });
        const markets = GlobalMarketsService.getMarketsForCountry(country);
        if (!markets) return res.status(404).json({ error: `No markets found for country: ${country}` });
        res.json({ country, markets });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Returns live stock data for all constituents of a given market
// GET /api/stocks-by-market?market=NIFTY50
app.get('/api/stocks-by-market', async (req, res) => {
    try {
        const { market } = req.query;
        if (!market) return res.status(400).json({ error: 'market query param required' });

        const info = GlobalMarketsService.getStocksForMarket(market);
        if (!info) return res.status(404).json({ error: `No data found for market: ${market}` });

        const { market: marketMeta, stocks } = info;
        const suffix = marketMeta.suffix;

        // Fetch live quotes concurrently (up to 30 stocks)
        const quotes = await Promise.all(
            stocks.slice(0, 30).map(async (ticker) => {
                try {
                    const yahooTicker = suffix && !ticker.includes(suffix)
                        ? `${ticker}${suffix}`
                        : ticker;
                    const q = await StockService.getRealTimeQuote(yahooTicker);
                    if (!q) return null;
                    return {
                        symbol: ticker,
                        yahooSymbol: yahooTicker,
                        price: q.price,
                        change: q.change,
                        change_pct: q.change_pct,
                        high: q.high,
                        low: q.low,
                        open: q.open,
                        prev_close: q.prev_close,
                    };
                } catch { return null; }
            })
        );

        res.json({
            market: marketMeta,
            stocks: quotes.filter(Boolean),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Stockify AI Backend running on http://localhost:${PORT}`);
});
