/**
 * Factory function to create a Momentum Burst custom study.
 * Indicators:
 * - Green Dot below bar if Close is >= Threshold% from previous close.
 * - Red Dot below bar if Close is <= -Threshold% from previous close.
 * - Configurable Size (Tiny, Small) via Inputs.
 * - Shared Color Configuration via Palettes.
 */
export const createMomentumBurstStudy = (PineJS) => {
    // Configuration for sizes (order matters for Inputs index mapping)
    const sizes = ["tiny", "small"];
    const commonStyle = {
        visible: true,
        plottype: "shape_circle",
        location: "BelowBar"
    };

    const plots = [];
    const styles = {};
    const stylesMeta = {};

    sizes.forEach((size, i) => {
        // Up Plot (Even indices: 0, 2...)
        const upId = `plot_${i * 2}`;
        plots.push({ id: upId, type: "shapes", palette: "palette_0" });
        styles[upId] = { ...commonStyle, size: size };
        stylesMeta[upId] = { title: `Bullish (${size})`, ...commonStyle, size: size };

        // Down Plot (Odd indices: 1, 3...)
        const downId = `plot_${i * 2 + 1}`;
        plots.push({ id: downId, type: "shapes", palette: "palette_1" });
        styles[downId] = { ...commonStyle, size: size };
        stylesMeta[downId] = { title: `Bearish (${size})`, ...commonStyle, size: size };
    });

    return {
        name: "Momentum Burst",
        metainfo: {
            _metainfoVersion: 51,
            id: "MomentumBurst@tv-basicstudies-1",
            name: "Momentum Burst",
            description: "Momentum Burst (Configurable)",
            shortDescription: "MomBurst",
            is_price_study: true,
            isCustomIndicator: true,
            // linkedToSeries: true, // Removed as per Mondays reference
            plots: plots,
            palettes: {
                palette_0: {
                    colors: [{ name: "Bullish Burst" }],
                    valToIndex: { 1: 0 }
                },
                palette_1: {
                    colors: [{ name: "Bearish Burst" }],
                    valToIndex: { 1: 0 }
                }
            },
            defaults: {
                styles: styles,
                palettes: {
                    palette_0: { colors: [{ color: "#00E676" }] },
                    palette_1: { colors: [{ color: "#FF5252" }] }
                },
                precision: 2,
                inputs: {
                    in_0: 4,
                    in_1: "Small"
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
                },
                {
                    id: "in_1",
                    name: "Dot Size",
                    defval: "Small",
                    type: "text",
                    options: ["Tiny", "Small"]
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
            };

            this.main = function (context, inputCallback) {
                try {
                    this._context = context;
                    this._input = inputCallback;

                    const index = this._context.symbol.index;
                    const close = PineJS.Std.close(this._context);
                    const vol = PineJS.Std.volume(this._context);

                    this._closes[index] = close;
                    this._volumes[index] = vol;

                    // Return 4 NaNs (2 sizes * 2 plots)
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

                    const sizeVal = this._input(1);
                    const size = (sizeVal && typeof sizeVal === 'string') ? sizeVal : "Small";

                    // Helper maps input string to index offset
                    let offset = 2; // Default Small (plots 2, 3)
                    if (size === "Tiny") offset = 0;
                    else if (size === "Small") offset = 2;

                    // Debug Log
                    // console.log(`MB Debug - Idx:${index} C:${close} pC:${prevClose} V:${vol} pV:${prevVol} Chg:${(change * 100).toFixed(2)}% Thresh:${threshold}`);

                    // Criteria:
                    // Bullish: c/c1 >= 1.04 (change >= 4%) AND v > v1 AND v >= 100k
                    // Bearish: c/c1 <= 0.96 (change <= -4%) AND v > v1 AND v >= 100k
                    const upBurst = (change >= thresholdPct && vol > prevVol && vol >= 100000) ? 1 : NaN;
                    const downBurst = (change <= -thresholdPct && vol >= 100000) ? 1 : NaN;

                    const res = [NaN, NaN, NaN, NaN];

                    if (!isNaN(upBurst)) {
                        res[offset] = 1;
                        // console.log(`MB Study: BULLISH BURST! Index:${index} Change:${(change*100).toFixed(2)}% > ${threshold}% (${size})`);
                    }
                    if (!isNaN(downBurst)) {
                        res[offset + 1] = 1;
                        // console.log(`MB Study: BEARISH BURST! Index:${index} Change:${(change*100).toFixed(2)}% < -${threshold}% (${size})`);
                    }

                    return res;
                } catch (e) {
                    console.error("MB Study Error:", e);
                    return [NaN, NaN, NaN, NaN];
                }
            };
        }
    };
};
