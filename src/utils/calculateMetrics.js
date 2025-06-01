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

  const sharesAllowedByRisk = Math.floor(riskAmount / lossPerShare);
  const sharesAllowedByInvestment = Math.floor(maxInvestment / entryPrice);
  const sharesToBuy = Math.min(sharesAllowedByRisk, sharesAllowedByInvestment);
  const maxShareToBuy = Math.max(sharesAllowedByRisk, sharesAllowedByInvestment);

  const investmentAmount = sharesToBuy * entryPrice;
  const lossInMoney = sharesToBuy * lossPerShare;
  const actualAllocationPercentage = (investmentAmount / maxInvestment) * 100;
  const rewardPerShare = entryPrice * 0.10;
  const riskRewardRatio = rewardPerShare / lossPerShare;
  const maxAllocationWithRisk = sharesAllowedByRisk * entryPrice;
  const maxAllocationPercentage = (maxAllocationWithRisk / portfolioSize) * 100;

  return {
    sharesToBuy,
    maxShareToBuy,
    maxAllocationWithRisk: maxAllocationWithRisk.toFixed(2),
    maxAllocationPercentage: maxAllocationPercentage.toFixed(2) + " %",
    intentInvestment: maxInvestment.toFixed(2),
    investmentAmount: investmentAmount.toFixed(2),
    actualAllocationPercentage: actualAllocationPercentage.toFixed(2) + " %",
    riskAmount: riskAmount.toFixed(2),
    lossPerShare: lossPerShare.toFixed(2),
    riskRewardRatio: riskRewardRatio.toFixed(2),
    lossInMoney: lossInMoney.toFixed(2),
    rewardPerShare: rewardPerShare.toFixed(2),
  };
};

