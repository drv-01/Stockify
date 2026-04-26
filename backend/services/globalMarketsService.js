import axios from 'axios';

/**
 * Global Markets Service
 * Provides country → market → stock mappings for the global market selector.
 * Markets use Yahoo Finance compatible symbols for real data fetching.
 */

// ── Market-to-Country Mapping ────────────────────────────────────────────────
// This maps ISO codes to Yahoo Finance symbols and constituent stocks.
export const MARKET_DATA_MAP = {
  IN: {
    markets: [
      { 
        name: 'NIFTY 50', symbol: 'NIFTY50', indexSymbol: '^NSEI', tvSymbol: 'NSE:NIFTY', exchange: 'NSE', suffix: '.NS', 
        stocks: ['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','KOTAKBANK','LT','HINDUNILVR','SBIN','BAJFINANCE','BHARTIARTL','ASIANPAINT','ITC','HCLTECH','MARUTI','AXISBANK','NESTLEIND','WIPRO','ULTRACEMCO','TITAN','SUNPHARMA','M&M','TECHM','POWERGRID','NTPC','ONGC','DIVISLAB','CIPLA','JSWSTEEL','COALINDIA'] 
      },
      { 
        name: 'SENSEX (BSE 30)', symbol: 'BSE30', indexSymbol: '^BSESN', tvSymbol: 'BSE:SENSEX', exchange: 'BSE', suffix: '.BO', 
        stocks: ['RELIANCE','TCS','HDFCBANK','ICICIBANK','INFY','KOTAKBANK','LT','HINDUNILVR','SBIN','BAJFINANCE','BHARTIARTL','ASIANPAINT','ITC','HCLTECH','MARUTI','AXISBANK','NESTLEIND','WIPRO','ULTRACEMCO','TITAN','SUNPHARMA','M&M','TECHM','POWERGRID','ONGC','NTPC','BAJAJFINSV','DRREDDY','JSWSTEEL','INDUSINDBK'] 
      }
    ]
  },
  US: {
    markets: [
      { 
        name: 'S&P 500', symbol: 'SPX', indexSymbol: '^GSPC', tvSymbol: 'AMEX:SPY', exchange: 'NYSE/NASDAQ', suffix: '', 
        stocks: ['AAPL','MSFT','AMZN','NVDA','GOOGL','META','BRK-B','TSLA','UNH','JPM','V','XOM','JNJ','LLY','MA','AVGO','PG','HD','MRK','ABBV','COST','CVX','KO','PEP','WMT','NFLX','AMD','INTC','CRM','BAC'] 
      },
      { 
        name: 'NASDAQ 100', symbol: 'NDX', indexSymbol: '^IXIC', tvSymbol: 'NASDAQ:NDX', exchange: 'NASDAQ', suffix: '', 
        stocks: ['AAPL','MSFT','NVDA','AMZN','META','TSLA','GOOGL','AVGO','COST','NFLX','AMD','QCOM','INTC','AMAT','MU','LRCX','KLAC','MRVL','ADSK','PANW'] 
      },
      {
        name: 'Dow Jones 30', symbol: 'DJI', indexSymbol: '^DJI', tvSymbol: 'DJ:DJI', exchange: 'NYSE', suffix: '',
        stocks: ['AAPL','MSFT','JPM','V','UNH','HD','GS','MCD','CAT','AXP','BA','MMM','IBM','HON','WMT','NKE','PG','DIS','CVX','VZ']
      }
    ]
  },
  UK: {
    markets: [
      { name: 'FTSE 100', symbol: 'FTSE100', indexSymbol: '^FTSE', tvSymbol: 'LSE:UKX', exchange: 'LSE', suffix: '.L', stocks: ['SHEL','AZN','HSBA','ULVR','BP','RIO','GSK','BATS','LSEG','DGE','VOD','LLOY','BARC','STAN','NWG','IMB','BA','WPP','EXPN','REL'] }
    ]
  },
  JP: {
    markets: [
      { name: 'Nikkei 225', symbol: 'NI225', indexSymbol: '^N225', tvSymbol: 'TSE:NI225', exchange: 'TSE', suffix: '.T', stocks: ['7203','9984','6758','8306','4063','8035','6861','9433','4568','7267'] }
    ]
  },
  DE: {
    markets: [
      { name: 'DAX 40', symbol: 'DAX', indexSymbol: '^GDAXI', tvSymbol: 'XETR:DAX', exchange: 'XETRA', suffix: '.DE', stocks: ['SAP','SIE','ALV','MRK','BMW','DTE','BAYN','ADS','MBG','BAS','RWE','VOW3','DB1','EOAN','HEN3','SHL','FRE','ZAL','DHER','VNA'] }
    ]
  },
  FR: {
    markets: [
      { name: 'CAC 40', symbol: 'CAC40', indexSymbol: '^FCHI', tvSymbol: 'EUREX:FCHI', exchange: 'Euronext Paris', suffix: '.PA', stocks: ['MC','OR','SAN','AIR','TTE','BNP','RI','SU','KER','AI','SGO','ORA','RMS','EL','STLA','ACA','GLE','PUB','BN','HO'] }
    ]
  },
  HK: {
    markets: [
      { name: 'Hang Seng Index', symbol: 'HSI', indexSymbol: '^HSI', tvSymbol: 'HSI:HSI', exchange: 'HKEX', suffix: '.HK', stocks: ['0700','0939','0941','1299','0005','0388','2318','1398','2628','0883'] }
    ]
  },
  KR: {
    markets: [
      { name: 'KOSPI', symbol: 'KOSPI', indexSymbol: '^KS11', tvSymbol: 'KRX:KOSPI', exchange: 'KRX', suffix: '.KS', stocks: ['005930','000660','035420','005380','051910','006400','035720','028260','066570','015760'] }
    ]
  },
  AU: {
    markets: [
      { name: 'ASX 200', symbol: 'ASX200', indexSymbol: '^AXJO', tvSymbol: 'ASX:XJO', exchange: 'ASX', suffix: '.AX', stocks: ['BHP','CBA','CSL','ANZ','WBC','NAB','WES','MQG','TLS','RIO','APT','WOW','TCL','GMG','COL'] }
    ]
  },
  CA: {
    markets: [
      { name: 'TSX Composite', symbol: 'TSX', indexSymbol: '^GSPTSE', tvSymbol: 'TSX:TSX', exchange: 'TSX', suffix: '.TO', stocks: ['RY','TD','BNS','BMO','CM','ENB','CNQ','SU','ABX','WPM'] }
    ]
  },
  BR: {
    markets: [
      { name: 'Ibovespa', symbol: 'IBOV', indexSymbol: '^BVSP', tvSymbol: 'BMFBOVESPA:IBOV', exchange: 'B3', suffix: '.SA', stocks: ['PETR4','VALE3','ITUB4','BBDC4','B3SA3','WEGE3','RENT3','LREN3','JBSS3','SUZB3'] }
    ]
  },
  SG: {
    markets: [
      { name: 'STI', symbol: 'STI', indexSymbol: '^STI', tvSymbol: 'SGX:STI', exchange: 'SGX', suffix: '.SI', stocks: ['D05','U11','Z74','C6L','V03','BS6','BN4','S63','C09','Y92'] }
    ]
  },
  CH: {
    markets: [
      { name: 'SMI', symbol: 'SMI', indexSymbol: '^SSMI', tvSymbol: 'SIX:SMI', exchange: 'SIX', suffix: '.SW', stocks: ['NESN','ROG','NOVN','AMS','ZURN','ABBN','UHR','CSGN','UBSG','GIVN'] }
    ]
  },
  MX: {
    markets: [
      { name: 'IPC', symbol: 'IPC', indexSymbol: '^MXX', tvSymbol: 'BMV:ME', exchange: 'BMV', suffix: '.MX', stocks: ['AMXL','FEMSAUBD','GMEXICOB','WALMEX','BIMBOA'] }
    ]
  },
  SA: {
    markets: [
      { name: 'Tadawul All Share (TASI)', symbol: 'TASI', indexSymbol: '^TASI.SR', tvSymbol: 'TADAWUL:TASI', exchange: 'Tadawul', suffix: '.SR', stocks: ['2222','1180','3007','2050','1120'] }
    ]
  },
  TW: {
    markets: [
      { name: 'Taiwan Weighted Index', symbol: 'TWII', indexSymbol: '^TWII', tvSymbol: 'TWSE:TAIEX', exchange: 'TWSE', suffix: '.TW', stocks: ['2330','2454','2317','2308','2412','2881','2882','6505','2886','1303'] }
    ]
  },
  AE: {
    markets: [
      { name: 'DFM General Index', symbol: 'DFM', indexSymbol: '^DFMGI', exchange: 'DFM', suffix: '.DU', stocks: ['DIB','EMAAR','DU','DEWA','FAB'] }
    ]
  },
  ZA: {
    markets: [
      { name: 'JSE Top 40', symbol: 'JSE40', indexSymbol: '^JN0U.JO', exchange: 'JSE', suffix: '.JO', stocks: ['AGL','CFR','BTI','SOL','SHP','NPN','FSR','BVT'] }
    ]
  }
};

