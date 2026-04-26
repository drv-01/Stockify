import axios from 'axios';
import dotenv from 'dotenv';
import YahooFinance from 'yahoo-finance2';
dotenv.config();

const yf = new YahooFinance();

const AV_BASE = 'https://www.alphavantage.co/query';
const KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function avGet(params) {
    const { data } = await axios.get(AV_BASE, { params: { ...params, apikey: KEY } });
    return data;
}

// ── Pure math helpers ─────────────────────────────────────────────────────────

function calcRSI(closes, period = 14) {
    const results = [];
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) avgGain += diff; else avgLoss += Math.abs(diff);
    }
    avgGain /= period;
    avgLoss /= period;
    for (let i = period; i < closes.length; i++) {
        if (i > period) {
            const diff = closes[i] - closes[i - 1];
            const gain = diff >= 0 ? diff : 0;
            const loss = diff < 0 ? Math.abs(diff) : 0;
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
        }
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        results.push(parseFloat((100 - 100 / (1 + rs)).toFixed(2)));
    }
    return results;
}

function ema(values, period) {
    const k = 2 / (period + 1);
    const result = [];
    let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(prev);
    for (let i = period; i < values.length; i++) {
        prev = values[i] * k + prev * (1 - k);
        result.push(prev);
    }
    return result;
}

function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
    const emaFast = ema(closes, fast);
    const emaSlow = ema(closes, slow);
    const offset = slow - fast;
    const macdLine = emaSlow.map((v, i) => emaFast[i + offset] - v);
    const signalLine = ema(macdLine, signal);
    const sigOffset = macdLine.length - signalLine.length;
    return macdLine.slice(sigOffset).map((m, i) => ({
        macd: parseFloat(m.toFixed(4)),
        signal: parseFloat(signalLine[i].toFixed(4)),
        hist: parseFloat((m - signalLine[i]).toFixed(4)),
    }));
}

