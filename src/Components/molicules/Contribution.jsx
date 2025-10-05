import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ContributionCalendar } from 'react-contribution-calendar';

const token = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

const PlContributionCalendar = () => {
  const [calendarData, setCalendarData] = useState([]);
  const [error, setError] = useState(null);

  const formatDate = (dmy) => {
    const [d, m, y] = dmy.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };

  const formatDateForApi = (date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  useEffect(() => {
    const fetchPLData = async () => {
      try {
        const financialYearStart = new Date('2025-04-01');
        const financialYearEnd = new Date('2026-03-31');

        const today = new Date();

        // Clamp 'today' inside financial year range:
        const toDateClamped = today > financialYearEnd ? financialYearEnd : today;

        // Calculate fromDate candidate 1 year ago from today
        const fromDateCandidate = new Date(toDateClamped);
        fromDateCandidate.setFullYear(fromDateCandidate.getFullYear() - 1);

        // Clamp from_date inside financial year
        const fromDateClamped =
          fromDateCandidate < financialYearStart ? financialYearStart : fromDateCandidate;

        const from_date = formatDateForApi(fromDateClamped);
        const to_date = formatDateForApi(toDateClamped);

        const url = `https://api.upstox.com/v2/trade/profit-loss/data?from_date=${from_date}&to_date=${to_date}&segment=EQ&financial_year=2526&page_number=1&page_size=1000`;

        const response = await axios.get(url, {
          headers: {
            Authorization: 'Bearer ' + token,
            Accept: 'application/json',
          },
        });

        if (response.data.status !== 'success') {
          setError('API returned error status');
          return;
        }

        const trades = response.data.data || [];

        const data = trades.map((trade) => {
          const sellDate = formatDate(trade.sell_date);
          const pl = (trade.sell_average - trade.buy_average) * trade.quantity;

          let level = 0;
          if (pl < 0) level = 1;
          else if (pl < 50) level = 2;
          else if (pl < 150) level = 3;
          else level = 4;

          return {
            [sellDate]: {
              level,
              data: {
                pl,
                scrip: trade.scrip_name,
              },
            },
          };
        });

        setCalendarData(data);
      } catch (err) {
        console.error('Error fetching P/L data:', err);
        setError('Failed to fetch data');
      }
    };

    fetchPLData();
  }, []);

  const customTheme = {
    level0: '#ebedf0',
    level1: '#ff0000',
    level2: '#9be9a8',
    level3: '#40c463',
    level4: '#216e39',
  };

  const today = new Date();
  const financialYearStart = new Date('2025-04-01');
  const financialYearEnd = new Date('2026-03-31');
  const toDateClamped = today > financialYearEnd ? financialYearEnd : today;
  const fromDateCandidate = new Date(toDateClamped);
  fromDateCandidate.setFullYear(fromDateCandidate.getFullYear() - 1);
  const fromDateClamped =
    fromDateCandidate < financialYearStart ? financialYearStart : fromDateCandidate;

  return (
    <div>
      <h3>Trade P/L Contribution Calendar (Last 1 Year, FY 2526)</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <ContributionCalendar
        data={calendarData}
        dateOptions={{
          start: fromDateClamped.toISOString().split('T')[0],
          end: toDateClamped.toISOString().split('T')[0],
          daysOfTheWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          startsOnSunday: true,
          includeBoundary: true,
        }}
        styleOptions={{
          theme: customTheme,
          cx: 15,
          cy: 15,
          cr: 3,
        }}
        visibilityOptions={{
          hideDescription: false,
          hideMonthLabels: false,
          hideDayLabels: false,
        }}
        onCellClick={(e, data) => {
          const date = Object.keys(data)[0];
          const info = data[date].data;
          alert(`Date: ${date}\nScrip: ${info.scrip}\nP/L: ₹${info.pl.toFixed(2)}`);
        }}
        scroll={false}
      />
    </div>
  );
};

export default PlContributionCalendar;