let cachedCountries = null;

export class GlobalMarketsService {
  /**
   * Fetches all supported countries with metadata from REST Countries API
   */
  static async getCountries() {
    if (cachedCountries) return cachedCountries;

    try {
      // Fetch high-quality country metadata from REST Countries API
      const { data } = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,flags,currencies,region');
      
      // Filter countries that we have market data for
      const countries = data
        .filter(c => MARKET_DATA_MAP[c.cca2])
        .map(c => {
          const currencyCode = Object.keys(c.currencies || {})[0];
          return {
            name: c.name.common,
            code: c.cca2,
            flag: c.flags.png,
            emoji: c.flag,
            currency: currencyCode,
            currencySymbol: c.currencies?.[currencyCode]?.symbol || currencyCode,
            region: c.region
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));

      cachedCountries = countries;
      return countries;
    } catch (error) {
      console.error('Error fetching country data from API:', error.message);
      // Minimal fallback
      return Object.keys(MARKET_DATA_MAP).map(code => ({ name: code, code, flag: '🌐' }));
    }
  }

  /**
   * Returns available markets for a specific country code
   */
  static getMarketsForCountry(countryCode) {
    const data = MARKET_DATA_MAP[countryCode.toUpperCase()];
    if (!data) return null;
    return data.markets.map(({ name, symbol, exchange, indexSymbol }) => ({ name, symbol, exchange, indexSymbol }));
  }

  /**
   * Returns market info and constituent stocks for a specific market symbol
   */
  static getStocksForMarket(marketSymbol) {
    for (const data of Object.values(MARKET_DATA_MAP)) {
      const market = data.markets.find(m => m.symbol === marketSymbol);
      if (market) {
        return {
          market: { 
            name: market.name, 
            symbol: market.symbol, 
            exchange: market.exchange, 
            suffix: market.suffix, 
            indexSymbol: market.indexSymbol 
          },
          stocks: market.stocks,
        };
      }
    }
    return null;
  }
}
