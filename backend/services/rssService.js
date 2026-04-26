import Parser from 'rss-parser';
import vader from 'vader-sentiment';

const parser = new Parser({
    timeout: 10000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Stockify/1.0)' },
    customFields: { item: ['media:content', 'enclosure', 'media:thumbnail'] }
});

const FEEDS = [
    {
        name: 'Economic Times',
        url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
        source: 'ET Markets'
    },
    {
        name: 'MoneyControl',
        url: 'https://www.moneycontrol.com/rss/marketreports.xml',
        source: 'MoneyControl'
    }
];

export class RSSService {
    static async fetchAllFeeds(limit = 20) {
        const allItems = [];

        await Promise.all(FEEDS.map(async (feed) => {
            try {
                const parsed = await parser.parseURL(feed.url);
                for (const item of (parsed.items || []).slice(0, limit / FEEDS.length + 5)) {
                    const text = `${item.title || ''} ${item.contentSnippet || item.content || ''}`;
                    const scores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
                    const compound = scores.compound;
                    const sentiment = compound >= 0.05 ? 'Bullish' : compound <= -0.05 ? 'Bearish' : 'Neutral';

                    // Try to extract thumbnail from various RSS fields
                    const thumbnail =
                        item['media:content']?.$.url ||
                        item['media:thumbnail']?.$.url ||
                        item.enclosure?.url ||
                        null;

                    allItems.push({
                        title: item.title || '',
                        summary: item.contentSnippet || item.content?.replace(/<[^>]+>/g, '') || '',
                        link: item.link || '',
                        date: item.pubDate || item.isoDate || new Date().toISOString(),
                        source: feed.source,
                        sentiment,
                        score: compound,
                        thumbnail,
                    });
                }
            } catch (err) {
                console.error(`RSS fetch failed for ${feed.name}:`, err.message);
            }
        }));

        // Sort by date descending, return top `limit`
        return allItems
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }

    static async fetchForTicker(ticker) {
        const keyword = ticker.replace('.NS', '').toLowerCase();
        const all = await this.fetchAllFeeds(50);
        const relevant = all.filter(item =>
            item.title.toLowerCase().includes(keyword) ||
            item.summary.toLowerCase().includes(keyword)
        );
        // Return relevant ones first, then fill with general market news
        const general = all.filter(item =>
            !item.title.toLowerCase().includes(keyword)
        );
        return [...relevant, ...general].slice(0, 15);
    }
}
