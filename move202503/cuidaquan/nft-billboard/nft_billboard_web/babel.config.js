module.exports = {
  presets: ['react-app'],
  env: {
    production: {
      plugins: ['transform-remove-console']
    }
  }
};
