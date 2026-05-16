import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/index',
        'getting-started/installation',
        'getting-started/quickstart',
        'getting-started/first-policy',
        'getting-started/cli-tools',
        'getting-started/gradle-plugin',
        'getting-started/hot-reload',
        'getting-started/observability',
        'getting-started/multi-module-tutorial',
      ],
    },
    {
      type: 'category',
      label: 'Releases',
      items: [
        'releases/changelog',
        'releases/roadmap',
      ],
    },
    {
      type: 'category',
      label: 'Community',
      items: [
        'community/contributing',
        'community/security',
        'community/code-of-conduct',
        'community/governance',
      ],
    },
    'faq',
  ],

  // Policy documentation sidebar
  policySidebar: [
    'policy/overview',
    'policy/external-policies',
    'policy/language-spec',
  ],

  // Use Cases sidebar
  useCasesSidebar: [
    'use-cases/overview',
    {
      type: 'category',
      label: 'Application Security',
      collapsed: false,
      items: [
        'use-cases/plugin-systems',
        'use-cases/ml-isolation',
        'use-cases/search-engines',
        'use-cases/multi-tenant',
      ],
    },
  ],
};

export default sidebars;
