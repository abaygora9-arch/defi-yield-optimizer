# DeFi Yield Optimizer

Multi-factor DeFi yield analysis, risk modeling, and strategy optimization platform.

## Features

- **Real-time Data Pipeline** — Aggregates yield data from DefiLlama across Ethereum, BSC, Arbitrum, and Polygon
- **Multi-Factor Risk Engine** — Weighted model analyzing TVL risk, APY anomaly, volatility, protocol maturity, and liquidity risk
- **Monte Carlo Simulation** — Realistic return modeling with impermanent loss estimation, gas impact, and Sharpe-like ratio
- **Strategy Engine** — Intelligent ranking with Conservative/Balanced/Aggressive modes and trap pool detection
- **Explanation Engine** — Rule-based NLP generating human-readable insights for each pool
- **Advanced Visualization** — APY vs Risk scatter, risk distribution histogram, portfolio growth simulation, pool comparison radar

## Architecture

```
/src
├── /app                    # Next.js App Router
│   ├── /api/pools         # Data pipeline API endpoint
│   └── /api/simulate      # Simulation engine API endpoint
├── /components
│   ├── /charts            # Recharts visualizations
│   ├── /dashboard         # Stats, filters, pool table
│   ├── /pool              # Pool analyzer modal
│   └── /ui                # Reusable UI primitives
├── /hooks                 # Custom React hooks (usePools, useSimulation)
├── /modules
│   ├── /data-pipeline     # Ingestion → Normalization → Enrichment
│   ├── /risk-engine       # Multi-factor weighted risk model
│   ├── /simulation        # Monte Carlo + compound + IL estimation
│   ├── /strategy          # Ranking algorithm + trap detection
│   └── /explanation       # Rule-based NLP insight generator
├── /services              # Cache layer (memory + localStorage)
├── /types                 # TypeScript type definitions
└── /utils                 # Math utilities, formatters, constants
```

## Risk Model

```
R = w1(TVL risk) + w2(APY anomaly) + w3(volatility) + w4(protocol maturity) + w5(liquidity risk)
```

All factors normalized to [0, 1]. Output: score 0–100 with category and confidence level.

## Simulation Engine

- Compound interest with daily accrual
- Monte Carlo (100 paths) with random APY fluctuation
- Impermanent loss estimation (σ² model)
- Gas fee impact (weekly reinvestment)
- Best/worst case (5th/95th percentile)
- Simplified Sharpe-like ratio

## Strategy Modes

| Mode | α (Return) | β (Risk) | γ (Stability) |
|------|-----------|---------|--------------|
| Conservative | 0.2 | 0.6 | 0.2 |
| Balanced | 0.4 | 0.3 | 0.3 |
| Aggressive | 0.7 | 0.15 | 0.15 |

## Getting Started

```bash
npm install
npm run dev        # Development
npm run build      # Production build
npm start          # Production server
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Data Source:** DefiLlama Yields API + CoinGecko

## Deployment

Optimized for Vercel. Push and deploy:

```bash
vercel --prod
```
