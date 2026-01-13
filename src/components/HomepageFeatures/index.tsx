import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'No Ambient Authority',
    icon: '🔒',
    description: (
      <>
        Code cannot implicitly access sensitive resources. All operations require
        explicit capabilities—no hidden permissions, no surprises.
      </>
    ),
  },
  {
    title: 'Modules as Principals',
    icon: '📦',
    description: (
      <>
        JPMS module identity serves as the root of trust. Packages provide fine-grained
        refinement for precise security boundaries.
      </>
    ),
  },
  {
    title: 'Deny by Default',
    icon: '🚫',
    description: (
      <>
        Operations fail unless capabilities are explicitly granted. Security is
        opt-in, not opt-out—the safest default posture.
      </>
    ),
  },
  {
    title: 'Deterministic Policy',
    icon: '📋',
    description: (
      <>
        Security policies compile to auditable metadata suitable for human review.
        Know exactly what your code can and cannot do.
      </>
    ),
  },
  {
    title: 'Multiple Execution Modes',
    icon: '⚙️',
    description: (
      <>
        Run in STRICT mode for production, PERMISSIVE for development, or AUDIT
        mode to log violations without blocking—fit your workflow.
      </>
    ),
  },
  {
    title: 'Production Ready',
    icon: '🚀',
    description: (
      <>
        Comprehensive enforcement, JPMS integration, CLI toolset with the
        <code>jguardc</code> compiler and <code>jguard</code> inspector.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className="text--center">
          Why jGuard?
        </Heading>
        <p className={clsx('text--center', styles.featuresSubtitle)}>
          The Java Security Manager was deprecated in JDK 17 and removed in JDK 24.
          jGuard provides capability-based security for the modern JVM.
        </p>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
