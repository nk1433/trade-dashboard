export const createCacheService = (maxSize = 100) => {
    const cache = new Map();

    return {
        get: (key) => cache.get(key),
        set: (key, value) => {
            if (cache.size >= maxSize) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            cache.set(key, value);
        },
        has: (key) => cache.has(key),
        clear: () => cache.clear()
    };
};
