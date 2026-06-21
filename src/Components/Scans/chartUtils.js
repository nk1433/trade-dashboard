export const groupScansByTimeframe = (scans, timeframeMinutes) => {
    if (!scans || scans.length === 0) return [];

    const groupedData = {};

    // Get the date string for the scans (assuming all scans are for the same date)
    // We'll use the first scan's date to establish the market open/close boundaries.
    const referenceDate = new Date(scans[0].createdAt);
    
    // Create Market Open (09:15) and Market Close (15:30) for the reference date
    const marketOpen = new Date(referenceDate);
    marketOpen.setHours(9, 15, 0, 0);
    
    const marketClose = new Date(referenceDate);
    marketClose.setHours(15, 30, 0, 0);

    const getChartTime = (dateObj) => {
        // Shift by local timezone offset so it displays correctly in Lightweight Charts
        return Math.floor(dateObj.getTime() / 1000) - (dateObj.getTimezoneOffset() * 60);
    };

    scans.forEach(scan => {
        const dateObj = new Date(scan.createdAt);
        if (isNaN(dateObj.getTime())) return; 
        
        // Round down to nearest timeframe
        const minutes = dateObj.getMinutes();
        const roundedMinutes = Math.floor(minutes / timeframeMinutes) * timeframeMinutes;
        
        // Create new date for the start of the bin
        const binDate = new Date(dateObj);
        binDate.setMinutes(roundedMinutes);
        binDate.setSeconds(0);
        binDate.setMilliseconds(0);

        const timeKey = getChartTime(binDate);

        if (!groupedData[timeKey]) {
            groupedData[timeKey] = {
                time: timeKey,
                up4Percent: 0,
                down4Percent: 0,
                upSltb: 0,
                downSltb: 0,
                upDollar: 0,
                downDollar: 0,
                newHigh: 0
            };
        }

        switch (scan.scanType) {
            case '4PercentBO': groupedData[timeKey].up4Percent += 1; break;
            case '4PercentBD': groupedData[timeKey].down4Percent += 1; break;
            case 'sltbBO': groupedData[timeKey].upSltb += 1; break;
            case 'sltbBD': groupedData[timeKey].downSltb += 1; break;
            case 'dollarBO': groupedData[timeKey].upDollar += 1; break;
            case 'dollarBD': groupedData[timeKey].downDollar += 1; break;
            case 'newHigh': groupedData[timeKey].newHigh += 1; break;
            default: break;
        }
    });

    // We want to fill all bins from 09:15 to 15:30 (or to the latest scan if it's past 15:30)
    // Find the latest time either from scans or market close
    const maxScanTime = Math.max(...Object.keys(groupedData).map(Number));
    const closeTimeKey = getChartTime(marketClose);
    const endTime = Math.max(maxScanTime, closeTimeKey);
    
    // Start from market open (09:15) or earliest scan if it's before 09:15
    const minScanTime = Math.min(...Object.keys(groupedData).map(Number));
    const openTimeKey = getChartTime(marketOpen);
    let currentTime = Math.min(minScanTime, openTimeKey);

    const filledResult = [];
    const intervalSeconds = timeframeMinutes * 60;

    while (currentTime <= endTime) {
        if (groupedData[currentTime]) {
            filledResult.push(groupedData[currentTime]);
        } else {
            filledResult.push({
                time: currentTime,
                up4Percent: 0,
                down4Percent: 0,
                upSltb: 0,
                downSltb: 0,
                upDollar: 0,
                downDollar: 0,
                newHigh: 0
            });
        }
        currentTime += intervalSeconds;
    }

    return filledResult;
};
