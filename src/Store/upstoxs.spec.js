import { computeMetrics } from './upstoxs';

describe('computeMetrics()', () => {
  it('calculates metrics for an up day', async () => {
    const context = {
      scriptName: 'TEST',
      instrumentKey: 'AAPL',
      size: 100,
      riskOfPortfolio: 5000,
      currentDayOpen: 100,
      lowPrice: 100,
      currentVolume: 10000,
      high: 110,
      ltp: 105,
      stats: { AAPL: { lastPrice: 98, avgVolume21d: 9000, avgValueVolume21d: 1e6 } },
      currentMinuteVolume: 100,
    };
    const result = await computeMetrics(context);
    expect(result.isUpDay).toBe(true);
    expect(result.barClosingStrength).toBe('50'); // Example assertion
    expect(result.changePercentage).toBe('5.00'); // Example assertion
  });

  it('returns "-" for allocation fields when no positive price move', async () => {
    const context = {
      scriptName: 'TEST',
      instrumentKey: 'GOOG',
      size: 75,
      riskOfPortfolio: 7000,
      currentDayOpen: 1500,
      lowPrice: 1480,
      currentVolume: 5000,
      high: 1520,
      ltp: 1490, // ltp less than currentDayOpen, no positive move
      stats: { GOOG: { lastPrice: 1485, avgVolume21d: 6000, avgValueVolume21d: 1.5e6 } },
      currentMinuteVolume: 50,
    };
    const result = await computeMetrics(context);

    expect(result.isUpDay).toBe(false);
    expect(result.sl).toBe(context.currentDayOpen); // SL still currentDayOpen
    expect(result.maxAllocationPercentage).toBe('-');
    expect(result.riskRewardRatio).toBe('-');
    expect(result.allocationSuggestions.length).toBe(0);
  });
});

import { calculateAllocationIntent } from '../utils/calculateMetrics'; // Adjust import path

describe('calculateAllocationIntent()', () => {
  it('returns error if exit price is not less than entry price', () => {
    const result = calculateAllocationIntent(15, 10000, 100, 105, 5);
    expect(result).toHaveProperty('error', 'Invalid exit price: It must be less than the entry price.');
  });

  it('calculates shares and allocation correctly for valid exit price', () => {
    const portfolioPercentage = 15;
    const portfolioSize = 10000;
    const entryPrice = 100;
    const exitPrice = 90;
    const riskPercentage = 5;

    const result = calculateAllocationIntent(portfolioPercentage, portfolioSize, entryPrice, exitPrice, riskPercentage);

    expect(result).not.toHaveProperty('error');

    // Shares to buy limited by risk and max investment
    expect(result.sharesToBuy).toBeGreaterThan(0);
    expect(result.sharesToBuy).toBeLessThanOrEqual(result.maxShareToBuy);

    // Max allocation percentage should be rounded number between 0 and 100
    expect(typeof result.maxAllocationPercentage).toBe('number');
    expect(result.maxAllocationPercentage).toBeGreaterThanOrEqual(0);
    expect(result.maxAllocationPercentage).toBeLessThanOrEqual(100);

    // Risk reward ratio should be positive number
    expect(typeof result.riskRewardRatio).toBe('number');
    expect(result.riskRewardRatio).toBeGreaterThan(0);

    // Loss per share calculation
    expect(result.lossPerShare).toBe(entryPrice - exitPrice);

    // Loss in money equals sharesToBuy times lossPerShare
    expect(result.lossInMoney).toBeCloseTo(result.sharesToBuy * result.lossPerShare);

    // Allocation suggestions check
    expect(Array.isArray(result.allocationSuggestions)).toBe(true);
    expect(result.allocationSuggestions.length).toBeGreaterThan(0);
    result.allocationSuggestions.forEach(suggestion => {
      expect(typeof suggestion.riskPercentage).toBe('string');
      expect(parseFloat(suggestion.riskPercentage)).toBeGreaterThan(0);
    });
  });

  it('sharesToBuy never exceeds max affordable shares & risk-based shares', () => {
    const portfolioPercentage = 10;
    const portfolioSize = 10000;
    const entryPrice = 50;
    const exitPrice = 30; // large loss per share
    const riskPercentage = 2;

    const result = calculateAllocationIntent(portfolioPercentage, portfolioSize, entryPrice, exitPrice, riskPercentage);

    const maxAffordableShares = Math.floor(portfolioSize / entryPrice);
    const lossPerShare = entryPrice - exitPrice;
    const riskAmount = (riskPercentage / 100) * portfolioSize;
    const sharesAllowedByRisk = Math.floor(riskAmount / lossPerShare);

    expect(result.sharesToBuy).toBeLessThanOrEqual(maxAffordableShares);
    expect(result.sharesToBuy).toBeLessThanOrEqual(sharesAllowedByRisk);
  });

  const randomFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);

describe('calculateAllocationIntent() randomized tests', () => {
  const portfolioSize = 100000;
  const portfolioPercentage = 10; // Allow up to 10% allocation

  // Risk percentages to test explicitly from allocationSuggestions
  const riskPercentages = [0.25, 0.3, 0.35];

  for (const riskPct of riskPercentages) {
    it(`correctly calculates loss for risk percentage ${riskPct}%`, () => {
      const entryPrice = randomFloat(50, 150);
      // Create an exitPrice that generates a loss roughly aligned with risk %, allowing slight variation
      const maxRiskAmount = (riskPct / 100) * portfolioSize;

      // We want lossInMoney (shares * lossPerShare) to be close to maxRiskAmount
      // Assume buying shares limited by 10% allocation => maxInvestment = 10% of portfolioSize
      const maxInvestment = (portfolioPercentage / 100) * portfolioSize;
      const maxShares = Math.floor(maxInvestment / entryPrice);

      // Calculate a lossPerShare so that lossInMoney ~ maxRiskAmount
      // lossInMoney = sharesToBuy * lossPerShare => lossPerShare = maxRiskAmount / maxShares
      const lossPerShare = +(maxRiskAmount / maxShares).toFixed(2);

      // exitPrice = entryPrice - lossPerShare
      const exitPrice = +(entryPrice - lossPerShare).toFixed(2);

      const result = calculateAllocationIntent(portfolioPercentage, portfolioSize, entryPrice, exitPrice, riskPct);

      expect(result).not.toHaveProperty('error');

      // Validate loss per share matches calculated difference
      expect(result.lossPerShare).toBeCloseTo(lossPerShare, 2);

      // Validate riskAmount matches input percentage of portfolioSize
      expect(result.riskAmount).toBeCloseTo(maxRiskAmount, 0);

      // Validate lossInMoney is <= riskAmount (allowing rounding)
      expect(result.lossInMoney).toBeLessThanOrEqual(maxRiskAmount);

      // Validate sharesToBuy does not exceed maxShares affordable
      expect(result.sharesToBuy).toBeLessThanOrEqual(maxShares);

      // Validate maxAllocationPercentage reasonable (0 to 100)
      expect(result.maxAllocationPercentage).toBeGreaterThanOrEqual(0);
      expect(result.maxAllocationPercentage).toBeLessThanOrEqual(100);

      // Allocation suggestions include tested riskPct
      const suggestion = result.allocationSuggestions.find(a => parseFloat(a.riskPercentage) === riskPct);
      expect(suggestion).toBeDefined();

      // Check suggestion maxShares times entryPrice equals approx maxInvestment for riskPct
      expect(parseFloat(suggestion.maxInvestment)).toBeCloseTo(suggestion.maxShares * entryPrice, 2);
    });
  }
});
});

