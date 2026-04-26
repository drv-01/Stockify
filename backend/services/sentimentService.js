import { DefaultApi } from 'finnhub';
import vader from 'vader-sentiment';
import dotenv from 'dotenv';

dotenv.config();

const finnhubClient = new DefaultApi(process.env.FINNHUB_API_KEY);

export class SentimentService {
    async getNewsSentiment(query) {
        return new Promise((resolve, reject) => {
            const ticker = query.replace('.NS', '');
            
            // Get news for the last 7 days
            const to = new Date().toISOString().split('T')[0];
            const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            finnhubClient.companyNews(ticker, from, to, (error, data, response) => {
                if (error) {
                    console.error(`Finnhub news error for ${ticker}:`, error);
                    resolve({ overall: "Neutral", score: 0, news: [] });
                    return;
                }

                const newsItems = [];
                let totalScore = 0;
                
                // Take top 10 news items
                const limitedItems = data && data.length ? data.slice(0, 10) : [];
                
                for (const item of limitedItems) {
                    const title = item.headline;
                    const summary = item.summary;
                    const link = item.url;
                    const pubDate = new Date(item.datetime * 1000).toISOString();
                    
                    // Analyze sentiment of both headline and summary
                    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(`${title}. ${summary}`);
                    const compound = intensity.compound;
                    
                    let sentimentLabel = "Neutral";
                    if (compound >= 0.05) sentimentLabel = "Bullish";
                    else if (compound <= -0.05) sentimentLabel = "Bearish";
                    
                    newsItems.push({
                        title,
                        summary,
                        link,
                        date: pubDate,
                        sentiment: sentimentLabel,
                        score: compound,
                        source: item.source,
                        thumbnail: item.image // Map image to thumbnail for frontend compatibility
                    });
                    totalScore += compound;
                }
                
                const avgScore = newsItems.length > 0 ? totalScore / newsItems.length : 0;
                const overallSentiment = avgScore >= 0.05 ? "Bullish" : (avgScore <= -0.05 ? "Bearish" : "Neutral");
                
                resolve({
                    overall: overallSentiment,
                    score: avgScore,
                    news: newsItems
                });
            });
        });
    }
}
