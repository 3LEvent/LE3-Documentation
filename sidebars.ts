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
      className: 'sidebar-icon-architecture',
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
      className: 'sidebar-icon-standards',
      collapsed: false,
      items: [
        'guidelines/setup',
        'guidelines/coding-standards',
        'guidelines/code-snippets',
        'guidelines/design-system',
      ],
    },
    {
      type: 'category',
      label: 'Workflow',
      className: 'sidebar-icon-workflow',
      collapsed: true,
      items: [
        'workflow/git-conventions',
        'workflow/pull-request-process',
      ],
    },
    {
      type: 'category',
      label: 'Infrastructure',
      className: 'sidebar-icon-infra',
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
      className: 'sidebar-icon-projects',
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