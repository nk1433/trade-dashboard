import React from 'react';
import { useYScale, useXScale } from '@mui/x-charts/hooks';
import { useTheme } from '@mui/material/styles';

const BreadthDifference = ({ data, upKey, downKey }) => {
    const xScale = useXScale();
    const yScale = useYScale();
    const theme = useTheme();

    if (!xScale || !yScale || data.length === 0) {
        return null;
    }

    let positivePath = "";
    let negativePath = "";

    for (let i = 0; i < data.length - 1; i++) {
        const curr = data[i];
        const next = data[i + 1];

        // Access raw values
        const x1Val = new Date(curr.date); // Provided logic sorts by date, ensure this matches xScale domain input
        const x2Val = new Date(next.date); // xScale type is likely 'point' (index) or 'time'. 
        // In CombinedChart, we passed formatted strings "DD/MM/YY" to xScale data.
        // xScale expects the same domain values passed to xAxis data.
        // In CombinedChart: xAxis data = dates (strings).
        // So xScale calls should essentially use indices or the string values?
        // @mui/x-charts line chart with 'point' scale uses indices or the provided categories.
        // If scaleType='point', scale(value) might assume value is existing in data.
        // Actually, for 'point' scale, it's safer to use the index if we know it.
        // But xScale maps domain value -> pixel.
        // Let's rely on the fact that we passed `dates` array to xAxis.

        // ISSUE: We need to know valid inputs for xScale.
        // In CombinedChart, we calculate `dates` array string formatted.
        // We will assume `xScale` maps these strings.
        // But iterating 'data' gives us raw objects. We need the formatted string keys.

        // Wait, cleaner approach:
        // We can just loop indices 0 to length-1 and map `xScale(dates[i])`? 
        // But `dates` is derived in parent.
        // Better: pass the calculated `dates` array to this component or derive it identically.
        // Let's pass `formattedDates` prop.

        // Actually, let's assume `xScale` takes the index if we provided `data` to xAxis?
        // No, `scaleType: 'point'` with `data: [...]` usually maps the values in `data`.
        // Let's update CombinedChart to pass the exact X-axis data values used.

        // Placeholder for logic assuming we resolve x1/x2 correctly below...
    }

    // Let's restart the loop logic with proper args
    // We will accept `dates` prop which matches xAxis data.
    return null;
};

// Real Implementation below
export const BreadthDifferenceImpl = ({ data, upKey, downKey, dates }) => {
    const xScale = useXScale();
    const yScale = useYScale();

    if (!xScale || !yScale || data.length < 2) {
        return null;
    }

    let posD = "";
    let negD = "";

    // Helper to format point
    const pt = (x, y) => `${x.toFixed(1)},${y.toFixed(1)}`;

    for (let i = 0; i < data.length - 1; i++) {
        const curr = data[i];
        const next = data[i + 1];

        const u1 = curr[upKey];
        const d1 = Math.abs(curr[downKey]);
        const u2 = next[upKey];
        const d2 = Math.abs(next[downKey]);

        // X coordinates
        // If scaleType is 'point', xScale might take the category string.
        const x1Str = dates[i];
        const x2Str = dates[i + 1];
        const x1 = xScale(x1Str);
        const x2 = xScale(x2Str);

        // Y coordinates
        const yu1 = yScale(u1);
        const yd1 = yScale(d1);
        const yu2 = yScale(u2);
        const yd2 = yScale(d2);

        // Check for undefined (if scale not ready)
        if (x1 === undefined || x2 === undefined || yu1 === undefined || yd1 === undefined) continue;

        // Intersection Math
        // We have two lines:
        // Line U: (x1, yu1) -> (x2, yu2)
        // Line D: (x1, yd1) -> (x2, yd2)
        // Note: Pixel Y increases DOWNWARD. Higher Value = Lower Y Pixel.
        // "Up > Down" (Value) means "yu < yd" (Pixel).

        // Value diffs
        const diff1 = u1 - d1; // >0 means Up is higher val (top visual)
        const diff2 = u2 - d2;

        // If signs are different, they cross
        const crossed = (diff1 > 0 && diff2 < 0) || (diff1 < 0 && diff2 > 0);

        if (crossed) {
            // Calculate intersection factor t (0..1)
            // ValU(t) = u1 + t(u2-u1)
            // ValD(t) = d1 + t(d2-d1)
            // u1 + t*du = d1 + t*dd
            // t*(du - dd) = d1 - u1
            // t = (d1 - u1) / (du - dd - (u2-u1) + (d2-d1) ?? No
            // t = (d1 - u1) / ( (u2-u1) - (d2-d1) )

            const du = u2 - u1;
            const dd = d2 - d1;
            const t = (d1 - u1) / (du - dd);

            const xInt = x1 + t * (x2 - x1);
            // Calculate Y at intersection (should be same for both) using scale or val
            // Let's use val then scale for accuracy
            const valInt = u1 + t * du;
            const yInt = yScale(valInt);

            // Segment 1 (Left of cross)
            if (diff1 > 0) {
                // Up > Down (Positive Area)
                // Poly: x1,yu1 -> xInt,yInt -> x1,yd1 -> close
                posD += ` M ${pt(x1, yu1)} L ${pt(xInt, yInt)} L ${pt(x1, yd1)} Z`;
            } else {
                // Down > Up (Negative Area)
                negD += ` M ${pt(x1, yd1)} L ${pt(xInt, yInt)} L ${pt(x1, yu1)} Z`;
            }

            // Segment 2 (Right of cross)
            if (diff2 > 0) {
                // Up > Down (Positive Area) aka u2 > d2
                // Poly: x2,yu2 -> xInt,yInt -> x2,yd2 -> close
                posD += ` M ${pt(x2, yu2)} L ${pt(x2, yd2)} L ${pt(xInt, yInt)} Z`;
            } else {
                // Down > Up
                negD += ` M ${pt(x2, yd2)} L ${pt(x2, yu2)} L ${pt(xInt, yInt)} Z`;
            }

        } else {
            // No crossing
            // Quad: (x1, yu1) -> (x2, yu2) -> (x2, yd2) -> (x1, yd1)
            const cmd = ` M ${pt(x1, yu1)} L ${pt(x2, yu2)} L ${pt(x2, yd2)} L ${pt(x1, yd1)} Z`;

            if (diff1 > 0 || (diff1 === 0 && diff2 > 0) || (diff2 === 0 && diff1 > 0)) {
                // Positive (Up on top)
                posD += cmd;
            } else {
                // Negative (Down on top)
                negD += cmd;
            }
        }
    }

    return (
        <g pointerEvents="none">
            <path d={posD} fill="#000000" fillOpacity={0.3} />
            <path d={negD} fill="#9e9e9e" fillOpacity={0.3} />
        </g>
    );
};

export default BreadthDifferenceImpl;
