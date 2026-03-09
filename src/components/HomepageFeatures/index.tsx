import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
    title: string;
    Svg: React.ComponentType<React.ComponentProps<'svg'>>;
    description: ReactNode;
};

const FeatureList: FeatureItem[] = [
    {
        title: 'Écosystème Web & App',
        Svg: require('@site/static/img/undraw_docusaurus_react.svg').default, // Idéalement remplacer par logo Angular/TS
        description: (
            <>
                Développement d'interfaces modernes avec <b>Angular</b> et <b>TypeScript</b>.
                Nos outils web permettent de gérer l'événement 3LEvent en temps réel.
            </>
        ),
    },
    {
        title: 'Infrastructure Minecraft',
        Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default, // Idéalement remplacer par icône Java
        description: (
            <>
                Architecture backend robuste en <b>Java</b>. Développement de plugins
                sur-mesure pour une expérience de jeu unique et optimisée.
            </>
        ),
    },
    {
        title: 'Open Source & GitHub',
        Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
        description: (
            <>
                Toutes nos ressources sont centralisées sur GitHub. Nous prônons le
                partage de code au sein de l'association <b>3LEvent</b> pour faire progresser la communauté.
            </>
        ),
    },
];

function Feature({title, Svg, description}: FeatureItem) {
    return (
        <div className={clsx('col col--4')}>
            <div className="text--center">
                <Svg className={styles.featureSvg} role="img" />
            </div>
            <div className="text--center padding-horiz--md">
                <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
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