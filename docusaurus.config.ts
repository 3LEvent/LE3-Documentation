import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'LE3 Documentation',
  tagline: 'Documentation développeur officielle pour le 3LEvent', //
  favicon: 'img/favicon.ico',

  // Améliore la compatibilité avec Docusaurus v4
  future: {
    v4: true,
  },

  // Configuration du domaine personnalisé sécurisé par Cloudflare
  url: 'https://doc.3levent.fr', //
  baseUrl: '/',
  trailingSlash: false,

  // Configuration GitHub pour le déploiement automatique
  organizationName: '3LEvent', //
  projectName: 'LE3-Documentation', //
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
          // Permet aux membres de modifier la doc directement sur GitHub via la branche main
          editUrl:
              'https://github.com/3LEvent/LE3-Documentation/tree/main/',
        },
        blog: {
          showReadingTime: true,
          onInlineTags: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Image pour le partage sur les réseaux sociaux
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true, // S'adapte au mode sombre/clair du système
    },
    navbar: {
      title: '3LEvent Doc',
      logo: {
        alt: '3LEvent Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Wiki',
        },
        {to: '/blog', label: 'News', position: 'left'},
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