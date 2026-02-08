/**
 * Factory function to create a Trend Intensity 65 (TI65) custom study.
 * Logic:
 * - SMA(Close, 7) / SMA(Close, 65)
 * - Bearish: Ratio < 0.95 (Red Histogram + Top Shape)
 * - Bullish: Ratio > 1.05 (Green Histogram + Bottom Shape)
 * - Sharp Binary 0/1 transition.
 */
export const createTI65Study = (PineJS) => {
    console.log("[TI65] Factory Called");

    // Config
    const BEAR_COLOR = "#FF5252";
    const BULL_COLOR = "#00E676";

    return {
        name: "TI65 Bull/Bear v5",
        metainfo: {
            _metainfoVersion: 51,
            id: "TI65BullBear@tv-basicstudies-5",
            name: "TI65 Bull/Bear v5",
            description: "TI65 Bull/Bear (Binary)",
            shortDescription: "TI65 B/B",
            is_price_study: false,
            isCustomIndicator: true,
            format: {
                type: "volume",
                precision: 0
            },
            plots: [
                { id: "plot_bear_hist", type: "line" },
                { id: "plot_bear_shape", type: "shapes", palette: "palette_bear" },
                { id: "plot_bull_hist", type: "line" },
                { id: "plot_bull_shape", type: "shapes", palette: "palette_bull" }
            ],
            palettes: {
                palette_bear: {
                    colors: [{ name: "Bearish Signal" }],
                    valToIndex: { 1: 0 }
                },
                palette_bull: {
                    colors: [{ name: "Bullish Signal" }],
                    valToIndex: { 1: 0 }
                }
            },
            defaults: {
                styles: {
                    plot_bear_hist: {
                        linestyle: 0,
                        linewidth: 2,
                        plottype: 1, // Histogram
                        transparency: 0,
                        visible: true,
                        color: BEAR_COLOR
                    },
                    plot_bear_shape: {
                        plottype: "shape_circle",
                        location: "Top",
                        visible: true,
                        size: "small"
                    },
                    plot_bull_hist: {
                        linestyle: 0,
                        linewidth: 2,
                        plottype: 1, // Histogram
                        transparency: 0,
                        visible: true,
                        color: BULL_COLOR
                    },
                    plot_bull_shape: {
                        plottype: "shape_circle",
                        location: "Bottom",
                        visible: true,
                        size: "small"
                    }
                },
                palettes: {
                    palette_bear: { colors: [{ color: BEAR_COLOR }] },
                    palette_bull: { colors: [{ color: BULL_COLOR }] }
                },
                precision: 0,
                inputs: {
                    in_short: 7,
                    in_long: 65,
                    in_bear_thresh: 0.95,
                    in_bull_thresh: 1.05
                }
            },
            inputs: [
                {
                    id: "in_short",
                    name: "Short MA Length",
                    defval: 7,
                    type: "integer",
                    min: 1
                },
                {
                    id: "in_long",
                    name: "Long MA Length",
                    defval: 65,
                    type: "integer",
                    min: 1
                },
                {
                    id: "in_bear_thresh",
                    name: "Bearish Threshold (<)",
                    defval: 0.95,
                    type: "float",
                },
                {
                    id: "in_bull_thresh",
                    name: "Bullish Threshold (>)",
                    defval: 1.05,
                    type: "float",
                }
            ],
            styles: {
                plot_bear_hist: { title: "Bearish State", histogramBase: 0 },
                plot_bear_shape: { title: "Bearish Signal", plottype: "shape_circle", location: "Top" },
                plot_bull_hist: { title: "Bullish State", histogramBase: 0 },
                plot_bull_shape: { title: "Bullish Signal", plottype: "shape_circle", location: "Bottom" }
            },
        },
        constructor: function () {
            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;
                this._closes = [];
            };

            this.main = function (context, inputCallback) {
                try {
                    this._context = context;
                    this._input = inputCallback;

                    const index = this._context.symbol.index;
                    const close = PineJS.Std.close(this._context);
                    this._closes[index] = close;

                    if (isNaN(index) || index < 1) {
                        return [NaN, NaN, NaN, NaN];
                    }

                    const shortLen = this._input(0);
                    const longLen = this._input(1);
                    const bearThresh = this._input(2);
                    const bullThresh = this._input(3);

                    const calculateSMA = (len, idx) => {
                        let sum = 0;
                        let count = 0;
                        for (let i = 0; i < len; i++) {
                            const val = this._closes[idx - i];
                            if (val !== undefined && !isNaN(val)) {
                                sum += val;
                                count++;
                            }
                        }
                        return count === len ? sum / len : NaN;
                    };

                    const smaShort = calculateSMA(shortLen, index);
                    const smaLong = calculateSMA(longLen, index);

                    let bearBin = 0;
                    let bearSig = NaN;
                    let bullBin = 0;
                    let bullSig = NaN;

                    if (!isNaN(smaShort) && !isNaN(smaLong) && smaLong !== 0) {
                        const ratio = smaShort / smaLong;

                        // Bearish
                        if (ratio < bearThresh) {
                            bearBin = 1;
                            bearSig = 1;
                        }
                        // Bullish
                        else if (ratio > bullThresh) {
                            bullBin = 1;
                            bullSig = 1;
                        }
                    }

                    // Return array matching plots order: [bear_hist, bear_shape, bull_hist, bull_shape]
                    return [bearBin, bearSig, bullBin, bullSig];

                } catch (e) {
                    console.error("[TI65] Error:", e);
                    return [NaN, NaN, NaN, NaN];
                }
            };
        }
    };
};
