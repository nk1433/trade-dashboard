export const createCustomDataStudy = (PineJS) => {
    return {
        name: "Custom Data Legend",
        metainfo: {
            _metainfoVersion: 51,
            id: "CustomDataLegend@tv-basicstudies-1",
            name: "Custom Data Legend",
            description: "Custom Data (Legend Only)",
            shortDescription: "CustomData",
            is_price_study: true,
            isCustomIndicator: true,
            plots: [{ id: "plot_0", type: "line" }],
            defaults: {
                styles: {
                    plot_0: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 2, // line
                        trackPrice: false,
                        transparency: 100, // 100% transparent so it doesn't draw a line on chart
                        visible: true
                    }
                },
                precision: 2,
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
                this._context = context;
                this._input = inputCallback;
                // Static custom data to display in the legend
                return [123.45]; 
            };
        }
    };
};
