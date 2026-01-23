export interface AssetTypeTopic {
  type: string;
  title: string;
  description: string;
  risk: string;
  volatility: string;
  bestFor: string;
  examples: string[];
}

export interface LearningSection {
  id: string;
  title: string;
  description: string;
  topics?: AssetTypeTopic[];
  content?: string;
  tips?: string[];
}

export const ASSET_TYPE_TOPICS: AssetTypeTopic[] = [
  {
    type: 'stock',
    title: 'Stocks',
    description: 'Stocks represent ownership shares in individual companies. When you buy a stock, you become a partial owner of that company and can benefit from its growth through price appreciation and dividends.',
    risk: 'Medium to High',
    volatility: 'High',
    bestFor: 'Long-term growth, investors comfortable with market fluctuations',
    examples: ['AAPL (Apple)', 'MSFT (Microsoft)', 'GOOGL (Alphabet)', 'TSLA (Tesla)'],
  },
  {
    type: 'etf',
    title: 'ETFs (Exchange-Traded Funds)',
    description: 'ETFs are investment funds that hold a basket of assets like stocks, bonds, or commodities. They trade on exchanges like stocks but provide instant diversification across many holdings.',
    risk: 'Varies (Low to High)',
    volatility: 'Medium',
    bestFor: 'Diversification, beginners, cost-effective investing',
    examples: ['SPY (S&P 500)', 'QQQ (Nasdaq 100)', 'VTI (Total Market)', 'ARKK (Innovation)'],
  },
  {
    type: 'bond',
    title: 'Bonds',
    description: 'Bonds are debt securities where you lend money to governments or corporations in exchange for regular interest payments and return of principal at maturity. They are generally considered safer than stocks.',
    risk: 'Low to Medium',
    volatility: 'Low',
    bestFor: 'Income generation, capital preservation, portfolio stability',
    examples: ['BND (Total Bond)', 'TLT (Treasury Bonds)', 'LQD (Corporate Bonds)', 'HYG (High Yield)'],
  },
  {
    type: 'reit',
    title: 'REITs (Real Estate Investment Trusts)',
    description: 'REITs are companies that own, operate, or finance income-producing real estate. They allow you to invest in real estate without directly buying property and typically pay high dividends.',
    risk: 'Medium',
    volatility: 'Medium',
    bestFor: 'Income seekers, real estate exposure, dividend investors',
    examples: ['O (Realty Income)', 'AMT (American Tower)', 'PLD (Prologis)', 'EQIX (Equinix)'],
  },
  {
    type: 'commodity',
    title: 'Commodities',
    description: 'Commodities are raw materials or primary agricultural products that can be bought and sold. They include precious metals, energy resources, and agricultural products. They often move independently of stocks.',
    risk: 'High',
    volatility: 'Very High',
    bestFor: 'Inflation hedge, portfolio diversification, speculation',
    examples: ['GLD (Gold)', 'SLV (Silver)', 'USO (Oil)', 'CORN (Corn)'],
  },
];

export const LEARNING_SECTIONS: LearningSection[] = [
  {
    id: 'asset-types',
    title: 'Understanding Asset Types',
    description: 'Learn about the different types of assets you can add to your portfolio and their unique characteristics.',
    topics: ASSET_TYPE_TOPICS,
  },
  {
    id: 'risk-volatility',
    title: 'Risk & Volatility',
    description: 'Understanding how to measure and manage risk in your portfolio.',
    content: `
## What is Risk?

Risk in investing refers to the possibility that your investment may lose value. Different assets carry different levels of risk:

- **Low Risk**: Bonds, Treasury securities, stable dividend stocks
- **Medium Risk**: Index ETFs, established blue-chip stocks, REITs
- **High Risk**: Growth stocks, commodities, emerging market investments

## What is Volatility?

Volatility measures how much an asset's price fluctuates over time. High volatility means larger price swings, while low volatility indicates more stable prices.

## Beta: Measuring Market Risk

Beta is a key metric that measures an asset's volatility relative to the overall market:

- **Beta < 0.8**: Lower risk than the market (Defensive assets)
- **Beta 0.8 - 1.2**: Similar risk to the market (Neutral assets)
- **Beta > 1.2**: Higher risk than the market (Aggressive assets)

## Position Matching in Gamefi

In Gamefi, we map position risk to portfolio positions:

- **Goalkeeper (GK)**: Ultra-safe, low volatility assets (Beta < 0.5)
- **Defenders (DEF)**: Low-risk assets like bonds and stable ETFs (Beta < 0.8)
- **Midfielders (MID)**: Medium-risk assets like index funds (Beta 0.8-1.2)
- **Attackers (ATK)**: High-risk, high-reward assets (Beta > 1.2)
    `,
  },
  {
    id: 'best-practices',
    title: 'Best Practices',
    description: 'Tips and strategies for building a successful portfolio.',
    tips: [
      'Diversify across different sectors to reduce risk',
      'Match asset risk levels to position types for balanced exposure',
      'Include a mix of asset types (stocks, ETFs, bonds) for stability',
      'Consider dividend-paying assets for passive income',
      'Review and rebalance your portfolio regularly',
      'Start with ETFs if you are new to investing',
      'Use bonds and low-beta assets for your defensive positions',
      'Place high-growth stocks in attacking positions',
      'Monitor your portfolio beta for overall risk assessment',
      'Don\'t put all your eggs in one sector basket',
    ],
  },
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'A quick guide to building your first portfolio.',
    content: `
## Step 1: Choose Your Formation

Select a formation that matches your investment style:
- **4-3-3**: Balanced with attacking potential
- **5-3-2**: More defensive, lower risk
- **3-4-3**: Aggressive, higher risk/reward

## Step 2: Fill Your Goalkeeper

Start with your safest asset - this should be a low-volatility bond or stable ETF that provides a foundation for your portfolio.

## Step 3: Build Your Defense

Add 3-5 low-risk assets like treasury bonds, stable dividend stocks, or broad market ETFs. These protect your portfolio during market downturns.

## Step 4: Strengthen Your Midfield

Add medium-risk assets that provide growth potential while maintaining stability. Index ETFs and established tech stocks work well here.

## Step 5: Power Your Attack

Place your high-growth assets in attacking positions. These can be volatile but offer the highest return potential.

## Step 6: Review & Adjust

Regularly check your portfolio's performance and rebalance as needed. Markets change, and your portfolio should adapt.
    `,
  },
];

export const RISK_LEVEL_COLORS = {
  low: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500',
  },
  medium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500',
  },
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500',
  },
};
