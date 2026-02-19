export interface CoachingModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lessons: CoachingLesson[];
}

export interface CoachingLesson {
  id: string;
  title: string;
  content: string;
  keyPoints?: string[];
  quiz?: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const COACHING_MODULES: CoachingModule[] = [
  {
    id: 'stock-basics',
    title: 'Stock Market Basics',
    description: 'Learn the fundamentals of stocks and how the stock market works.',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    difficulty: 'beginner',
    lessons: [
      {
        id: 'what-are-stocks',
        title: 'What Are Stocks?',
        content: `
## Understanding Stocks

A stock (also called a share or equity) represents ownership in a company. When you buy a stock, you become a partial owner of that company.

## Why Companies Issue Stocks

Companies issue stocks to raise capital for:
- Expanding operations
- Developing new products
- Paying off debt
- Funding research and development

## How Stock Ownership Works

As a shareholder, you may receive:
- **Dividends**: A portion of the company's profits
- **Capital gains**: Profit from selling shares at a higher price
- **Voting rights**: Say in major company decisions

## Stock Exchanges

Stocks are traded on exchanges like:
- NYSE (New York Stock Exchange)
- NASDAQ
- LSE (London Stock Exchange)
- TSE (Tokyo Stock Exchange)
        `,
        keyPoints: [
          'Stocks represent ownership in a company',
          'Stock prices fluctuate based on supply and demand',
          'Investors can profit through dividends and capital gains',
          'Stocks are traded on regulated exchanges',
        ],
      },
      {
        id: 'reading-stock-quotes',
        title: 'Reading Stock Quotes',
        content: `
## Understanding Stock Quotes

A stock quote provides essential information about a stock's trading activity.

## Key Components

- **Ticker Symbol**: Unique identifier (e.g., AAPL for Apple)
- **Price**: Current trading price per share
- **Change**: Price movement from previous close
- **Volume**: Number of shares traded
- **Market Cap**: Total value of all shares

## Price Metrics

- **Open**: Price at market open
- **High/Low**: Highest and lowest prices of the day
- **52-Week High/Low**: Price range over the past year
- **Previous Close**: Last price from prior trading day

## Important Ratios

- **P/E Ratio**: Price relative to earnings per share
- **EPS**: Earnings per share
- **Dividend Yield**: Annual dividend as percentage of price
        `,
        keyPoints: [
          'Ticker symbols uniquely identify each stock',
          'Volume indicates trading activity and liquidity',
          'P/E ratio helps compare stock valuations',
          'The 52-week range shows price volatility',
        ],
      },
      {
        id: 'market-hours',
        title: 'Market Hours & Trading Sessions',
        content: `
## Regular Trading Hours

The U.S. stock market operates:
- **NYSE & NASDAQ**: 9:30 AM - 4:00 PM ET (Monday-Friday)

## Extended Hours Trading

- **Pre-market**: 4:00 AM - 9:30 AM ET
- **After-hours**: 4:00 PM - 8:00 PM ET

## Market Holidays

Major U.S. markets are closed on:
- New Year's Day
- Martin Luther King Jr. Day
- Presidents' Day
- Good Friday
- Memorial Day
- Independence Day
- Labor Day
- Thanksgiving Day
- Christmas Day

## Global Markets

Different markets have different hours:
- **London**: 8:00 AM - 4:30 PM GMT
- **Tokyo**: 9:00 AM - 3:00 PM JST
- **Hong Kong**: 9:30 AM - 4:00 PM HKT
        `,
        keyPoints: [
          'Regular U.S. market hours are 9:30 AM - 4:00 PM ET',
          'Extended hours trading has lower liquidity',
          'Markets close on major holidays',
          'Global markets operate in different time zones',
        ],
      },
    ],
  },
  {
    id: 'risk-types',
    title: 'Understanding Risk Types',
    description: 'Learn about different types of investment risks and how to manage them.',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    difficulty: 'beginner',
    lessons: [
      {
        id: 'market-risk',
        title: 'Market Risk (Systematic Risk)',
        content: `
## What is Market Risk?

Market risk affects the entire market and cannot be eliminated through diversification. It's also called systematic risk or undiversifiable risk.

## Sources of Market Risk

- **Economic recessions**: Overall economic downturns
- **Interest rate changes**: Federal Reserve policy decisions
- **Political events**: Elections, policy changes, geopolitical tensions
- **Natural disasters**: Pandemics, earthquakes, hurricanes
- **Market crashes**: Sudden, widespread declines

## How to Manage Market Risk

While you can't eliminate market risk, you can:
- Maintain a long-term investment horizon
- Use asset allocation strategies
- Consider defensive stocks during uncertainty
- Keep emergency cash reserves
- Use hedging strategies (options, inverse ETFs)

## Beta: Measuring Market Risk

Beta measures how much a stock moves relative to the market:
- **Beta = 1**: Moves with the market
- **Beta > 1**: More volatile than the market
- **Beta < 1**: Less volatile than the market
        `,
        keyPoints: [
          'Market risk affects all investments simultaneously',
          'Cannot be eliminated through diversification',
          'Economic events are primary drivers of market risk',
          'Beta measures sensitivity to market movements',
        ],
        quiz: [
          {
            question: 'What is another name for market risk?',
            options: ['Diversifiable risk', 'Company risk', 'Systematic risk', 'Credit risk'],
            correctIndex: 2,
            explanation: 'Market risk is also called systematic risk because it affects the entire system (market) and cannot be diversified away.',
          },
        ],
      },
      {
        id: 'company-risk',
        title: 'Company-Specific Risk (Unsystematic Risk)',
        content: `
## What is Company-Specific Risk?

Company-specific risk affects only individual companies or sectors. It's also called unsystematic risk, diversifiable risk, or idiosyncratic risk.

## Sources of Company Risk

- **Management decisions**: Leadership changes, strategy shifts
- **Competitive pressure**: New competitors, market share loss
- **Product issues**: Recalls, failed launches, obsolescence
- **Financial problems**: Debt issues, cash flow problems
- **Legal troubles**: Lawsuits, regulatory penalties
- **Reputation damage**: Scandals, PR crises

## Reducing Company-Specific Risk

The primary way to reduce this risk is through diversification:
- Own stocks across multiple sectors
- Include different market capitalizations
- Invest in various geographic regions
- Use index funds or ETFs for instant diversification

## How Many Stocks for Diversification?

Research suggests:
- **15-20 stocks**: Eliminates most company-specific risk
- **30+ stocks**: Marginal additional benefit
- **Index funds**: Maximum diversification
        `,
        keyPoints: [
          'Affects individual companies, not the whole market',
          'Can be reduced through diversification',
          '15-20 stocks typically provide adequate diversification',
          'Index funds offer maximum diversification',
        ],
        quiz: [
          {
            question: 'How can company-specific risk be reduced?',
            options: ['Timing the market', 'Diversification', 'Buying more of the same stock', 'Avoiding the market'],
            correctIndex: 1,
            explanation: 'Diversification across multiple companies and sectors reduces company-specific risk because poor performance in one company is offset by others.',
          },
        ],
      },
      {
        id: 'volatility-risk',
        title: 'Volatility Risk',
        content: `
## Understanding Volatility

Volatility measures how much and how quickly prices change. High volatility means larger price swings in shorter periods.

## Measuring Volatility

- **Standard Deviation**: Measures price dispersion from the average
- **VIX (Fear Index)**: Measures expected S&P 500 volatility
- **Historical Volatility**: Based on past price movements
- **Implied Volatility**: Market's expectation of future volatility

## Volatility Levels

- **Low Volatility (< 15%)**: Utilities, consumer staples, bonds
- **Moderate Volatility (15-25%)**: Blue-chip stocks, diversified ETFs
- **High Volatility (> 25%)**: Growth stocks, small caps, emerging markets
- **Extreme Volatility (> 50%)**: Speculative stocks, cryptocurrencies

## Managing Volatility Risk

- Set appropriate position sizes
- Use stop-loss orders
- Avoid panic selling during high volatility
- Consider volatility when setting expectations
- Rebalance periodically to maintain target allocation
        `,
        keyPoints: [
          'Volatility measures the magnitude of price changes',
          'VIX is a key indicator of market volatility expectations',
          'Different asset classes have different volatility profiles',
          'Position sizing helps manage volatility exposure',
        ],
      },
      {
        id: 'liquidity-risk',
        title: 'Liquidity Risk',
        content: `
## What is Liquidity Risk?

Liquidity risk is the risk that you cannot buy or sell an investment quickly enough at a fair price.

## Signs of Low Liquidity

- Wide bid-ask spreads
- Low trading volume
- Large price impact from trades
- Difficulty finding buyers/sellers
- Thinly traded securities

## High Liquidity Examples

- Large-cap stocks (Apple, Microsoft)
- S&P 500 ETFs (SPY, VOO)
- U.S. Treasury bonds
- Major currency pairs

## Low Liquidity Examples

- Small-cap stocks
- Penny stocks
- Some corporate bonds
- Real estate
- Private equity

## Managing Liquidity Risk

- Stick to heavily traded securities
- Check average daily volume before investing
- Avoid large positions in illiquid assets
- Use limit orders instead of market orders
- Maintain emergency cash reserves
        `,
        keyPoints: [
          'Liquidity affects how easily you can trade',
          'Wide bid-ask spreads indicate low liquidity',
          'Large-cap stocks typically have high liquidity',
          'Use limit orders for less liquid investments',
        ],
      },
    ],
  },
  {
    id: 'investor-profiles',
    title: 'Investor Risk Profiles',
    description: 'Discover your risk tolerance and investment style.',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    difficulty: 'beginner',
    lessons: [
      {
        id: 'conservative',
        title: 'Conservative Investor',
        content: `
## Conservative Investment Profile

Conservative investors prioritize capital preservation over growth. They accept lower returns in exchange for stability and reduced risk.

## Characteristics

- Low risk tolerance
- Short to medium investment horizon
- Focus on income and preservation
- Sensitive to market volatility
- Values security over growth potential

## Typical Asset Allocation

- **Bonds**: 60-80%
- **Stocks**: 10-30%
- **Cash/Money Market**: 10-20%

## Suitable Investments

- Government bonds and Treasury securities
- High-grade corporate bonds
- Dividend-paying blue-chip stocks
- Money market funds
- Certificate of deposits (CDs)
- Bond ETFs (BND, AGG)

## In Gamefi Terms

- Strong defensive lineup (4-5 defenders)
- Conservative goalkeeper (ultra-low beta assets)
- Few attackers (limited high-risk exposure)
- Formation suggestion: 5-4-1 or 5-3-2
        `,
        keyPoints: [
          'Prioritizes capital preservation',
          'Heavy allocation to bonds and fixed income',
          'Limited exposure to volatile stocks',
          'Suitable for near-term goals or risk-averse investors',
        ],
      },
      {
        id: 'moderate',
        title: 'Moderate Investor',
        content: `
## Moderate Investment Profile

Moderate investors seek a balance between growth and stability. They can tolerate some volatility for better long-term returns.

## Characteristics

- Medium risk tolerance
- Medium to long investment horizon (5-15 years)
- Balanced approach to risk and reward
- Can handle moderate market fluctuations
- Seeks steady growth with some income

## Typical Asset Allocation

- **Stocks**: 40-60%
- **Bonds**: 30-50%
- **Cash/Alternatives**: 5-15%

## Suitable Investments

- Index funds (S&P 500, Total Market)
- Balanced mutual funds
- Mix of growth and value stocks
- Investment-grade bonds
- REITs for diversification
- Target-date funds

## In Gamefi Terms

- Balanced team composition
- Solid midfield (index funds, balanced ETFs)
- Equal emphasis on defense and attack
- Formation suggestion: 4-4-2 or 4-3-3
        `,
        keyPoints: [
          'Balances growth potential with stability',
          'Roughly equal stock and bond allocation',
          'Comfortable with moderate market swings',
          'Suitable for medium-term financial goals',
        ],
      },
      {
        id: 'aggressive',
        title: 'Aggressive Investor',
        content: `
## Aggressive Investment Profile

Aggressive investors seek maximum growth and can tolerate significant volatility. They have a long time horizon to recover from market downturns.

## Characteristics

- High risk tolerance
- Long investment horizon (15+ years)
- Focus on capital appreciation
- Comfortable with significant volatility
- Willing to accept potential losses for higher gains

## Typical Asset Allocation

- **Stocks**: 80-100%
- **Bonds**: 0-15%
- **Alternatives/Crypto**: 0-10%

## Suitable Investments

- Growth stocks
- Small-cap stocks
- Emerging market equities
- Sector-specific ETFs
- Individual high-growth companies
- Options strategies (if experienced)

## In Gamefi Terms

- Attack-heavy formation
- Minimal defensive positions
- High-beta assets throughout
- Formation suggestion: 3-4-3 or 3-3-4
        `,
        keyPoints: [
          'Maximum focus on growth',
          'Heavy stock allocation (80%+)',
          'Long time horizon to recover from losses',
          'Higher volatility in exchange for return potential',
        ],
      },
      {
        id: 'assess-yourself',
        title: 'Assessing Your Risk Profile',
        content: `
## Factors That Determine Your Risk Profile

Your ideal risk profile depends on several personal factors:

## Time Horizon

- **Short (< 3 years)**: Conservative
- **Medium (3-10 years)**: Moderate
- **Long (10+ years)**: Can be more aggressive

## Financial Situation

- Emergency fund status
- Job stability
- Other income sources
- Debt obligations
- Insurance coverage

## Investment Goals

- Retirement savings
- Home down payment
- Education funding
- Wealth building

## Psychological Factors

- How would you feel if your portfolio dropped 20%?
- Can you avoid checking investments during volatility?
- Have you experienced market downturns before?

## Life Stage Considerations

- Young professionals can often take more risk
- Mid-career investors may balance growth and stability
- Pre-retirees typically reduce risk
- Retirees focus on income and preservation
        `,
        keyPoints: [
          'Time horizon is a key factor in risk tolerance',
          'Personal financial situation affects appropriate risk level',
          'Psychological comfort with volatility matters',
          'Risk profile should evolve with life stages',
        ],
        quiz: [
          {
            question: 'Which investor typically has the highest stock allocation?',
            options: ['Conservative investor', 'Moderate investor', 'Aggressive investor', 'All have the same'],
            correctIndex: 2,
            explanation: 'Aggressive investors typically have 80-100% stock allocation because they prioritize growth and have a long time horizon to recover from downturns.',
          },
        ],
      },
    ],
  },
  {
    id: 'key-metrics',
    title: 'Key Investment Metrics',
    description: 'Master the essential metrics for evaluating stocks and portfolios.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    difficulty: 'intermediate',
    lessons: [
      {
        id: 'pe-ratio',
        title: 'Price-to-Earnings (P/E) Ratio',
        content: `
## Understanding P/E Ratio

The P/E ratio compares a company's stock price to its earnings per share. It shows how much investors are willing to pay for each dollar of earnings.

## Formula

**P/E Ratio = Stock Price / Earnings Per Share (EPS)**

Example: If a stock trades at $100 and EPS is $5, the P/E is 20.

## Types of P/E

- **Trailing P/E**: Uses past 12 months of earnings
- **Forward P/E**: Uses estimated future earnings
- **Shiller P/E (CAPE)**: Uses 10-year average inflation-adjusted earnings

## Interpreting P/E

- **Low P/E (< 15)**: May be undervalued or facing challenges
- **Average P/E (15-25)**: Fairly valued for most sectors
- **High P/E (> 25)**: High growth expectations or overvalued

## P/E Considerations

- Compare within the same sector
- High P/E isn't always bad (growth companies)
- Low P/E isn't always good (value traps)
- Consider earnings quality and consistency
        `,
        keyPoints: [
          'P/E measures price relative to earnings',
          'Lower P/E may indicate undervaluation',
          'Compare P/E within the same sector',
          'Consider growth expectations when evaluating P/E',
        ],
      },
      {
        id: 'dividend-yield',
        title: 'Dividend Yield',
        content: `
## Understanding Dividend Yield

Dividend yield shows the annual dividend payment as a percentage of the stock price. It measures the income return on your investment.

## Formula

**Dividend Yield = Annual Dividends Per Share / Stock Price × 100**

Example: $4 annual dividend ÷ $100 stock price = 4% yield

## Yield Categories

- **Low Yield (< 2%)**: Growth-focused companies
- **Moderate Yield (2-4%)**: Balanced approach
- **High Yield (4-6%)**: Income-focused investments
- **Very High Yield (> 6%)**: Proceed with caution

## Warning Signs

Very high yields may indicate:
- Declining stock price
- Unsustainable dividend
- Company in financial trouble
- Special one-time dividend

## Quality Dividend Indicators

- Consistent dividend history (10+ years)
- Growing dividends over time
- Payout ratio below 60%
- Strong cash flow coverage
- Dividend aristocrats (25+ years of increases)
        `,
        keyPoints: [
          'Dividend yield measures income return',
          'Very high yields can be warning signs',
          'Look for consistent dividend history',
          'Payout ratio indicates dividend sustainability',
        ],
      },
      {
        id: 'market-cap',
        title: 'Market Capitalization',
        content: `
## Understanding Market Cap

Market capitalization (market cap) represents the total market value of a company's outstanding shares.

## Formula

**Market Cap = Current Stock Price × Total Shares Outstanding**

## Market Cap Categories

- **Mega-cap**: > $200 billion (Apple, Microsoft)
- **Large-cap**: $10B - $200B (established companies)
- **Mid-cap**: $2B - $10B (growing companies)
- **Small-cap**: $300M - $2B (emerging companies)
- **Micro-cap**: < $300M (speculative)

## Risk and Return by Size

| Category | Risk | Return Potential | Volatility |
|----------|------|------------------|------------|
| Large-cap | Lower | Moderate | Lower |
| Mid-cap | Medium | Higher | Medium |
| Small-cap | Higher | Highest | Higher |

## Why Market Cap Matters

- Indicates company size and stability
- Affects inclusion in indices
- Influences institutional investment
- Correlates with liquidity
- Helps with portfolio diversification
        `,
        keyPoints: [
          'Market cap = price × shares outstanding',
          'Larger companies tend to be more stable',
          'Smaller companies offer higher growth potential',
          'Diversify across market cap sizes',
        ],
      },
      {
        id: 'beta',
        title: 'Beta (Volatility Measure)',
        content: `
## Understanding Beta

Beta measures a stock's volatility relative to the overall market (typically the S&P 500). It indicates how much a stock tends to move compared to market movements.

## Beta Values

- **Beta = 1**: Moves exactly with the market
- **Beta > 1**: More volatile than the market
- **Beta < 1**: Less volatile than the market
- **Beta < 0**: Moves opposite to the market (rare)

## Examples

- **Beta 1.5**: If market rises 10%, stock rises ~15%
- **Beta 0.5**: If market rises 10%, stock rises ~5%
- **Beta 2.0**: Twice as volatile as the market

## Beta by Sector (Typical)

- **Utilities**: 0.3 - 0.6 (defensive)
- **Consumer Staples**: 0.5 - 0.8 (defensive)
- **Healthcare**: 0.7 - 1.0 (mixed)
- **Financials**: 1.0 - 1.3 (cyclical)
- **Technology**: 1.1 - 1.5 (growth)
- **Biotechnology**: 1.3 - 2.0+ (speculative)

## Using Beta in Portfolio Construction

In Gamefi terms:
- **Goalkeepers**: Beta < 0.5
- **Defenders**: Beta 0.5 - 0.8
- **Midfielders**: Beta 0.8 - 1.2
- **Attackers**: Beta > 1.2
        `,
        keyPoints: [
          'Beta measures volatility relative to market',
          'Beta > 1 means more volatile than market',
          'Defensive sectors have lower beta',
          'Use beta to match assets to portfolio positions',
        ],
        quiz: [
          {
            question: 'A stock with a beta of 1.5 would be expected to:',
            options: ['Move 50% less than the market', 'Move exactly with the market', 'Move 50% more than the market', 'Not move at all'],
            correctIndex: 2,
            explanation: 'A beta of 1.5 means the stock is 50% more volatile than the market. If the market moves 10%, the stock would be expected to move about 15%.',
          },
        ],
      },
    ],
  },
  {
    id: 'portfolio-strategies',
    title: 'Portfolio Building Strategies',
    description: 'Learn proven strategies for constructing and managing your portfolio.',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    difficulty: 'intermediate',
    lessons: [
      {
        id: 'diversification',
        title: 'The Power of Diversification',
        content: `
## What is Diversification?

Diversification is spreading investments across different assets to reduce risk. It's the investment equivalent of "don't put all your eggs in one basket."

## Types of Diversification

### Asset Class Diversification
- Stocks, bonds, real estate, commodities

### Sector Diversification
- Technology, healthcare, financials, consumer goods

### Geographic Diversification
- Domestic, international, emerging markets

### Company Size Diversification
- Large-cap, mid-cap, small-cap

## Benefits of Diversification

- Reduces portfolio volatility
- Protects against single-stock disasters
- Smoother long-term returns
- Lower overall risk without sacrificing returns

## Diversification Limits

- Cannot eliminate market (systematic) risk
- Over-diversification can dilute returns
- Correlation increases during market crashes
- 15-30 stocks typically provides adequate diversification
        `,
        keyPoints: [
          'Diversification reduces company-specific risk',
          'Spread across asset classes, sectors, and geographies',
          '15-30 stocks provides adequate diversification',
          'Cannot eliminate market-wide risk',
        ],
      },
      {
        id: 'asset-allocation',
        title: 'Asset Allocation',
        content: `
## What is Asset Allocation?

Asset allocation is dividing your portfolio among different asset categories (stocks, bonds, cash) based on your goals, risk tolerance, and time horizon.

## Classic Allocation Rules

### Age-Based Rule
- **100 minus your age in stocks**: A 30-year-old would have 70% stocks
- **Modified rule (110 or 120 minus age)**: More aggressive approach

### Risk-Based Allocation

| Profile | Stocks | Bonds | Cash |
|---------|--------|-------|------|
| Aggressive | 80-100% | 0-15% | 0-5% |
| Moderate | 50-70% | 25-40% | 5-10% |
| Conservative | 20-40% | 50-70% | 10-20% |

## Strategic vs Tactical Allocation

- **Strategic**: Long-term target allocation
- **Tactical**: Short-term adjustments based on market conditions

## Rebalancing

- Review allocation quarterly or annually
- Rebalance when allocation drifts 5%+ from target
- Can be done by selling or redirecting new investments
        `,
        keyPoints: [
          'Asset allocation is your portfolio mix of stocks, bonds, cash',
          'Base allocation on risk tolerance and time horizon',
          'Rebalance periodically to maintain target allocation',
          'Strategic allocation is the long-term foundation',
        ],
      },
      {
        id: 'dollar-cost-averaging',
        title: 'Dollar-Cost Averaging',
        content: `
## What is Dollar-Cost Averaging?

Dollar-cost averaging (DCA) is investing a fixed amount at regular intervals, regardless of market conditions.

## How It Works

Example: Investing $500 monthly

| Month | Price | Shares Bought |
|-------|-------|---------------|
| January | $50 | 10 |
| February | $40 | 12.5 |
| March | $60 | 8.33 |
| April | $45 | 11.11 |

Total: $2,000 invested, 41.94 shares
Average cost per share: $47.69

## Benefits

- Removes emotion from investing
- No need to time the market
- Buys more shares when prices are low
- Builds investing discipline
- Reduces impact of volatility

## When DCA Works Best

- Regular income to invest
- Long-term investment horizon
- Volatile or uncertain markets
- Building wealth gradually

## DCA vs Lump Sum

- Lump sum historically performs better (time in market)
- DCA reduces regret and emotional stress
- DCA better for risk-averse investors
        `,
        keyPoints: [
          'Invest fixed amounts at regular intervals',
          'Removes need to time the market',
          'Buys more shares when prices are low',
          'Builds consistent investing discipline',
        ],
      },
      {
        id: 'rebalancing',
        title: 'Portfolio Rebalancing',
        content: `
## What is Rebalancing?

Rebalancing is adjusting your portfolio back to your target allocation after market movements have caused drift.

## Why Rebalance?

Over time, winners grow and become overweight:
- Started: 60% stocks / 40% bonds
- After gains: 75% stocks / 25% bonds
- After rebalancing: 60% stocks / 40% bonds

## Rebalancing Methods

### Calendar-Based
- Rebalance quarterly, semi-annually, or annually
- Simple and systematic

### Threshold-Based
- Rebalance when allocation drifts 5%+ from target
- More responsive to market moves

### Combination
- Check at set intervals
- Only rebalance if threshold exceeded

## How to Rebalance

1. **Sell high, buy low**: Sell overweight assets, buy underweight
2. **Direct new contributions**: Invest new money in underweight assets
3. **Redirect dividends**: Use dividends to buy underweight assets

## Tax Considerations

- Use tax-advantaged accounts for frequent rebalancing
- Consider tax-loss harvesting
- Be mindful of short-term capital gains
        `,
        keyPoints: [
          'Rebalancing maintains your target risk level',
          'Can be calendar-based or threshold-based',
          'Essentially forces "buy low, sell high"',
          'Consider tax implications when rebalancing',
        ],
      },
    ],
  },
];

export const DIFFICULTY_COLORS = {
  beginner: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    badge: 'bg-green-500',
  },
  intermediate: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500',
  },
  advanced: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500',
  },
};
