import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();
    return (
        // On retire 'hero--primary' pour conserver le fond blanc défini dans le CSS
        <header className={clsx(styles.heroBanner)}>
            <div className="container">
                <Heading as="h1" className={styles.heroTitle}>
                    {siteConfig.title}
                </Heading>
                <p className={styles.heroSubtitle}>
                    Portail technique officiel pour le développement et la maintenance de l'écosystème 3LEvent.
                </p>
                <div className={styles.buttons}>
                    <Link
                        className="button button--primary button--lg"
                        to="/docs/intro">
                        Accéder à la documentation
                    </Link>
                    <Link
                        className="button button--outline button--secondary button--lg"
                        to="https://github.com/3LEvent">
                        Dépôts GitHub
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default function Home(): ReactNode {
    const {siteConfig} = useDocusaurusContext();
    return (
        <Layout
            title="Accueil"
            description="Documentation développeur officielle pour l'événement Minecraft 3LEvent. Accédez aux guidelines, APIs et standards de l'écosystème.">
            <HomepageHeader />
            <main>
                <HomepageFeatures />
            </main>
        </Layout>
    );
}