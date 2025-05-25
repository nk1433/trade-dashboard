# Stock Allocation Dashboard

## Overview

This web application analyzes and plans stock allocations using real-time market data, user-defined risk parameters, and technical indicators. By fetching live quotes from the Upstoxs API, it empowers users to calculate optimal allocations (10%, 25%, and 40%) based on their portfolio size and risk tolerance.

## Current Features

The dashboard currently displays the following information for a given list of scripts:

* **Script:** The stock ticker symbol.
* **LTP (Last Traded Price):** Real-time price fetched from Upstoxs.
* **SL (Stop Loss):** Calculated stop-loss price based on a dynamic percentage of the entry price, determined by the user's risk percentage.
* **R/R (Risk/Reward Ratio):** Calculated ratio based on a potential 10% gain from the LTP.
* **% / ₹:** User-defined risk percentage and the corresponding risk amount for the entire portfolio.
* **Re-Vol%/ M:** Relative volume percentage of the current day compared to the average volume over the last month.
* **Allocations:** Detailed analysis for 10%, 25%, and 40% portfolio allocations, including:
    * Allocation possibility within the defined risk ("Yes" or "No").
    * Number of shares to acquire.
    * Allocation amount as a percentage of the portfolio.
    * Potential risk amount in rupees.
* **Strong Start:** Indicates if the stock's low price for the day has stayed within 1% of its opening price ("Yes" or "No").
* **Avg Volume:** Average trading volume of the script over the past month.

## Future Enhancements

The following enhancements are planned:

1.  Host the application in S3 for scalable and cost-effective deployment.
2.  Implement OAuth for secure user authentication.
3.  Enhance the UI/UX with a custom theme and improved design.
4.  Enable GTT (Good Till Triggered) order placement functionality.
5.  Implement automatic refreshing of stock quotes.
6.  Develop a mobile application for the dashboard.
7.  Implement portfolio tracking functionality.
8.  Right now r/r always show 1 : 4 because of 0.25% of static risk, risk is dynamic based on the day low or else static risk sl, recommendation need to be done.
9.  Strong start right now not consider the gap-up openings.
10. Need to create a flow's where multiple entries within a zone 3-5% price.
11. Staggered sl flow's.