/**
 * Factory function to create a Momentum Burst custom study.
 * Indicators:
 * - Green Dot below bar if Close is >= Threshold% from previous close.
 * - Red Dot below bar if Close is <= -Threshold% from previous close.
 * - SLTB Bullish and Bearish dots.
 * - Shared Color Configuration via Palettes.
 */
export const createMomentumBurstStudy = (PineJS) => {
    const commonStyle = {
        visible: true,
        plottype: "shape_circle",
        location: "BelowBar",
        size: "tiny" // Hardcoded to tiny as per user request
    };

    const plots = [
        { id: "plot_0", type: "shapes", palette: "palette_0" },
        { id: "plot_1", type: "shapes", palette: "palette_1" },
        { id: "plot_2", type: "shapes", palette: "palette_2" },
        { id: "plot_3", type: "shapes", palette: "palette_3" }
    ];

    const styles = {
        plot_0: { ...commonStyle },
        plot_1: { ...commonStyle },
        plot_2: { ...commonStyle },
        plot_3: { ...commonStyle }
    };

    const stylesMeta = {
        plot_0: { title: "MomBurst Bullish", ...commonStyle },
        plot_1: { title: "MomBurst Bearish", ...commonStyle },
        plot_2: { title: "SLTB Bullish", ...commonStyle },
        plot_3: { title: "SLTB Bearish", ...commonStyle }
    };

    return {
        name: "Momentum Burst",
        metainfo: {
            _metainfoVersion: 51,
            id: "MomentumBurst@tv-basicstudies-1",
            name: "Momentum Burst",
            description: "Momentum Burst & SLTB",
            shortDescription: "Stockbee signals",
            is_price_study: true,
            isCustomIndicator: true,
            plots: plots,
            palettes: {
                palette_0: {
                    colors: [{ name: "MomBurst Bullish" }],
                    valToIndex: { 1: 0 }
                },
                palette_1: {
                    colors: [{ name: "MomBurst Bearish" }],
                    valToIndex: { 1: 0 }
                },
                palette_2: {
                    colors: [{ name: "SLTB Bullish" }],
                    valToIndex: { 1: 0 }
                },
                palette_3: {
                    colors: [{ name: "SLTB Bearish" }],
                    valToIndex: { 1: 0 }
                }
            },
            defaults: {
                styles: styles,
                palettes: {
                    palette_0: { colors: [{ color: "#00E676" }] }, // Green
                    palette_1: { colors: [{ color: "#FF5252" }] }, // Red
                    palette_2: { colors: [{ color: "#2962FF" }] }, // Blue
                    palette_3: { colors: [{ color: "#FF6D00" }] }  // Orange
                },
                precision: 2,
                inputs: {
                    in_0: 4
                }
            },
            inputs: [
                {
                    id: "in_0",
                    name: "Threshold (%)",
                    defval: 4,
                    type: "float",
                    min: 0.1,
                    max: 100
                }
            ],
            styles: stylesMeta,
            format: {
                type: "price",
                precision: 2,
            },
        },
        constructor: function () {
            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;
                this._closes = []; // Manual history
                this._volumes = []; // Manual history
                this._opens = [];
                this._highs = [];
                this._lows = [];
            };

            this.main = function (context, inputCallback) {
                try {
                    this._context = context;
                    this._input = inputCallback;

                    const index = this._context.symbol.index;
                    const close = PineJS.Std.close(this._context);
                    const vol = PineJS.Std.volume(this._context);
                    const open = PineJS.Std.open(this._context);
                    const high = PineJS.Std.high(this._context);
                    const low = PineJS.Std.low(this._context);

                    this._closes[index] = close;
                    this._volumes[index] = vol;
                    this._opens[index] = open;
                    this._highs[index] = high;
                    this._lows[index] = low;

                    // Return 4 NaNs for the 4 plots
                    if (isNaN(index) || index < 1) {
                        return [NaN, NaN, NaN, NaN];
                    }

                    const prevClose = this._closes[index - 1];
                    const prevVol = this._volumes[index - 1];

                    // Determine validity of previous data
                    if (prevClose === undefined || isNaN(prevClose) || prevClose === 0 ||
                        prevVol === undefined || isNaN(prevVol)) {
                        return [NaN, NaN, NaN, NaN];
                    }

                    const change = (close - prevClose) / prevClose;

                    // Inputs
                    const thresholdVal = this._input(0);
                    const threshold = (typeof thresholdVal === 'number' && !isNaN(thresholdVal)) ? thresholdVal : 4;
                    const thresholdPct = threshold / 100;

                    // --- SLTB Logic ---
                    let isBullishSLTB = false;
                    let isBearishSLTB = false;

                    if (index >= 200) {
                        const closePrev1 = this._closes[index - 1];
                        const closePrev2 = this._closes[index - 2];
                        const volPrev1 = this._volumes[index - 1];
                        const volPrev2 = this._volumes[index - 2];

                        const minVolume3d = Math.min(vol, volPrev1, volPrev2);

                        let sum7 = 0; for (let i = 0; i < 7; i++) sum7 += this._closes[index - i];
                        const avgClose7d = sum7 / 7;

                        let sum65 = 0; for (let i = 0; i < 65; i++) sum65 += this._closes[index - i];
                        const avgClose65d = sum65 / 65;

                        const trendIntensity = avgClose65d !== 0 ? avgClose7d / avgClose65d : 0;

                        let sum200 = 0; for (let i = 0; i < 200; i++) sum200 += this._closes[index - i];
                        const avgClose200d = sum200 / 200;

                        const isBullishCondition1 = minVolume3d > 100000 &&
                            trendIntensity >= 1.05 &&
                            close > open &&
                            close > closePrev1 &&
                            closePrev1 !== 0 && closePrev2 !== 0 &&
                            (close / closePrev1) > (closePrev1 / closePrev2) &&
                            (closePrev1 / closePrev2) < 1.02 &&
                            closePrev1 > closePrev2;

                        const isBullishCondition2 = minVolume3d > 100000 &&
                            closePrev1 > closePrev2 &&
                            close > open &&
                            close > closePrev1 &&
                            closePrev1 !== 0 && closePrev2 !== 0 &&
                            closePrev1 / closePrev2 < 1.02 &&
                            (close / closePrev1) > (closePrev1 / closePrev2) &&
                            close > avgClose200d &&
                            trendIntensity < 1.05;

                        isBullishSLTB = isBullishCondition1 || isBullishCondition2;

                        isBearishSLTB = closePrev2 !== 0 && closePrev1 !== 0 && high !== low &&
                            closePrev1 / closePrev2 >= 0.98 &&
                            (close / closePrev1) < (closePrev1 / closePrev2) &&
                            close < closePrev1 &&
                            close < open &&
                            minVolume3d >= 300000 &&
                            (close - low) / (high - low) < 0.2;
                    }

                    // --- Momentum Burst Logic ---
                    const upBurst = (change >= thresholdPct && vol > prevVol && vol >= 100000) ? 1 : NaN;
                    const downBurst = (change <= -thresholdPct && vol >= 100000) ? 1 : NaN;

                    const res = [NaN, NaN, NaN, NaN];

                    if (!isNaN(upBurst)) {
                        res[0] = 1;
                    }
                    if (!isNaN(downBurst)) {
                        res[1] = 1;
                    }
                    if (isBullishSLTB) {
                        res[2] = 1;
                    }
                    if (isBearishSLTB) {
                        res[3] = 1;
                    }

                    return res;
                } catch (e) {
                    console.error("MB/SLTB Study Error:", e);
                    return [NaN, NaN, NaN, NaN];
                }
            };
        }
    };
};
