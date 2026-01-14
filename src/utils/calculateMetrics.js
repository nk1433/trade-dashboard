/**
 * Calculates metrics for portfolio positions.
 * @param {Array} data - Array of position objects.
 * @param {number} portfolioSize - Total portfolio size.
 * @param {number} exitPercentage - Exit percentage for reward calculation.
 * @returns {Object} - Updated data and total metrics.
 */
export const calculateMetrics = (data, portfolioSize, exitPercentage) => {
  let totalRisk = 0;
  let totalAllocatedAmount = 0;

  const updatedData = data.map((position) => {
    const risk = position.shares * (position.entry - position.exit <= 0 ? 0 : position.entry - position.exit); // Risk in money
    const reward = position.entry * (exitPercentage / 100); // Reward per share
    const riskToReward =
      position.entry <= position.exit ? 0 : reward / (position.entry - position.exit); // Risk-to-reward ratio
    const positionSizeAllocated =
      (position.shares * position.entry) / portfolioSize * 100; // Allocated size in %

    totalRisk += risk; // Accumulate total risk
    totalAllocatedAmount += position.shares * position.entry; // Accumulate allocated amount

    const exitPoints = [
      (position.entry * 1.02).toFixed(2), // 3% gain
      (position.entry * 1.03).toFixed(2), // 3% gain
      (position.entry * 1.06).toFixed(2), // 6% gain
      (position.entry * 1.09).toFixed(2), // 9% gain
    ];

    return {
      ...position,
      riskToReward: riskToReward.toFixed(2),
      positionSizeAllocated: positionSizeAllocated.toFixed(2) + " %",
      risk: risk.toFixed(2) <= 0 ? 0 : risk.toFixed(2),
      tradeManagement: position.entry > position.exit ? "SL < E" : position.entry < position.exit ? "SL > E" : "SL = E",
      exitPoints,
    };
  });

  // Calculate total allocated percentage
  const totalAllocatedPercentage = (totalAllocatedAmount / portfolioSize) * 100;

  // Calculate total risk percentage
  const totalRiskPercentage = (totalRisk / portfolioSize) * 100;

  return {
    updatedData,
    totalRisk: totalRisk.toFixed(2),
    totalRiskPercentage: totalRiskPercentage.toFixed(2) + " %",
    totalAllocatedAmount: totalAllocatedAmount.toFixed(2),
    totalAllocatedPercentage: totalAllocatedPercentage.toFixed(2) + " %",
  };
};

/**
 * Formats a number to two decimal places and adds a percentage sign.
 * @param {number} value - The value to format.
 * @returns {string} - Formatted percentage string.
 */
export const formatPercentage = (value) => {
  return `${value.toFixed(2)} %`;
};

/**
 * Validates input values for portfolio calculations.
 * @param {number} portfolioSize - Portfolio size to validate.
 * @param {number} exitPercentage - Exit percentage to validate.
 * @returns {boolean} - True if inputs are valid, false otherwise.
 */
export const validateInputs = (portfolioSize, exitPercentage) => {
  if (portfolioSize <= 0 || exitPercentage <= 0 || exitPercentage > 100) {
    return false;
  }
  return true;
};


/**
* Calculates insights for allocation intent.
* @param {number} portfolioPercentage - Percentage of the portfolio to allocate.
* @param {number} portfolioSize - Total size of the portfolio.
* @param {number} entryPrice - Entry price per share.
* @param {number} exitPrice - Exit price per share.
* @param {number} riskPercentage - Risk per trade as a percentage.
* @returns {Object} - Insights from the calculation.
*/
export const calculateAllocationIntent = (
  portfolioPercentage,
  portfolioSize,
  entryPrice,
  exitPrice,
  riskPercentage
) => {
  const maxInvestment = (portfolioPercentage / 100) * portfolioSize;
  const riskAmount = (riskPercentage / 100) * portfolioSize;
  const lossPerShare = entryPrice - exitPrice;

  if (lossPerShare <= 0) {
    return { error: "Invalid exit price: It must be less than the entry price." };
  }

  const maxAffordableShares = Math.floor(portfolioSize / entryPrice);
  const sharesAllowedByRisk = Math.min(Math.floor(riskAmount / lossPerShare), maxAffordableShares);
  const sharesAllowedByInvestment = Math.floor(maxInvestment / entryPrice);
  const sharesToBuy = Math.min(sharesAllowedByRisk, sharesAllowedByInvestment);
  const maxShareToBuy = Math.max(sharesAllowedByRisk, sharesAllowedByInvestment);

  const investmentAmount = sharesToBuy * entryPrice;
  const lossInMoney = sharesToBuy * lossPerShare;
  const actualAllocationPercentage = (investmentAmount / maxInvestment) * 100;
  const rewardPerShare = entryPrice * 0.10;
  const riskRewardRatio = rewardPerShare / lossPerShare;
  const maxAllocationWithRisk = sharesAllowedByRisk * entryPrice;
  const maxAllocationPercentage = ((maxAllocationWithRisk / portfolioSize) * 100);

  // Calculate raw percentage of total portfolio used
  const percentOfPortfolio = (investmentAmount / portfolioSize) * 100;

  const riskArray = [0.25, 0.3, 0.35]; // Array of risk percentages of portfolio

  const allocationSuggestions = riskArray.map((riskPercent) => {
    const totalRiskAmount = (riskPercent / 100) * portfolioSize;
    const riskPerSharePercentage = 0.01;
    const riskPerShare = entryPrice * riskPerSharePercentage;
    const maxShares = Math.floor(totalRiskAmount / riskPerShare);
    const maxInvestment = maxShares * entryPrice;
    const maxInvestmentPercentage = (maxInvestment / portfolioSize) * 100;

    return {
      riskPercentage: riskPercent.toFixed(2) + "%",
      maxInvestment: maxInvestment.toFixed(2),
      allocPer: maxInvestmentPercentage.toFixed(2) + "%",
      maxShares,
    };
  });

  return {
    sharesToBuy,
    maxShareToBuy,
    allocationSuggestions,
    maxAllocationWithRisk: maxAllocationWithRisk,
    maxAllocationPercentage: Math.round(maxAllocationPercentage),
    intentInvestment: maxInvestment,
    investmentAmount: investmentAmount,
    actualAllocationPercentage: (investmentAmount / maxInvestment) * 100,
    percentOfPortfolio: percentOfPortfolio,
    riskAmount: riskAmount,
    lossPerShare: lossPerShare,
    riskRewardRatio: riskRewardRatio,
    lossInMoney: lossInMoney,
    rewardPerShare: rewardPerShare,
  };
};



