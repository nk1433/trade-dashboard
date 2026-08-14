export const createTurnoverStudy = (PineJS) => {
    return {
        name: "Turnover",
        metainfo: {
            _metainfoVersion: 51,
            id: "Turnover@tv-basicstudies-1",
            name: "Turnover (Cr)",
            description: "Turnover (Cr)",       // TV uses this for createStudy() lookup
            shortDescription: "Turnover (Cr)",
            is_hidden_study: false,
            is_price_study: true,               // Overlay on main pane — no separate scale/pane
            isCustomIndicator: true,
            plots: [{ id: "plot_0", type: "line" }],

            // Top-level styles metainfo — required for the settings dialog to render correctly
            styles: {
                plot_0: {
                    title: "Turnover (Cr)",
                    histogramBase: 0,
                }
            },

            defaults: {
                precision: 2,
                styles: {
                    plot_0: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 0,        // line
                        transparency: 100,  // Fully transparent = invisible on chart
                        visible: true,      // Must be true so the value appears in the legend
                        color: "#2196F3"
                    }
                },
                inputs: {}
            },
            inputs: [],
            format: {
                type: "price",
                precision: 2,
            },
        },
        constructor: function () {
            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;
            };

            this.main = function (context, inputCallback) {
                try {
                    this._context = context;
                    this._input = inputCallback;

                    var close = PineJS.Std.close(this._context);
                    var volume = PineJS.Std.volume(this._context);

                    if (
                        close !== undefined && volume !== undefined &&
                        !isNaN(close) && !isNaN(volume) &&
                        close > 0 && volume > 0
                    ) {
                        const turnover = (close * volume) / 10000000; // In Crores
                        return [isFinite(turnover) ? turnover : NaN];
                    }
                    return [NaN];
                } catch (e) {
                    return [NaN];
                }
            };
        }
    };
};
