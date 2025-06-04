import { useSelector } from "react-redux";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
} from "@mui/material";
import _ from "lodash";
import positions from "../../config/closedPosition.json";

const ClosedPositions = () => {
    const portfolioSize = useSelector((state) => state.portfolio.portfolioSize);

    // Extract the positions from the new data structure and filter for "closed" positions
    const closedPositions = Object.entries(positions)
        .filter(([, value]) => value['Realised P&L'] !== undefined)
        .map(([key, value]) => ({
            symbol: key,
            quantity: value.Quantity,
            entry: value['Buy price'],
            exit: value['Sell price'],
            amountGainLoss: value['Realised P&L'],
            percentageGainLoss: ((value['Realised P&L'] / portfolioSize) * 100).toFixed(2),
        }));

    // Group positions by symbol (for aggregated data)
    const groupedPositions = _.groupBy(closedPositions, (pos) => pos.symbol);
    const aggregatedData = Object.entries(groupedPositions).map(([symbol, group]) => {
        const totalShares = _.sumBy(group, "quantity");
        const weightedExit = _.sumBy(group, (pos) => pos.exit * pos.quantity) / totalShares;
        const entryPrice = group[0].entry;
        const totalAmountGainLoss = totalShares * (weightedExit - entryPrice);
        const percentageGainLoss = ((totalAmountGainLoss / portfolioSize) * 100).toFixed(2);

        return {
            name: symbol,
            shares: totalShares,
            entry: entryPrice,
            exit: weightedExit,
            amountGainLoss: totalAmountGainLoss,
            percentageGainLoss: `${percentageGainLoss}%`,
        };
    });

    // Aggregate statistics
    const totalTrades = aggregatedData.length;
    const totalProfitAndLoss = aggregatedData.reduce((acc, pos) => acc + pos.amountGainLoss, 0);

    const winningTrades = aggregatedData.filter((pos) => pos.exit > pos.entry);
    const losingTrades = aggregatedData.filter((pos) => pos.exit <= pos.entry);

    const totalWinningTrades = winningTrades.length;
    const totalLosingTrades = losingTrades.length;

    const battingAverage =
        totalTrades > 0 ? ((totalWinningTrades / totalTrades) * 100).toFixed(2) : 0;

    const averageWinPercentage =
        totalWinningTrades > 0
            ? (
                winningTrades.reduce(
                    (acc, pos) => acc + ((pos.exit - pos.entry) / pos.entry) * 100,
                    0
                ) / totalWinningTrades
            ).toFixed(2)
            : 0;

    const averageLossPercentage =
        totalLosingTrades > 0
            ? (
                losingTrades.reduce(
                    (acc, pos) => acc + ((pos.exit - pos.entry) / pos.entry) * 100,
                    0
                ) / totalLosingTrades
            ).toFixed(2)
            : 0;

    const averageGainAmount =
        totalWinningTrades > 0
            ? (
                winningTrades.reduce(
                    (acc, pos) => acc + (pos.exit * pos.shares - pos.entry * pos.shares),
                    0
                ) / totalWinningTrades
            ).toFixed(2)
            : 0;

    const averageLossAmount =
        totalLosingTrades > 0
            ? (
                losingTrades.reduce(
                    (acc, pos) => acc + (pos.exit * pos.shares - pos.entry * pos.shares),
                    0
                ) / totalLosingTrades
            ).toFixed(2)
            : 0;

    const winLossRatio =
        averageGainAmount > 0
            ? (averageGainAmount / Math.abs(averageLossAmount)).toFixed(2)
            : "N/A";

    return (
        <div>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Entry Price</TableCell>
                            <TableCell>Exit Price</TableCell>
                            <TableCell>Amount Gain/Loss (₹)</TableCell>
                            <TableCell>Percentage Gain/Loss (%)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {aggregatedData.map((pos, index) => {
                            const gainLoss = pos.shares * (pos.exit - pos.entry);
                            const gainLossPercentage = ((gainLoss / portfolioSize) * 100).toFixed(2);

                            return (
                                <TableRow key={index}>
                                    <TableCell>{pos.name}</TableCell>
                                    <TableCell>{pos.entry}</TableCell>
                                    <TableCell>{pos.exit}</TableCell>
                                    <TableCell
                                        style={{
                                            color: gainLoss >= 0 ? "green" : "red",
                                        }}
                                    >
                                        {gainLoss.toFixed(2)}
                                    </TableCell>
                                    <TableCell
                                        style={{
                                            color: gainLoss >= 0 ? "green" : "red",
                                        }}
                                    >
                                        {gainLossPercentage}%
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <div style={{ marginTop: "20px" }}>
                <Typography>
                    Overall Profit and Loss: ₹{totalProfitAndLoss.toFixed(2)}
                </Typography>
                <Typography>Total Trades: {totalTrades}</Typography>
                <Typography>Total Winning Trades: {totalWinningTrades}</Typography>
                <Typography>Total Losing Trades: {totalLosingTrades}</Typography>
                <Typography>Batting Average: {battingAverage}%</Typography>
                <Typography>Average Win Percentage: {averageWinPercentage}%</Typography>
                <Typography>Average Loss Percentage: {averageLossPercentage}%</Typography>
                <Typography>Average Gain Amount: ₹{averageGainAmount}</Typography>
                <Typography>Average Loss Amount: ₹{averageLossAmount}</Typography>
                <Typography>
                    Ratio of Average Win Percentage to Average Loss Percentage: {winLossRatio}
                </Typography>
            </div>
        </div>
    );
};

export default ClosedPositions;
