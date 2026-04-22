// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'hello-world',
  url: 'http://localhost:3000',
  baseUrl: '/docs/hello-world/',
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
        theme: { customCss: [] },
      }),
    ],
  ],
};

module.exports = config;
