import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
// Import des icônes professionnelles (FontAwesome set)
import { FaCloud, FaServer, FaCodeBranch } from 'react-icons/fa';

type FeatureItem = {
    title: string;
    Icon: React.ElementType; // Utilisation d'un composant d'icône React
    description: ReactNode;
};

const FeatureList: FeatureItem[] = [
    {
        title: 'Écosystème Web & Cloud',
        Icon: FaCloud,
        description: (
            <>
                Interfaces haute performance développées sous <b>Angular 17+</b>.
                Gestion du trafic et sécurité périmétrique assurées par l'infrastructure <b>Cloudflare</b>.
            </>
        ),
    },
    {
        title: 'Architecture Game-Server',
        Icon: FaServer,
        description: (
            <>
                Backends robustes basés sur <b>Java 21</b>. Développement de plugins
                Paper hautement optimisés avec une gestion stricte de la performance et de la latence.
            </>
        ),
    },
    {
        title: 'Standardisation & CI/CD',
        Icon: FaCodeBranch,
        description: (
            <>
                Déploiement continu via <b>GitHub Actions</b>. Utilisation de templates
                et de workflows partagés pour garantir l'homogénéité du code source.
            </>
        ),
    },
];

function Feature({title, Icon, description}: FeatureItem) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                {/* L'icône reçoit la classe CSS pour la couleur Emerald et la taille */}
                <Icon className={styles.featureIcon} />
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
                <div className={styles.divider}></div>
                <p className={styles.featureDescription}>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): ReactNode {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}