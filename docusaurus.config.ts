import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'jGuard',
  tagline: 'Capability-Based Security Framework for the JVM',
  favicon: 'img/jguard-icon.png',

  future: {
    v4: true,
  },

  url: 'https://jguard.io',
  baseUrl: '/',

  // SEO metadata
  headTags: [
    // Open Graph
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:site_name',
        content: 'jGuard',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:locale',
        content: 'en_US',
      },
    },
    // Twitter Card
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:site',
        content: '@jguard_io',
      },
    },
    // Additional SEO
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'jGuard, Java security, JVM security, capability-based security, JPMS, Java modules, SecurityManager replacement, JDK 21, JDK 24, sandbox, least privilege, JEP 411, JEP 486, Security Manager deprecated, Security Manager removed',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'author',
        content: 'jGuard Contributors',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: 'https://jguard.io',
      },
    },
  ],

  // GitHub pages deployment config
  organizationName: 'jguard-io',
  projectName: 'jguard-io.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        gtag: {
          trackingID: 'G-465L2FCKEB',
          anonymizeIP: true, // Recommended for GDPR compliance
        },
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/jguard-io/jguard.io/tree/main/',
          showLastUpdateAuthor: false,
          showLastUpdateTime: false,
          lastVersion: '0.4',
          versions: {
            current: {
              label: 'Next 🚧',
              banner: 'unreleased',
            },
            '0.4': {
              label: '0.4.0',
            },
            '0.3': {
              label: '0.3.1',
            },
            '0.2': {
              label: '0.2.0',
            },
          },
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/jguard-io/jguard.io/tree/main/',
          blogTitle: 'jGuard Blog',
          blogDescription: 'News, releases, and insights about JVM security',
          postsPerPage: 10,
          blogSidebarTitle: 'Recent Posts',
          blogSidebarCount: 'ALL',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    // Default meta image for social sharing
    image: 'img/jguard-social-card.png',
    // SEO metadata defaults
    metadata: [
      {
        name: 'description',
        content: 'jGuard is a capability-based security framework for JDK 21+ that enables JVM applications to execute untrusted code with explicit, least-privilege access controls. The modern replacement for the deprecated Java SecurityManager.',
      },
      {
        property: 'og:description',
        content: 'Capability-based security for the JVM. Execute untrusted code safely with explicit, least-privilege access controls.',
      },
      {
        name: 'twitter:description',
        content: 'Capability-based security for the JVM. Execute untrusted code safely with explicit, least-privilege access controls.',
      },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    // Announcement bar for new releases
    announcementBar: {
      id: 'v0.4.0-release',
      content:
        'jGuard v0.4.0 is now available! Audit mode, embedded external policies, and denial observability. <a href="/blog/jguard-v0.4.0-release">Read the release notes</a>',
      backgroundColor: '#25c2a0',
      textColor: '#fff',
      isCloseable: true,
    },
    navbar: {
      title: '',
      logo: {
        alt: 'jGuard Logo',
        src: 'img/jguard-logo.png',
        style: {height: '32px'},
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'docSidebar',
          sidebarId: 'policySidebar',
          position: 'left',
          label: 'Policy',
        },
        {
          type: 'docSidebar',
          sidebarId: 'useCasesSidebar',
          position: 'left',
          label: 'Use Cases',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left',
        },
        {
          type: 'dropdown',
          label: 'Community',
          position: 'left',
          items: [
            {
              label: 'Contributing',
              to: '/docs/community/contributing',
            },
            {
              label: 'Security',
              to: '/docs/community/security',
            },
            {
              label: 'Code of Conduct',
              to: '/docs/community/code-of-conduct',
            },
            {
              label: 'Governance',
              to: '/docs/community/governance',
            },
          ],
        },
        // Right side items
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/jguard-io/jguard',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
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
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Installation',
              to: '/docs/getting-started/installation',
            },
            {
              label: 'Policy Model',
              to: '/docs/policy/overview',
            },
            {
              label: 'FAQ',
              to: '/docs/faq',
            },
          ],
        },
        {
          title: 'Use Cases',
          items: [
            {
              label: 'Plugin Systems',
              to: '/docs/use-cases/plugin-systems',
            },
            {
              label: 'ML/AI Isolation',
              to: '/docs/use-cases/ml-isolation',
            },
            {
              label: 'Multi-Module Apps',
              to: '/docs/use-cases/multi-tenant',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/jguard-io/jguard',
            },
            {
              label: 'Maven Central',
              href: 'https://central.sonatype.com/search?q=io.jguard',
            },
            {
              label: 'Gradle Plugin Portal',
              href: 'https://plugins.gradle.org/plugin/io.jguard.policy',
            },
            {
              label: 'Contributing',
              to: '/docs/community/contributing',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'Changelog',
              to: '/docs/releases/changelog',
            },
            {
              label: 'Roadmap',
              to: '/docs/releases/roadmap',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} jGuard Contributors.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'groovy', 'kotlin', 'bash', 'json', 'yaml', 'toml'],
    },
    // Algolia search (configure later)
    // algolia: {
    //   appId: 'YOUR_APP_ID',
    //   apiKey: 'YOUR_SEARCH_API_KEY',
    //   indexName: 'jguard',
    // },
  } satisfies Preset.ThemeConfig,
};

export default config;
