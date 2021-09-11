module.exports = {
  images: {
    domains: ['img.shields.io']
  },
  webpack(config) {
    config.resolve.extensions.push(".md");
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: 'text-loader'
        }
      ]
    });
    return config;
  }
}
