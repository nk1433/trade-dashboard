export const evaluateScan = (criteria, data) => {
    if (!criteria || !data) return false;

    // Simple rule evaluator
    // Structure: { condition: "AND" | "OR", rules: [ { field, operator, value } ] }

    const { condition, rules } = criteria;
    if (!rules || !Array.isArray(rules)) return false;

    const results = rules.map(rule => evaluateRule(rule, data));

    if (condition === 'OR') {
        return results.some(r => r === true);
    } else {
        // Default to AND
        return results.every(r => r === true);
    }
};

const evaluateRule = (rule, data) => {
    const { field, operator, value } = rule;

    const fieldValue = getValue(field, data);
    const targetValue = getValue(value, data); // value can be a static number or another field name

    if (fieldValue === undefined || targetValue === undefined) return false;

    switch (operator) {
        case '>': return fieldValue > targetValue;
        case '>=': return fieldValue >= targetValue;
        case '<': return fieldValue < targetValue;
        case '<=': return fieldValue <= targetValue;
        case '==': return fieldValue == targetValue;
        case '!=': return fieldValue != targetValue;
        default: return false;
    }
};

const getValue = (key, data) => {
    if (typeof key === 'number') return key;
    if (!isNaN(parseFloat(key)) && isFinite(key)) return parseFloat(key);

    // Map common fields to data properties
    // data is expected to be an OHLC object: { open, high, low, close, volume, ... }
    const map = {
        'open': data.open,
        'high': data.high,
        'low': data.low,
        'close': data.close,
        'volume': data.volume || data.vol,
        'ltp': data.ltp || data.close,
    };

    return map[key.toLowerCase()] !== undefined ? map[key.toLowerCase()] : undefined;
};
