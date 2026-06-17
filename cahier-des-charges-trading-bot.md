# Cahier des charges technique — Bot de trading automatique (paper trading)

## 1. Contexte et objectifs

Le projet consiste à développer un bot de trading automatique en **paper trading** (simulation, sans argent réel) sur une paire crypto fixe, avec deux objectifs complémentaires :

1. **Fonctionnel** : développer des stratégies de trading basées sur des indicateurs techniques, d'abord simples (SMA, RSI, MACD), puis progressivement optimisées pour maximiser la performance simulée.
2. **Technique/pédagogique** : servir de terrain d'entraînement à l'écriture manuelle de tests — TDD, end-to-end, et tests de performance — sur un cas d'usage réaliste et non trivial. Le TDD est appliqué strictement dès le premier module codé (voir `strategie-de-test.md`) ; seuls les tests end-to-end et de performance, qui valident le système assemblé, arrivent nécessairement après que les modules concernés existent.

Le projet ne manipule **aucun fonds réel**. Aucune clé API privée n'est nécessaire dans sa première version, puisque seules des données de marché publiques sont consommées.

L'application est conçue pour être **entièrement dockerisée** dès la conception, afin de pouvoir être déployée simplement sur une instance **Dokploy** (PaaS auto-hébergé basé sur Docker Compose).

## 2. Périmètre

### Inclus
- Paper trading sur **une seule paire fixe : BTC/USDT**, sur **Binance Spot**.
- Récupération de données de marché en deux modes : historique (pour le backtest) et temps réel (pour le live simulé).
- Moteur de stratégies à base d'indicateurs techniques (SMA, RSI, MACD pour la v1).
- Moteur de backtest permettant de rejouer une stratégie sur des données passées.
- Simulation d'exécution d'ordres (portefeuille virtuel, P&L simulé).
- Dashboard web de suivi (prix, position courante, historique des trades, P&L).
- Persistance des données (prix, trades, positions) en PostgreSQL.
- Suite de tests unitaires (TDD), E2E, et de performance — **phase 2**.
- Dockerisation complète (backend, frontend) avec `docker-compose.yml` compatible Dokploy.

### Exclu (hors périmètre v1)
- Trading avec de l'argent réel.
- Gestion de plusieurs paires en parallèle.
- Stratégies de machine learning / IA (réservé à une itération future possible).
- Gestion multi-utilisateurs ou authentification (le dashboard est mono-utilisateur, local).
- Déploiement infrastructure (cloud, CI/CD avancé) — non traité dans ce document.

## 3. Architecture générale

Le système est conçu autour d'un **pipeline unique**, dans lequel le mode d'exécution (backtest ou live) ne change que les deux extrémités du flux — la source des prix et la destination des ordres — sans jamais impacter la logique de stratégie ou de gestion du portefeuille.

```
Mode backtest :
  data.binance.vision → Historical Data Fetcher → PostgreSQL → Backtest Runner ─┐
                                                                                  │
Mode live :                                                                      ▼
  WebSocket Binance ───────────────────────────────────────────────► Strategy Engine → Trading Engine → Order Executor (simulé)
                                                                                  │
                                                                                  ▼
                                                                    PostgreSQL ← → Dashboard (API + WebSocket + React)
```

### 3.1 Modules

