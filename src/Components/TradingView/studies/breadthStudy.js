
/**
 * Factory function to create a Market Breadth custom study with SMA.
 *
 * @param {Object} config - Configuration object
 * @param {string} config.field - The field key in breadth data (e.g., 'up4Percent')
 * @param {string} config.name - Internal unique name
 * @param {string} config.description - Display name
 * @param {string} config.color - Histogram color
 * @param {string} config.smaColor - SMA Line color
 * @param {Array}  breadthData - Array of breadth data objects
 * @returns {Object} Custom Study Definition
 */
export const createBreadthStudy = ({ field, name, description, color, smaColor = '#FFA500' }, breadthData) => {

    const processShortDescription = (desc) => {
        return desc.replace("Market Breadth", "MB").replace("Percent", "%");
    };

    const studyId = `${name}@tv-basicstudies-1`;

    return {
        name: name,
        metainfo: {
            _metainfoVersion: 51,
            id: studyId,
            name: name,
            description: description,
            shortDescription: processShortDescription(description),
            is_price_study: false,
            isCustomIndicator: true,
            plots: [
                { id: "plot_0", type: "line" }, // Histogram
                { id: "plot_1", type: "line" }  // SMA
            ],
            defaults: {
                styles: {
                    plot_0: {
                        linestyle: 0,
                        linewidth: 2,
                        plottype: 5, // Columns
                        trackPrice: false,
                        transparency: 0,
                        visible: true,
                        color: color,
                    },
                    plot_1: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 0, // Line
                        trackPrice: false,
                        transparency: 0,
                        visible: true,
                        color: smaColor,
                    }
                },
                precision: 0,
                inputs: {
                    in_0: 20
                },
            },
            inputs: [
                {
                    id: "in_0",
                    name: "SMA Length",
                    defval: 20,
                    type: "integer",
                    min: 1,
                    max: 500
                }
            ],
            styles: {
                plot_0: { title: "Count", histogramBase: 0 },
                plot_1: { title: "SMA" }
            },
            format: {
                type: "price",
                precision: 0,
            },
        },
        constructor: function () {
            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                // 1. Process Main Data Key Map
                this._dataMap = new Map();

                // We need sorted data for SMA calculation
                // Filter valid items first
                const validItems = [];
                if (Array.isArray(breadthData)) {
                    breadthData.forEach(item => {
                        if (item.date && item[field] !== undefined) {
                            validItems.push({
                                date: item.date,
                                val: item[field],
                                dateStr: item.date.split('T')[0]
                            });
                        }
                    });
                }

                // Sort by date ascending
                validItems.sort((a, b) => new Date(a.date) - new Date(b.date));

                // Fill Data Map and Prepare for SMA
                const values = []; // Array of pure values matches validItems index
                validItems.forEach(item => {
                    this._dataMap.set(item.dateStr, item.val);
                    values.push(item.val);
                });

                // 2. Calculate SMA Map
                this._smaMap = new Map();
                const length = this._input(0); // Get SMA Length from input "in_0"

                for (let i = 0; i < validItems.length; i++) {
                    if (i < length - 1) {
                        // Not enough data for SMA
                        this._smaMap.set(validItems[i].dateStr, NaN);
                        continue;
                    }

                    let sum = 0;
                    for (let j = 0; j < length; j++) {
                        sum += values[i - j];
                    }
                    const avg = sum / length;
                    this._smaMap.set(validItems[i].dateStr, avg);
                }
            };

            this.main = function (context, inputCallback) {
                const time = context.symbol.time;
                if (!time) return [NaN, NaN];

                let dateKey;
                try {
                    // 'en-CA' gives YYYY-MM-DD format
                    dateKey = new Date(time).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                } catch (e) {
                    const date = new Date(time + 19800000);
                    dateKey = date.toISOString().split('T')[0];
                }

                const value = this._dataMap.get(dateKey);
                const sma = this._smaMap.get(dateKey);

                return [
                    value !== undefined ? value : NaN,
                    sma !== undefined ? sma : NaN
                ];
            };
        },
    };
};

export const getBreadthStudy = (breadthData) => {
    return createBreadthStudy({
        field: 'up4Percent',
        name: 'MarketBreadthUp',
        description: 'Market Breadth Up 4%',
        color: '#808080'
    }, breadthData);
};
