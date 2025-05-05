const { override, addBabelPlugin } = require('customize-cra');

module.exports = override(
  // 添加babel插件移除console语句
  process.env.NODE_ENV === 'production' &&
  addBabelPlugin('transform-remove-console'),

  // 使用TerserPlugin移除console语句（双重保障）
  (config) => {
    if (process.env.NODE_ENV === 'production') {
      if (config.optimization && config.optimization.minimizer) {
        const terserPluginIndex = config.optimization.minimizer.findIndex(
          minimizer => minimizer.constructor.name === 'TerserPlugin'
        );

        if (terserPluginIndex !== -1) {
          const terserPlugin = config.optimization.minimizer[terserPluginIndex];

          if (!terserPlugin.options) {
            terserPlugin.options = {};
          }

          if (!terserPlugin.options.terserOptions) {
            terserPlugin.options.terserOptions = {};
          }

          if (!terserPlugin.options.terserOptions.compress) {
            terserPlugin.options.terserOptions.compress = {};
          }

          terserPlugin.options.terserOptions.compress.drop_console = true;
        }
      }
    }
    return config;
  }
);
