import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

function HomepageHeader() {
  const heroPolicy = `security module com.example.myapp {
    entitle com.example.myapp.http.. to network.outbound;
    entitle com.example.myapp.io..   to fs.read(data, "**");
    entitle com.example.myapp..      to threads.create;
}`;

  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <img
          src="/img/jguard-logo-transparent-background.png"
          alt="jGuard"
          className={styles.heroLogo}
        />
        <p className={styles.heroSubtitle}>
          Capability-Based Security for the JVM
        </p>
        <p className={styles.heroDescription}>
          Execute untrusted code with explicit, least-privilege access controls.
          Built for JDK 21+ in the post-SecurityManager era.
        </p>
        <div className={styles.heroCode}>
          <CodeBlock language="text" title="module-info.jguard">
            {heroPolicy}
          </CodeBlock>
        </div>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            href="https://github.com/jguard-io/jguard">
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function OverridePoliciesSection() {
  const embeddedPolicy = `// Embedded in library JAR - overly permissive
security module com.vendor.library {
    entitle module to network.outbound;
    entitle module to native.load;
    entitle module to fs.read(data, "**");
}`;

  const overridePolicy = `// External override - restrict at deployment
security module com.vendor.library {
    deny module to network.outbound;
    deny module to native.load;
    // fs.read(data, "**") remains allowed
}`;

  return (
    <section className={styles.overrideSection}>
      <div className="container">
        <Heading as="h2" className="text--center">
          Override Policies at Deployment
        </Heading>
        <p className="text--center">
          Restrict overly permissive libraries without rebuilding. Denials always win.
        </p>
        <div className="row">
          <div className="col col--6">
            <CodeBlock language="text" title="Embedded Policy (library)">
              {embeddedPolicy}
            </CodeBlock>
          </div>
          <div className="col col--6">
            <CodeBlock language="text" title="External Override (deployer)">
              {overridePolicy}
            </CodeBlock>
          </div>
        </div>
      </div>
    </section>
  );
}

function LegacyLibrarySection() {
  const legacyPolicy = `// Secure legacy libraries without jGuard support
security module legacy.untrusted.library {
    // Grant only what the library needs
    entitle module to fs.read(config, "*.properties");
    entitle module to system.property.read("java.version");

    // Everything else denied by default:
    // - No network access
    // - No thread creation
    // - No native code
}`;

  return (
    <section className={styles.legacySection}>
      <div className="container">
        <Heading as="h2" className="text--center">
          Protect Against Legacy Libraries
        </Heading>
        <p className="text--center">
          Apply least-privilege to third-party JARs that don't ship with jGuard policies.
        </p>
        <div className={styles.legacyCodeContainer}>
          <CodeBlock language="text" title="policies/legacy.untrusted.library.jguard">
            {legacyPolicy}
          </CodeBlock>
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const useCases = [
    {
      title: 'Plugin Systems',
      description: 'Safely execute third-party plugins with explicit capability grants.',
      link: '/docs/use-cases/plugin-systems',
    },
    {
      title: 'ML/AI Isolation',
      description: 'Sandbox ML model execution and control resource access.',
      link: '/docs/use-cases/ml-isolation',
    },
    {
      title: 'Multi-Module Applications',
      description: 'Isolate modules with independent security policies.',
      link: '/docs/use-cases/multi-tenant',
    },
    {
      title: 'Search Engines',
      description: 'Secure custom scoring scripts and query-time code execution.',
      link: '/docs/use-cases/search-engines',
    },
  ];

  return (
    <section className={styles.useCases}>
      <div className="container">
        <Heading as="h2" className="text--center">
          Use Cases
        </Heading>
        <p className="text--center">
          jGuard is designed for JVM applications that need to execute untrusted code safely.
        </p>
        <div className="row">
          {useCases.map((useCase, idx) => (
            <div key={idx} className="col col--3">
              <div className={styles.useCaseCard}>
                <Heading as="h3">{useCase.title}</Heading>
                <p>{useCase.description}</p>
                <Link to={useCase.link}>Learn more</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="Capability-Based Security for the JVM"
      description="jGuard is a capability-oriented security framework for JDK 21+ that enables JVM applications to execute untrusted code with explicit, least-privilege access controls.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <OverridePoliciesSection />
        <LegacyLibrarySection />
        <UseCasesSection />
      </main>
    </Layout>
  );
}
