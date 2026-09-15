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
                Trois applications <b>Node 22 / Express 5</b> en TypeScript strict, sans framework
                frontend, reliées par un bus Redis. Trafic et sécurité périmétrique assurés par <b>Cloudflare</b>.
            </>
        ),
    },
    {
        title: 'Architecture Game-Server',
        Icon: FaServer,
        description: (
            <>
                Plugin <b>Paper 26.2</b> en <b>Java 25</b>, MySQL pour la vérité, Redis pour le
                temps réel. Équipes synchronisées depuis le site, succès et points par équipe.
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