function calcBBands(closes, period = 20, stdMult = 2) {
    const results = [];
    for (let i = period - 1; i < closes.length; i++) {
        const slice = closes.slice(i - period + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
        const std = Math.sqrt(variance);
        results.push({
            upper: parseFloat((mean + stdMult * std).toFixed(2)),
            middle: parseFloat(mean.toFixed(2)),
            lower: parseFloat((mean - stdMult * std).toFixed(2)),
        });
    }
    return results;
}

export class AlphaVantageService {
    static async getIndicators(ticker) {
        try {
            const symbol = ticker.includes('.NS') ? ticker : `${ticker}.NS`;
            const now = new Date();
            const from = new Date(now);
            from.setMonth(from.getMonth() - 6);

            const result = await yf.chart(symbol, {
                period1: from,
                period2: now,
                interval: '1d',
            });

            if (!result?.quotes?.length) return null;

            const quotes = result.quotes.filter(q => q.close != null);
            const closes = quotes.map(q => q.close);
            const dates = quotes.map(q => new Date(q.date).toISOString().split('T')[0]);

            // RSI(14) — needs 15+ rows
            const rsiPeriod = 14;
            const rsiValues = calcRSI(closes, rsiPeriod);
            const rsiOffset = closes.length - rsiValues.length;
            const rsi = rsiValues.slice(-30).map((v, i) => ({
                date: dates[rsiOffset + rsiValues.length - 30 + i] || dates[rsiOffset + i],
                rsi: v,
            }));

            // MACD(12,26,9) — needs 35+ rows
            const macdRaw = calcMACD(closes);
            const macdDates = dates.slice(dates.length - macdRaw.length);
            const macd = macdRaw.slice(-30).map((v, i) => ({
                date: macdDates[macdRaw.length - 30 + i] || macdDates[i],
                ...v,
            }));

            // BBands(20,2) — needs 20+ rows
            const bbRaw = calcBBands(closes);
            const bbDates = dates.slice(dates.length - bbRaw.length);
            const bbands = bbRaw.slice(-30).map((v, i) => ({
                date: bbDates[bbRaw.length - 30 + i] || bbDates[i],
                ...v,
            }));

            // Signals
            const latestRSI = rsi[rsi.length - 1]?.rsi;
            let rsiSignal = 'Neutral';
            if (latestRSI > 70) rsiSignal = 'Overbought';
            else if (latestRSI < 30) rsiSignal = 'Oversold';

            const latestMACD = macd[macd.length - 1];
            const prevMACD = macd[macd.length - 2];
            let macdSignal = latestMACD?.macd > latestMACD?.signal ? 'Bullish Crossover' : 'Bearish Crossover';
            // Detect fresh crossover
            if (prevMACD && latestMACD) {
                const crossedUp = prevMACD.macd <= prevMACD.signal && latestMACD.macd > latestMACD.signal;
                const crossedDown = prevMACD.macd >= prevMACD.signal && latestMACD.macd < latestMACD.signal;
                if (crossedUp) macdSignal = 'Bullish Crossover';
                else if (crossedDown) macdSignal = 'Bearish Crossover';
            }

            const latestBB = bbands[bbands.length - 1];
            const latestClose = closes[closes.length - 1];
            let bbSignal = 'Inside Band';
            if (latestClose >= latestBB?.upper) bbSignal = 'Above Upper';
            else if (latestClose <= latestBB?.lower) bbSignal = 'Below Lower';

            return {
                rsi,
                macd,
                bbands,
                signals: {
                    rsi: rsiSignal,
                    rsiValue: latestRSI,
                    macd: macdSignal,
                    bb: bbSignal,
                    bbUpper: latestBB?.upper,
                    bbLower: latestBB?.lower,
                    bbMiddle: latestBB?.middle,
                    currentPrice: latestClose,
                },
            };
        } catch (err) {
            console.error('Indicators error:', err.message);
            return null;
        }
    }

    static async getFundamentals(ticker) {
        const symbolBSE = ticker.replace('.NS', '') + '.BSE';
        const symbolNS = ticker.includes('.NS') ? ticker : `${ticker}.NS`;
        let avData = {};
        
        try {
            const data = await avGet({ function: 'OVERVIEW', symbol: symbolBSE });
            if (data && !data['Note'] && !data['Information']) {
                avData = data;
            }
        } catch (e) {
            console.error('AV fetch error:', e.message);
        }

        try {
            const yfData = await yf.quoteSummary(symbolNS, { modules: ['financialData', 'defaultKeyStatistics'] });
            const fd = yfData.financialData || {};
            const ks = yfData.defaultKeyStatistics || {};

            return {
                name: avData.Name || symbolNS,
                sector: avData.Sector || 'N/A',
                industry: avData.Industry || 'N/A',
                marketCap: avData.MarketCapitalization || ks.enterpriseValue,
                pe: avData.PERatio || ks.forwardPE,
                eps: ks.trailingEps || avData.EPS,
                dividendYield: avData.DividendYield,
                week52High: avData['52WeekHigh'],
                week52Low: avData['52WeekLow'],
                beta: avData.Beta || ks.beta,
                profitMargin: avData.ProfitMargin || fd.profitMargins,
                description: avData.Description || '',
                revenue: fd.totalRevenue || avData.RevenueTTM,
                profit: ks.netIncomeToCommon || avData.GrossProfitTTM,
                debt: fd.totalDebt,
                roe: fd.returnOnEquity,
            };
        } catch (err) {
            console.error('YF fundamentals error:', err.message);
            return {
                name: avData.Name,
                sector: avData.Sector,
                industry: avData.Industry,
                marketCap: avData.MarketCapitalization,
                pe: avData.PERatio,
                eps: avData.EPS,
                dividendYield: avData.DividendYield,
                week52High: avData['52WeekHigh'],
                week52Low: avData['52WeekLow'],
                beta: avData.Beta,
                profitMargin: avData.ProfitMargin,
                description: avData.Description,
                revenue: avData.RevenueTTM,
                profit: avData.GrossProfitTTM,
                debt: null,
                roe: null,
            };
        }
    }

    static async searchTicker(query) {
        try {
            const data = await avGet({ function: 'SYMBOL_SEARCH', keywords: query });
            return (data.bestMatches || []).slice(0, 8).map(m => ({
                symbol: m['1. symbol'],
                name: m['2. name'],
                type: m['3. type'],
                region: m['4. region'],
            }));
        } catch (err) {
            console.error('AV search error:', err.message);
            return [];
        }
    }
}
