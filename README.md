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

1.  [ Func ] - Host the application in S3 for scalable and cost-effective deployment.
2.  [ Func ] - Implement OAuth for secure user authentication.
3.  [ UI ] - Enhance the UI/UX with a custom theme and improved design.
4.  [ Func ] - Enable GTT (Good Till Triggered) order placement functionality.
5.  [ Func ] - Implement automatic refreshing of stock quotes.
6.  [ Func ] - Develop a mobile application for the dashboard.
7.  [ Func ] - Implement portfolio tracking functionality.
8.  [ Func ] - Right now r/r always show 1 : 4 because of 0.25% of static risk, risk is dynamic based on the day low or else static risk sl, recommendation need to be done.
9.  [ Func ] - Strong start right now not consider the gap-up openings.
10. [ Func ] - Need to create a flow's where multiple entries within a zone 3-5% price.
11. [ Func ] - Staggered sl flow's.
12. [ UI ] - Spinner for fetching live data.
13. [ UI ] - Sorting for Rel/vol and other computed fields.
14. [ UI ] - Search for script name.
15. [ Func ] - Volume run rate.
16. [ Func ] - Create notes for scripts.
    1.  On anticipation buy day, could not place orders due to r/r for 0.25% risk - make the risk higher and could have placed the orders
17. [ UI ] - Added column preferences.
18. [ UI ] - Add custom filters.
19. [ UI ] - Add priority sections.
20. [ UI ] - Search instruments and add to dashboard
21. [ Func ] - Add dynamic stop-loss preference like day opening and risk amount
22. [ UI ] - Order detail page
23. [ Func ] - Multi Risk based allocation suggestions in order detail page.
24. [ Func ] - Guards to protect from account blow.
25. [ Func ] - Equity curve dashboard.
    1.  Batting average
    2.  Avg gain 
    3.  Avg loss
26. [ Func ] - Alerts.
27. [ Bug ] - Mismatch in order detail allocation need to consider the maxAllocation in it.
28. [ Bug ] - Order details is always static upon the scroll.
29. [ Bug ] - Scripts page
    1.  Track not working on first go.
    2.  Inconsistency for some scripts ie: SEQUENT, HPL.
30. [ Func ] - Since the zerodha/upstoxs both supports for multiple instrument quote API upto 500, take the daily dump of the instruments
31. [ Func ] - Build a monorepo to join react + node + aws
32. [ Func ] - Add a todo dashboard with checklist/routines
33. [ Func ] - Cache the historical data API call for every live feed
34. [ Func ] - Create dashboard for each watchlist
35. [ Func ] - Enable the scripts to be added a watchlish
36. [ Ref ] - Considered time series in MongoDB
37. [ Func ] - Visualize the no.of gapup in the market intraday metrics
38. [ Func ] - Add persistant bullish/bearish MB in local storage with date as a property
39. [ Func ] - Create snapshot component over tables and graph
40. [ Func ] - Try to present the +-4% in MB table.
41. [ Func ] - Track the price where the alert came in MB, track no.of.stocks which came in the alert as EOD report
42. [ Func ] - Add persistant notification when the stock entered the MBB and at what price and time.
43. [ Func ] - Use multiple tabs for ipo/nifty50/niftymidsmall400 and have active ws connection according to that tab
44. [ Func ] - Introduce dollar volume breakout scan with BMB - https://stockbee.blogspot.com/2009/08/what-is-dollar-volume-and-why-it-is.html
45. [ Func ] - Add live metric volume * currentPrice to see dollar price volume 
46. [ Func ] - Add a filter to see specific stock in a watchlist table.
47. [ Func ] - List down the study point
    1.  What type of gap should we look into small gaps/ big gaps
    2.  Holding periods
    3.  Entry tactics
    4.  How many days the move is holding
    5.  Move started from which leg
    6.  BO volume in large consolidation vs low consolidation