| Module | Responsabilité | Dépendances externes |
|---|---|---|
| **Historical Data Fetcher** | Télécharge les archives de bougies (klines) depuis `data.binance.vision`, les parse et les insère en base. Gère la déduplication et l'incrémentalité (ne re-télécharge pas ce qui existe déjà). | `data.binance.vision` (HTTP, fichiers ZIP) |
| **Market Data Provider (live)** | Se connecte au WebSocket public Binance, reçoit les prix/bougies en temps réel, les normalise et les diffuse aux modules internes. | WebSocket Binance |
| **Strategy Engine** | Contient les algorithmes de trading (SMA, RSI, MACD...) sous forme de **fonctions pures** : entrée = série de prix/bougies, sortie = signal (`BUY` / `SELL` / `HOLD`). Aucune dépendance réseau ou base de données. | Aucune |
| **Trading Engine / Order Manager** | Reçoit les signaux du Strategy Engine, applique les règles de gestion du risque (taille de position, stop-loss/take-profit), met à jour le portefeuille virtuel. | Aucune (logique pure + état du portefeuille) |
| **Order Executor (simulé)** | Implémente l'exécution effective d'un ordre : instantanée en backtest, avec horodatage réel (et éventuellement slippage simulé) en live. | Aucune |
| **Backtest Runner** | Orchestre la lecture séquentielle des données historiques en base et les fait transiter dans Strategy Engine → Trading Engine, en mesurant la performance obtenue (P&L, drawdown, etc.). | PostgreSQL |
| **Persistence Layer** | Stocke prix historiques, trades, positions, configuration des stratégies. Accès via Prisma. | PostgreSQL |
| **API Backend** | Expose en REST l'historique des trades, les résultats de backtest, la configuration ; expose en WebSocket le flux live (prix, trades, P&L) au dashboard. | Express |
| **Dashboard (frontend)** | Interface web affichant prix courant, position, historique des trades, courbe de P&L. | React |

### 3.2 Interfaces communes (clé de la testabilité)

Deux interfaces permettent d'interchanger le mode backtest et le mode live sans toucher à la logique métier :

- **`PriceFeed`** : exposée par un flux d'événements (`onPrice(callback)`), implémentée différemment par le Backtest Runner (lecture séquentielle PostgreSQL) et par le Market Data Provider (écoute WebSocket).
- **`OrderExecutor`** : exposée par une méthode (`executeOrder(signal)`), implémentée différemment en backtest (calcul instantané, sans latence) et en live (avec horodatage réel).

Le Strategy Engine et le Trading Engine ne connaissent que ces interfaces, jamais leur implémentation concrète. C'est ce découpage qui permettra, en phase 2, d'écrire des tests unitaires sur la logique de stratégie sans aucune dépendance à un réseau ou une base de données réelle.

## 4. Stack technique

| Couche | Choix | Justification |
|---|---|---|
| Langage | TypeScript | Typage statique, cohérence front/back, écosystème mature pour les API d'exchange |
| Runtime | Node.js | Standard pour TypeScript côté serveur |
| Framework backend | Express | Minimaliste, très répandu, suffisant pour le périmètre du projet |
| ORM | Prisma | Type-safe, migrations intégrées, bonne intégration TypeScript |
| Base de données | PostgreSQL | Robuste, adaptée aux séries temporelles et aux relations trades/positions |
| Frontend | React | Écosystème riche, composants réutilisables pour graphiques/tableaux |
| Communication live | WebSocket (API Backend ↔ Dashboard) | Push temps réel des prix/trades, cohérent avec le live trading |
| Client exchange | Package npm `binance` (tiagosiebler) | Typé, maintenu activement, gère REST + WebSocket + reconnexion automatique |
| Source historique | `data.binance.vision` | Téléchargement en masse, gratuit, sans authentification ni rate limit agressif |
| Tests unitaires / TDD | Vitest | Rapide, moderne, compatible avec l'écosystème Jest |
| Tests E2E | Playwright | Couvre les scénarios utilisateur sur le dashboard |
| Tests de performance | À définir en phase 2 (probablement sur le Backtest Runner) | Mesurer le temps de traitement sur un grand volume de bougies |
| Conteneurisation | Docker + Docker Compose | Déploiement reproductible, compatible Dokploy |
| Plateforme de déploiement | Dokploy (self-hosted PaaS) | Déploiement via Docker Compose, gestion native de PostgreSQL, routage via Traefik |

## 5. Modèle de données (vue d'ensemble)

Entités principales à modéliser via Prisma :

- **Candle** (bougie) : `timestamp`, `open`, `high`, `low`, `close`, `volume`, `interval`, `source` (historique ou live).
- **Strategy** : `nom`, `paramètres` (ex: période SMA, seuils RSI), `version`.
- **Signal** : `timestamp`, `strategyId`, `type` (BUY/SELL/HOLD), `prix au moment du signal`.
- **Trade** : `timestamp`, `signalId`, `type` (achat/vente), `prix d'exécution`, `quantité`, `mode` (backtest/live).
- **Position** : `quantité courante`, `prix moyen d'entrée`, `P&L latent`.
- **BacktestRun** : `strategyId`, `période testée`, `capital initial`, `P&L final`, `drawdown max`, `nombre de trades`.

