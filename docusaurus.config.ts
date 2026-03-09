import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'LE3 Documentation',
  tagline: 'Documentation développeur officielle pour le 3LEvent',
  favicon: 'img/favicon.ico',

  // Compatibilité Docusaurus v4
  future: {
    v4: true,
  },

  // Configuration du domaine personnalisé (Cloudflare)
  url: 'https://doc.3levent.fr', //
  baseUrl: '/',
  trailingSlash: false,

  // Configuration GitHub
  organizationName: '3LEvent',
  projectName: 'LE3-Documentation',
  deploymentBranch: 'gh-pages',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'fr',
    locales: ['fr'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Lien direct pour que ton équipe puisse éditer les pages
          editUrl:
              'https://github.com/3LEvent/LE3-Documentation/tree/main/',
        },
        // LE BLOG A ÉTÉ RETIRÉ ICI
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '3LEvent Doc',
      logo: {
        alt: '3LEvent Logo',
        src: 'img/logo.svg', // Assure-toi que ton logo est bien dans static/img/
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Wiki',
        },
        // LE LIEN NEWS A ÉTÉ RETIRÉ ICI
        {
          href: 'https://github.com/3LEvent/LE3-Documentation',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Communauté',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/MREthDheAK',
            },
          ],
        },
        {
          title: 'Plus',
          items: [
            {
              label: 'GitHub Orga',
              href: 'https://github.com/3LEvent',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} 3LEvent. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;