export const calculateAllocationIntentForScript = (
  capital,
  allocationSize,
  entryPrice,
  riskedAmountPercentage,
) => {
  const maxInvestment = (allocationSize / 100) * capital;
  const riskAllowed = (riskedAmountPercentage / 100) * capital;
  const stopLossPercentage = riskedAmountPercentage / 10;
  const lossPerShare = entryPrice * stopLossPercentage;
  const stopLossPrice = parseFloat((entryPrice - lossPerShare).toFixed(2));
  const rewardPerShare = parseFloat((entryPrice * 0.10).toFixed(2));
  const riskRewardRatio = lossPerShare > 0 ? (rewardPerShare / lossPerShare).toFixed(2) : 'Infinity';
  let sharesToBuyByInvestment = 0;
  let sharesToBuy = 0;
  let investmentAmount = 0;
  let potentialLoss = 0;
  let allocationPercentage = 0;

  if (lossPerShare > 0) {
    sharesToBuyByInvestment = Math.floor(maxInvestment / entryPrice);

    sharesToBuy = sharesToBuyByInvestment;

    investmentAmount = sharesToBuy * entryPrice;
    potentialLoss = sharesToBuy * (entryPrice - stopLossPrice);

    allocationPercentage = parseFloat(((investmentAmount / capital) * 100).toFixed(2));
  }

  return {
    percentage: allocationSize,
    sharesToBuy,
    allocation: investmentAmount.toFixed(2),
    allocationPercentOfPortfolio: allocationPercentage,
    sl: stopLossPrice,
    riskAmount: riskAllowed.toFixed(2),
    potentialLoss: potentialLoss.toFixed(2),
    canAllocate: riskAllowed >= potentialLoss,
    riskRewardRatio: riskRewardRatio,
  };
};

export const computeMetrics = async (context) => {
  const {
    scriptName,
    instrumentKey,
    size,
    riskOfPortfolio,
    currentDayOpen,
    lowPrice,
    currentVolume,
    high,
    ltp,
    stats,
    currentMinuteVolume,
    symbol,
    trendIntensity,
  } = context;

  let barClosingStrength = ((ltp - lowPrice) / (high - lowPrice)) * 100;
  const isUpDay = ltp >= currentDayOpen; // true if up day or flat

  if (!isUpDay) {
    barClosingStrength = ((high - ltp) / (high - lowPrice)) * 100;
  }

  const threshold = currentDayOpen * 0.99;
  const instrumentStats = stats[instrumentKey] || {};
  const { lastPrice, avgVolume21d, avgValueVolume21d } = instrumentStats;

  const avgVolume = avgVolume21d;
  const previousDayClose = lastPrice;
  const gapPercentage = ((currentDayOpen - previousDayClose) / previousDayClose) * 100;
  const intradayChangePercentage = ((ltp - currentDayOpen) / currentDayOpen) * 100;

  // User requested summation of changePercentage (intraday) and gapUp percentage
  const changePercentage = intradayChangePercentage + gapPercentage;

  // Calculate price change
  const priceChange = ltp - previousDayClose;

  const maxAlloc = context.maxAllocation || 15;
  let allocation;
  if (ltp > currentDayOpen) {
    allocation = calculateAllocationIntent(maxAlloc, size, ltp, currentDayOpen, riskOfPortfolio);
  } else {
    // Fallback for down days: Use 1% SL to calculate quantity
    const fallbackSL = ltp * 0.99;
    const fallbackAllocation = calculateAllocationIntent(maxAlloc, size, ltp, fallbackSL, riskOfPortfolio);
    allocation = {
      ...fallbackAllocation,
      maxAllocationPercentage: "-",
      riskRewardRatio: "-",
      allocationSuggestions: [],
    };
  }

  return {
    scriptName,
    symbol,
    avgVolume,
    instrumentKey,
    relativeVolumePercentage: ((currentVolume / parseFloat(avgVolume)) * 100).toFixed(2),
    gapPercentage: gapPercentage.toFixed(2),
    strongStart: lowPrice >= threshold,
    ltp: ltp,
    sl: currentDayOpen,
    barClosingStrength: Math.round(barClosingStrength),
    isUpDay,
    changePercentage: changePercentage.toFixed(2),
    priceChange: priceChange,
    avgValueVolume21d,
    currentMinuteVolume,
    currentDayOpen,
    ...allocation,
    trendIntensity,
  };
};
