/* eslint-disable @typescript-eslint/no-var-requires */
const header = require("postcss-header");

module.exports = {
  plugins: [header({ header: "@layer reset, component, patch;" })],
};
