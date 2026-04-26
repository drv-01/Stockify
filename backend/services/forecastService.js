import ARIMA from 'arima';

export class ForecastService {
    // Advance date skipping weekends
    static _nextTradingDay(date) {
        const d = new Date(date);
        d.setDate(d.getDate() + 1);
        while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
        return d;
    }

    static async generateForecast(data, steps = 5) {
        try {
            if (!data || data.length < 20) {
                return { error: "Insufficient data for forecasting" };
            }

            const prices = data.map(d => d.Close);
            const currentPrice = prices[prices.length - 1];

            // Compute historical volatility (std dev of daily returns)
            const returns = [];
            for (let i = 1; i < prices.length; i++) {
                returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
            }
            const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / returns.length;
            const dailyVolatility = Math.sqrt(variance); // as fraction of price

            // ARIMA(5,1,0)
            const arima = new ARIMA({ p: 5, d: 1, q: 0, verbose: false }).train(prices);
            const [forecastValues] = arima.predict(steps);

            // Build forecast items with volatility-scaled confidence bands
            // Use sqrt(i) scaling so bands widen realistically over time
            const forecastItems = [];
            let date = new Date(data[data.length - 1].Date);

            for (let i = 0; i < steps; i++) {
                date = this._nextTradingDay(date);
                const predicted = forecastValues[i];
                // 95% band: ±1.96 * dailyVol * price * sqrt(i+1)
                const band = 1.96 * dailyVolatility * currentPrice * Math.sqrt(i + 1);
                const lower_bound = Math.max(predicted - band, predicted * 0.85); // floor at -15%
                const upper_bound = Math.min(predicted + band, predicted * 1.15); // cap at +15%

                forecastItems.push({
                    date: date.toISOString().split('T')[0],
                    predicted,
                    lower_bound,
                    upper_bound,
                });
            }

            // Trend: compare forecast end vs current, scaled by volatility
            const futurePrice = forecastValues[steps - 1];
            const changePct = ((futurePrice - currentPrice) / currentPrice) * 100;
            const volThreshold = dailyVolatility * 100 * Math.sqrt(steps); // vol-adjusted threshold

            let trend = 'Sideways';
            if (changePct > volThreshold) trend = 'Uptrend';
            else if (changePct < -volThreshold) trend = 'Downtrend';

            // Confidence: higher when volatility is low and ARIMA fit is stable
            const forecastSpread = (forecastItems[steps - 1].upper_bound - forecastItems[steps - 1].lower_bound) / currentPrice;
            const confidence = Math.round(Math.max(40, Math.min(92, 90 - forecastSpread * 200)));

            return {
                trend,
                confidence,
                change_pct: Math.round(changePct * 100) / 100,
                forecast: forecastItems,
            };
        } catch (error) {
            console.error('Forecasting error:', error);
            return { error: error.message };
        }
    }
}
