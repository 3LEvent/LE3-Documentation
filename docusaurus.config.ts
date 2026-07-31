import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '3LEvent Developer Portal',
  tagline: 'Spécifications techniques et standards de l\'écosystème 3LEvent',
  favicon: 'img/favicon.ico',

  // Flag de préparation pour la migration v4
  future: {
    v4: true,
  },

  // Configuration du domaine
  url: 'https://doc.3levent.fr',
  baseUrl: '/',
  trailingSlash: false,

  // Configuration GitHub
  organizationName: '3LEvent',
  projectName: 'LE3-Documentation',
  deploymentBranch: 'gh-pages',

  // --- GESTION DES LIENS (RACINE OBLIGATOIRE EN V3) ---
  onBrokenLinks: 'throw',

  // Configuration du moteur Markdown
  markdown: {
    format: 'mdx',
    mermaid: true, // Support des schémas Mermaid
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Requis pour que `markdown.mermaid` produise réellement des diagrammes :
  // sans ce thème, les blocs ```mermaid sont silencieusement ignorés au build.
  themes: ['@docusaurus/theme-mermaid'],

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
          editUrl: 'https://github.com/3LEvent/LE3-Documentation/tree/main/',
        },
        blog: false, // Mode documentation pure
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Design system : Forçage du mode clair (White & Emerald)
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Navigation épurée sans emojis
    navbar: {
      title: '3LEvent Developer',
      logo: {
        alt: '3LEvent Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/3LEvent',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    // Pied de page professionnel
    footer: {
      style: 'light',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
            {
              label: 'Standards de Code',
              to: '/docs/guidelines/coding-standards',
            },
          ],
        },
        {
          title: 'Ecosystème',
          items: [
            {
              label: 'Site Officiel',
              href: 'https://3levent.fr',
            },
            {
              label: 'Discord Staff',
              href: 'https://discord.gg/MREthDheAK',
            },
          ],
        },
        {
          title: 'Infrastructure',
          items: [
            {
              label: 'GitHub Organization',
              href: 'https://github.com/3LEvent',
            },
            {
              label: 'Cloudflare Dashboard',
              href: 'https://dash.cloudflare.com',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} 3LEvent Organization. Documentation technique réservée à l'usage interne.`,
    },
    // Coloration syntaxique optimisée pour la stack 3LEvent
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.github,
      additionalLanguages: [
        'java',
        'json',
        'bash',
        'typescript',
        'gradle',
        'yaml'
      ],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;