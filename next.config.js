const path = require('path');

module.exports = {
  webpack(config) {
    config.resolve.extensions.push(".tml");
    config.module.rules.push({
      test: /\.tml/,
      use: [
        {
          loader: path.resolve(__dirname, 'webpack-tml-loader/loader.js')
        }
      ]
    });
    return config;
  }
}
