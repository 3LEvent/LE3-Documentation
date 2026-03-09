import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/database-schema',
        'architecture/communication-protocol',
      ],
    },
    {
      type: 'category',
      label: 'Standards & Guidelines',
      collapsed: false,
      items: [
        'guidelines/coding-standards',
        'guidelines/code-snippets',
        'guidelines/design-system',
      ],
    },
    {
      type: 'category',
      label: 'Workflow',
      collapsed: true,
      items: [
        'workflow/git-conventions',
        'workflow/pull-request-process',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      collapsed: true,
      items: [
        'infrastructure/secrets-management',
        'infrastructure/github-actions',
        'infrastructure/cloudflare-setup',
      ],
    },
    {
      type: 'category',
      label: 'Modules Ecosystem',
      collapsed: true,
      items: [
        'projects/minecraft-plugins',
        'projects/web-applications',
        'projects/discord-bot',
      ],
    },
  ],
};

export default sidebars;