Ce modèle sera affiné lors de la phase d'implémentation, mais sert de base de réflexion pour le schéma Prisma initial.

## 6. Stratégies de trading (phase 1 — algorithmes simples)

Indicateurs techniques à implémenter en premier, chacun comme fonction pure dans le Strategy Engine :

- **SMA (Simple Moving Average)** croisée : signal d'achat/vente sur croisement de deux moyennes mobiles (courte/longue période).
- **RSI (Relative Strength Index)** : signal sur dépassement de seuils de surachat/survente.
- **MACD** : signal sur croisement de la ligne MACD et de sa ligne de signal.

Chaque stratégie doit être paramétrable (périodes, seuils) sans modification du code, pour permettre des comparaisons via le Backtest Runner. L'optimisation (recherche des meilleurs paramètres, combinaison d'indicateurs, gestion du risque plus fine) constitue une itération ultérieure, une fois la mécanique de base validée par le backtest.

## 7. Tests (phase 2)

Bien que planifiés en seconde phase, les axes de test sont anticipés dès la conception pour orienter les choix d'architecture :

- **Tests unitaires / TDD** : ciblent en priorité le Strategy Engine (fonctions pures, faciles à tester avec des séries de prix fixtures) et le Trading Engine (règles de gestion du portefeuille). Outil : Vitest.
- **Tests end-to-end** : couvrent le parcours utilisateur sur le dashboard (affichage des prix, déclenchement d'un backtest, consultation de l'historique des trades). Outil : Playwright.
- **Tests de performance** : mesurent le temps d'exécution du Backtest Runner sur de gros volumes de données (ex: plusieurs années de bougies en granularité 1 minute), et la latence de bout en bout entre réception d'un prix live et mise à jour du dashboard.

## 8. Dockerisation et déploiement (Dokploy)

### 8.1 Principe général

L'application est découpée en **conteneurs Docker indépendants**, orchestrés via un unique `docker-compose.yml` à la racine du projet — c'est le format attendu par Dokploy pour les déploiements multi-services. Chaque service dispose de son propre Dockerfile multi-stage (build puis exécution), afin de garder les images de production légères.

| Service | Rôle | Build |
|---|---|---|
| `backend` | API Express + serveur WebSocket + Prisma + Strategy/Trading Engine + Backtest Runner + Historical Data Fetcher (un seul process Node.js) | Dockerfile multi-stage : `npm ci` + `tsc build` → exécution sur image Node slim |
| `frontend` | Dashboard React, buildé en fichiers statiques | Dockerfile multi-stage : build Vite/React → service via Nginx (ou équivalent léger) |
| `postgres` | Base de données | Soit conteneur PostgreSQL standard dans le compose, soit service PostgreSQL **géré nativement par Dokploy** (recommandé : sauvegardes intégrées, pas de gestion manuelle de volume) |

### 8.2 Contraintes imposées par Dokploy

Ces règles, propres au fonctionnement de Dokploy, doivent être respectées dès l'écriture du `docker-compose.yml` :

- **Pas de port bindé en dur.** Tout le trafic externe passe par Traefik, le reverse proxy intégré à Dokploy. Les services utilisent `expose` (port interne au réseau Docker) et non `ports: "80:80"` ou `"443:443"`, ces derniers étant réservés à Traefik.
- **Variables d'environnement via Dokploy, pas en dur.** Dokploy génère et gère un fichier `.env` à côté du compose ; toute donnée de configuration (URL de connexion PostgreSQL, port interne, etc.) doit être lue depuis `process.env`, jamais codée en dur dans le Dockerfile ou le code source.
- **Rebuild nécessaire après modification des variables d'environnement.** Les changements de configuration ne sont pas pris en compte à chaud ; il faut prévoir un redéploiement.
- **Réseau Docker.** Par défaut, les services du compose communiquent entre eux par leur nom de service (ex: le backend contacte `postgres:5432`). Si l'isolation par projet est activée côté Dokploy, aucune configuration réseau supplémentaire n'est nécessaire ; sinon, prévoir une déclaration de réseau externe (`dokploy-network`).
- **Persistance.** Si PostgreSQL est géré en conteneur (plutôt que via le service managé Dokploy), un volume nommé doit être déclaré pour que les données survivent aux redéploiements.
- **Migrations Prisma au démarrage.** Le conteneur `backend` doit exécuter les migrations Prisma (`prisma migrate deploy`) avant de démarrer le serveur, typiquement via un script de démarrage ou un hook `post_start`, plutôt qu'en intervention manuelle après déploiement.

