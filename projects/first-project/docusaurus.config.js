// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'first-project',
  url: 'http://localhost:3000',
  baseUrl: '/docs/first-project/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  trailingSlash: false,
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: false,
        theme: {},
      }),
    ],
  ],
};

module.exports = config;
