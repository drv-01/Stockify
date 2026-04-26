import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export class AiService {
    static async generateAnalysis(ticker, stockData, sentimentData, forecastData) {
        try {
            if (!process.env.GROQ_API_KEY) {
                return "Groq API key not configured. Please add it to your .env file.";
            }

            const recent = stockData.slice(-5);
            const currentPrice = recent[recent.length - 1]?.Close;
            const weekAgoPrice = recent[0]?.Close;
            const weekChange = weekAgoPrice ? (((currentPrice - weekAgoPrice) / weekAgoPrice) * 100).toFixed(2) : 'N/A';
            const forecast = forecastData.forecast || [];
            const forecastEnd = forecast[forecast.length - 1];
            const forecastChange = forecastEnd
                ? (((forecastEnd.predicted - currentPrice) / currentPrice) * 100).toFixed(2)
                : 'N/A';

            const prompt = `You are a senior equity analyst covering Indian stock markets.

Stock: ${ticker} (NSE)
Current Price: ₹${currentPrice?.toFixed(2)}
5-Day Price Change: ${weekChange}%
Recent Closes: ${recent.map(d => `₹${d.Close?.toFixed(2)}`).join(', ')}

AI Forecast (next 5 trading days):
- Trend: ${forecastData.trend}
- Confidence: ${forecastData.confidence}%
- Projected end price: ₹${forecastEnd?.predicted?.toFixed(2)} (${forecastChange}% from current)
- 95% Range: ₹${forecastEnd?.lower_bound?.toFixed(2)} – ₹${forecastEnd?.upper_bound?.toFixed(2)}

Market Sentiment: ${sentimentData.overall} (score: ${sentimentData.score?.toFixed(3)})
Recent Headlines: ${sentimentData.news.slice(0, 3).map(n => n.title).join(' | ') || 'No recent news'}

Provide a concise professional analysis with:
• Key Insight – what the price action and forecast signal
• Risk – key downside risks to watch
• Outlook – short-term view with reasoning

Max 180 words. Use bullet points. Be specific to ${ticker}, not generic.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are a concise financial analyst. Respond only with the analysis, no preamble.' },
                    { role: 'user', content: prompt },
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.4,
                max_tokens: 300,
            });

            return chatCompletion.choices[0]?.message?.content || 'No analysis generated.';
        } catch (error) {
            console.error('Groq Analysis Error:', error);
            return `AI analysis unavailable. Forecast shows ${forecastData?.trend || 'Sideways'} trend with ${forecastData?.confidence || 75}% confidence.`;
        }
    }

    static async chat(systemPrompt, messages) {
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages,
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.5,
                max_tokens: 400,
            });
            return chatCompletion.choices[0]?.message?.content || 'No response generated.';
        } catch (error) {
            console.error('Groq Chat Error:', error);
            throw error;
        }
    }
}
