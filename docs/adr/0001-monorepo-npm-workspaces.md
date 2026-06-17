# Monorepo avec npm workspaces pour backend et frontend

Le projet a deux services déployés indépendamment (backend Express, frontend React, cf. cahier des charges §8.1), chacun avec son propre Dockerfile. Plutôt que deux projets npm totalement indépendants ou un unique `package.json` non subdivisé, on utilise un monorepo avec **npm workspaces** (`backend/`, `frontend/` sous un `package.json` racine). Ça permet un seul `npm ci` à la racine, et de partager facilement des types TypeScript (ex: `StrategySignal`) entre back et front via un futur package partagé, sans dupliquer le typage — tout en gardant la possibilité de cibler un seul workspace pour lancer ses tests.

## Considered Options

- Deux projets npm indépendants (un par service) : rejeté, duplique le typage partagé entre back et front sans bénéfice clair.
- Un seul `package.json` non subdivisé pour tout le code : rejeté, brouille la séparation backend/frontend déjà imposée par le découpage Docker.
