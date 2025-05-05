module.exports = function override(config) {
    // 忽略 superstruct 的源映射警告
    config.module.rules = config.module.rules.map(rule => {
        if (rule.loader && rule.loader.includes('source-map-loader')) {
            return {
                ...rule,
                exclude: [/node_modules\/superstruct/],
            };
        }
        return rule;
    });

    return config;
};