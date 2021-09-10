module.exports = {
  webpack(config) {
    config.resolve.extensions.push(".md");
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: path.resolve(__dirname, 'webpack-md-loader/loader.js')
        }
      ]
    });
    return config;
  }
}