### 8.3 Conséquences sur l'architecture applicative

- Le backend ne doit faire aucune hypothèse sur son URL publique ou son port externe : ces aspects sont entièrement délégués à Traefik/Dokploy.
- Toute configuration sensible (futures clés API si le projet évolue vers du trading réel, identifiants PostgreSQL) transite uniquement par variables d'environnement.
- Les logs doivent être écrits sur stdout/stderr (pas de fichiers de log locaux), pour rester consultables via l'interface de logs temps réel de Dokploy.

## 10. Points d'attention identifiés

- **Rate limiting** : l'API REST classique de Binance impose des limites de requêtes ; le recours à `data.binance.vision` pour l'historique limite ce risque, mais toute requête REST complémentaire (ex: complétion de données manquantes) doit gérer pagination et délais.
- **Déconnexions WebSocket** : Binance impose une déconnexion programmée toutes les 24h sur ses flux WebSocket ; le Market Data Provider doit gérer la reconnexion automatique (le package `binance` le fait nativement).
- **Dérive backtest/live** : il faut s'assurer que le Strategy Engine produit des résultats cohérents entre backtest et live sur les mêmes données, pour garantir que le backtest est représentatif.
- **Horodatage et fuseaux horaires** : toutes les données Binance sont en UTC ; la persistance et l'affichage doivent rester cohérents sur ce point.
- **Secrets et configuration Docker** : toute variable sensible (URL PostgreSQL, futures clés API) doit passer exclusivement par les variables d'environnement gérées par Dokploy, jamais en dur dans le code, le Dockerfile, ou versionnée dans le repo (prévoir un `.env.example` non sensible et un `.gitignore` couvrant les fichiers `.env`).

## 11. Étapes suggérées (roadmap indicative)

1. Mise en place du socle : projet TypeScript, Prisma + PostgreSQL, schéma de données initial.
2. Historical Data Fetcher : téléchargement et stockage des bougies BTC/USDT depuis `data.binance.vision`.
3. Strategy Engine : implémentation de SMA, RSI, MACD comme fonctions pures.
4. Backtest Runner : rejeu des données historiques à travers une stratégie, calcul du P&L simulé.
5. Trading Engine : gestion du portefeuille virtuel, règles de risque basiques.
6. Market Data Provider (live) : connexion WebSocket, branchement sur le même Strategy/Trading Engine.
7. API Backend + WebSocket : exposition des données au dashboard.
8. Dashboard React : affichage prix, position, historique, P&L.
9. Dockerisation : écriture des Dockerfiles backend/frontend, du `docker-compose.yml`, test du déploiement sur Dokploy.
10. Tests end-to-end et tests de performance : mis en place une fois le pipeline et le dashboard fonctionnels (les tests unitaires, eux, sont écrits en TDD strict au fil de chaque module depuis le début — voir `strategie-de-test.md` — pas en rattrapage).
11. Itération sur les stratégies : optimisation des paramètres, combinaison d'indicateurs, amélioration de la gestion du risque.

## 12. Glossaire rapide

- **Kline / bougie (candle)** : agrégation OHLCV (open/high/low/close/volume) sur un intervalle de temps donné.
- **P&L** : Profit and Loss, gain ou perte simulé.
- **Slippage** : écart entre le prix attendu d'un ordre et son prix d'exécution réel.
- **Drawdown** : baisse maximale du capital depuis un sommet, mesure de risque d'une stratégie.
- **Paper trading** : trading simulé, sans mouvement d'argent réel.
- **Traefik** : reverse proxy intégré à Dokploy, gère le routage HTTP/HTTPS vers les conteneurs.
