import React, { useState } from "react";
import { TextField, Button, Typography, Box } from "@mui/material";
import { calculateAllocationIntent } from "../../utils/calculateMetrics";
import { useSelector } from "react-redux";

const AllocationIntentForm = () => {
    const [portfolioPercentage, setPortfolioPercentage] = useState(15);
    const { portfolioSize, riskPercentage: riskPer } = useSelector((state) => state.portfolio);
    const [pfSize, setPfSize] = useState(portfolioSize);
    const [entryPrice, setEntryPrice] = useState(0);
    const [exitPrice, setExitPrice] = useState(0);
    const [riskPercentage, setRiskPercentage] = useState(riskPer);
    const [results, setResults] = useState(null);

    const handleSubmit = () => {
        const insights = calculateAllocationIntent(
            portfolioPercentage,
            pfSize,
            entryPrice,
            exitPrice,
            riskPercentage
        );
        setResults(insights);
    };

    return (
        <>
            <Typography variant="h4" gutterBottom sx={{ textAlign: "center" }}>
                Allocation Intent Calculator
            </Typography>
            <Box sx={{ padding: "20px", margin: "auto", width: "100%", display: "column", flexDirection: "row", justifyContent: "space-between" }}>
                <Box sx={{ ...results || { flexGrow: 1 }, padding: "20px" }}>
                    <form onSubmit={(e) => e.preventDefault()}>
                        <TextField
                            label="Portfolio Percentage"
                            type="number"
                            value={portfolioPercentage}
                            onChange={(e) => setPortfolioPercentage(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Portfolio Size"
                            type="number"
                            value={pfSize}
                            onChange={(e) => setPfSize(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Entry Price"
                            type="number"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Exit Price"
                            type="number"
                            value={exitPrice}
                            onChange={(e) => setExitPrice(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Risk Percentage"
                            type="number"
                            value={riskPercentage}
                            onChange={(e) => setRiskPercentage(e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                        <Button type="submit" variant="contained" color="primary" fullWidth onClick={handleSubmit}>
                            Calculate
                        </Button>
                    </form>
                </Box>
                {
                    results && (
                        <Box sx={{ flexGrow: 1, padding: "20px" }}>
                            {(
                                <Box sx={{ marginTop: "20px" }}>
                                    {results.error ? (
                                        <Typography color="error">{results.error}</Typography>
                                    ) : (
                                        <div>
                                            <Typography>Risk-Reward Ratio: {results.riskRewardRatio}</Typography>
                                            <Typography>Shares to Buy: {results.sharesToBuy}</Typography>
                                            <Typography>
                                                Actual Allocation Percentage: {results.actualAllocationPercentage}
                                            </Typography>
                                            <Typography>
                                                Max Allocation with Risk: INR {results.maxAllocationWithRisk}
                                            </Typography>
                                            <Typography>Max Shares to Buy: {results.maxShareToBuy}</Typography>
                                            <Typography>Max Allocation Percentage: {results.maxAllocationPercentage}</Typography>
                                            <Typography>Intent Investment: INR {results.intentInvestment}</Typography>
                                            <Typography>Investment Amount: INR {results.investmentAmount}</Typography>
                                            <Typography>Risk Amount: INR {results.riskAmount}</Typography>
                                            <Typography>Loss Per Share: INR {results.lossPerShare}</Typography>
                                            <Typography>Loss in Money: INR {results.lossInMoney}</Typography>
                                            <Typography>Reward Per Share: INR {results.rewardPerShare}</Typography>
                                        </div>
                                    )}
                                </Box>
                            )}
                        </Box>
                    )
                }
            </Box>
        </>
    );
};

export default AllocationIntentForm;
