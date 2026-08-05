export const createTurnoverStudy = (PineJS) => {
    return {
        name: "Turnover",
        metainfo: {
            _metainfoVersion: 51,
            id: "Turnover@tv-basicstudies-1",
            name: "Turnover (Cr)",
            description: "Turnover (Cr)",
            shortDescription: "Turnover (Cr)",
            is_hidden_study: false,
            is_price_study: false,
            isCustomIndicator: true,
            format: {
                type: "volume"
            },
            plots: [{ id: "plot_0", type: "line" }],
            defaults: {
                styles: {
                    plot_0: {
                        linestyle: 0,
                        linewidth: 2,
                        plottype: 5, // 5 is columns (histogram)
                        transparency: 0,
                        visible: true,
                        color: "#2196F3"
                    }
                },
                inputs: {}
            },
            inputs: [],
        },
        constructor: function () {
            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var close = PineJS.Std.close(this._context);
                var volume = PineJS.Std.volume(this._context);

                if (close !== undefined && volume !== undefined && !isNaN(close) && !isNaN(volume)) {
                    return [(close * volume) / 10000000];
                }
                return [0];
            };
        }
    };
};
