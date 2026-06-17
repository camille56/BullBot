# Stratégie de test — TDD, E2E, Performance

Ce document définit comment les tests sont écrits sur ce projet. Il complète le cahier des charges technique et le document de règles de risque/récompense. Contrairement à ces deux documents qui décrivent *quoi* construire, celui-ci décrit *comment* le valider à chaque étape.

## 1. Principe directeur : TDD strict, partout

Sur ce projet, **aucune ligne de code de production n'est écrite avant son test**. Ce n'est pas une recommandation, c'est la règle de fonctionnement : le cycle est toujours Red → Green → Refactor.

```
1. RED      : écrire un test qui échoue, pour une fonctionnalité qui n'existe pas encore
2. GREEN    : écrire le code minimal qui fait passer le test, sans optimisation prématurée
3. REFACTOR : nettoyer le code (et/ou le test) sans changer le comportement, tests toujours verts
```

Cette discipline s'applique à **tous les modules**, y compris ceux qui semblent "triviaux" (ex: un parseur de fichier CSV) ou "juste de la plomberie" (ex: une route Express). L'objectif n'est pas seulement la qualité du bot final, mais l'entraînement à la pratique du TDD elle-même — donc la rigueur prime même quand elle semble disproportionnée par rapport à la complexité du code visé.

### 1.1 Ce que ça implique concrètement

- Avant d'écrire `calculateSMA()`, on écrit `calculateSMA.test.ts` avec au moins un cas qui échoue parce que la fonction n'existe pas.
- Avant d'ajouter un champ à un endpoint Express, on écrit le test qui vérifie la présence de ce champ dans la réponse.
- Avant de corriger un bug, on écrit un test qui reproduit le bug (donc qui échoue), puis on corrige.

### 1.2 Pas de seuil de couverture chiffré

Aucun pourcentage de couverture de code n'est imposé (pas de "80% obligatoire"). La raison : un seuil chiffré pousse souvent à écrire des tests qui font grimper le compteur sans apporter de valeur (tester un getter trivial, dupliquer des assertions). La question à se poser pour chaque test n'est pas *"est-ce que ça fait monter la couverture ?"* mais *"est-ce que ce test échouerait si j'introduisais un bug réel ici ?"*. Si la réponse est oui, le test a de la valeur, peu importe son impact sur un pourcentage global.

## 2. Les trois niveaux de test du projet

| Niveau | Outil | Cible | Rapidité d'exécution |
|---|---|---|---|
| Unitaire (TDD) | Vitest | Fonctions et modules isolés (Strategy Engine, Trading Engine, calculs de risque) | Millisecondes, exécuté en continu pendant le développement |
| End-to-end | Playwright | Parcours utilisateur complet sur le dashboard | Secondes, exécuté avant chaque commit/merge |
| Performance | Vitest (avec mesures de temps) ou script dédié | Backtest Runner sur gros volumes, latence du flux live | Variable, exécuté ponctuellement (pas à chaque commit) |

Chaque niveau a un rôle distinct : l'unitaire valide la logique métier en isolation totale, l'E2E valide que les briques s'assemblent correctement du point de vue utilisateur, la performance valide que le système reste utilisable à l'échelle réelle des données.

## 3. Tests unitaires par module

### 3.1 Strategy Engine — le module le plus critique à tester

Le Strategy Engine est constitué de fonctions pures (entrée = série de prix, sortie = signal). C'est le terrain le plus favorable au TDD : pas de mock nécessaire, pas d'état caché, juste des entrées et des sorties vérifiables.

**Exemple de cas de test pour `calculateSMA(prices: number[], period: number): number[]` :**

```ts
describe('calculateSMA', () => {
  it('calcule la moyenne mobile simple sur une série de prix connue', () => {
    const prices = [10, 20, 30, 40, 50];
    const result = calculateSMA(prices, 3);
    // SMA(3) sur [10,20,30]=20, [20,30,40]=30, [30,40,50]=40
    expect(result).toEqual([20, 30, 40]);
  });

  it('retourne un tableau vide si la série est plus courte que la période', () => {
    const prices = [10, 20];
    const result = calculateSMA(prices, 5);
    expect(result).toEqual([]);
  });

  it('lève une erreur explicite si la période est nulle ou négative', () => {
    expect(() => calculateSMA([10, 20, 30], 0)).toThrow();
  });

  it('gère une série de prix vide sans planter', () => {
    expect(calculateSMA([], 3)).toEqual([]);
  });
});
```

**Exemple de cas de test pour le signal RSI (`calculateRSI` + génération de signal BUY/SELL/HOLD) :**

```ts
describe('RSI signal generation', () => {
  it('génère un signal BUY quand le RSI descend sous le seuil de survente', () => {
    const prices = fixtureOversoldScenario(); // fixture : série simulant une chute continue
    const signal = generateRSISignal(prices, { period: 14, oversold: 30, overbought: 70 });
    expect(signal.type).toBe('BUY');
  });

  it('génère un signal HOLD quand le RSI est dans la zone neutre', () => {
    const prices = fixtureNeutralScenario();
    const signal = generateRSISignal(prices, { period: 14, oversold: 30, overbought: 70 });
    expect(signal.type).toBe('HOLD');
  });

  it('ne plante pas si la série de prix est plus courte que la période RSI', () => {
    const prices = [100, 101, 102]; // période 14 non atteinte
    expect(() => generateRSISignal(prices, { period: 14, oversold: 30, overbought: 70 })).not.toThrow();
  });
});
```

**Cas limites systématiquement à couvrir pour chaque indicateur :**
- Série de prix vide.
- Série plus courte que la période de l'indicateur.
- Tous les prix identiques (variance nulle — piège classique pour RSI, qui divise par une variation).
- Valeurs aux bornes exactes des seuils (ex: RSI exactement à 30, ni au-dessus ni en dessous).

### 3.2 Trading Engine / règles de risque

Ce module combine plusieurs calculs définis dans le document de risque/récompense ; chaque règle doit être testée séparément avant d'être assemblée.

**Exemple pour le calcul du ratio risque/récompense net (frais inclus) :**

```ts
describe('calculateNetRiskRewardRatio', () => {
  it('calcule un ratio net inférieur au ratio brut une fois les frais déduits', () => {
    const result = calculateNetRiskRewardRatio({
      entryPrice: 100,
      stopLossPrice: 95,
      takeProfitPrice: 110,
      takerFeeRate: 0.001,
    });
    // Risque = 5, Récompense brute = 10, Frais = 2 × 0.001 × 100 = 0.2
    // Récompense nette = 9.8, Ratio net = 9.8 / 5 = 1.96
    expect(result).toBeCloseTo(1.96, 2);
  });

  it('retourne un ratio négatif ou nul si les frais dépassent la récompense brute', () => {
    const result = calculateNetRiskRewardRatio({
      entryPrice: 100,
      stopLossPrice: 99.9,
      takeProfitPrice: 100.05,
      takerFeeRate: 0.001,
    });
    expect(result).toBeLessThanOrEqual(0);
  });
});

describe('isTradeAccepted', () => {
  it('refuse le trade si le ratio net est sous le seuil minimal', () => {
    const decision = isTradeAccepted({ netRatio: 1.2, minRatio: 1.5, confidence: 0.8, minConfidence: 0.3 });
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toBe('RATIO_TOO_LOW');
  });

  it('refuse le trade si la confiance est sous le seuil minimal, même avec un bon ratio', () => {
    const decision = isTradeAccepted({ netRatio: 3, minRatio: 1.5, confidence: 0.1, minConfidence: 0.3 });
    expect(decision.accepted).toBe(false);
    expect(decision.reason).toBe('CONFIDENCE_TOO_LOW');
  });

  it('accepte le trade si toutes les conditions sont remplies', () => {
    const decision = isTradeAccepted({ netRatio: 2, minRatio: 1.5, confidence: 0.6, minConfidence: 0.3 });
    expect(decision.accepted).toBe(true);
  });
});
```

**Exemple pour le trailing stop :**

```ts
describe('updateTrailingStop', () => {
  it('remonte le stop-loss quand le prix progresse favorablement au-delà du seuil d\'activation', () => {
    const newStop = updateTrailingStop({
      currentStopLoss: 95,
      entryPrice: 100,
      currentPrice: 108,
      takeProfitPrice: 115,
      activationRatio: 0.5, // s'active après 50% du chemin vers le take-profit
    });
    expect(newStop).toBeGreaterThan(95);
  });

  it('ne fait jamais redescendre le stop-loss, même si le prix recule ensuite', () => {
    const newStop = updateTrailingStop({
      currentStopLoss: 102, // déjà remonté précédemment
      entryPrice: 100,
      currentPrice: 101, // le prix a reculé
      takeProfitPrice: 115,
      activationRatio: 0.5,
    });
    expect(newStop).toBe(102); // inchangé, jamais abaissé
  });

  it('ne s\'active pas avant le seuil d\'activation défini', () => {
    const newStop = updateTrailingStop({
      currentStopLoss: 95,
      entryPrice: 100,
      currentPrice: 102, // progression faible, sous le seuil de 50%
      takeProfitPrice: 115,
      activationRatio: 0.5,
    });
    expect(newStop).toBe(95); // pas encore de trailing
  });
});
```

### 3.3 Historical Data Fetcher

Module avec une dépendance externe (HTTP vers `data.binance.vision`), donc le test unitaire doit **mocker la couche réseau** pour rester rapide et déterministe.

```ts
describe('parseKlinesArchive', () => {
  it('parse correctement un fichier CSV de klines au format Binance', () => {
    const rawCsv = fixtureBinanceKlinesCSV(); // fixture statique, extrait réel anonymisé
    const candles = parseKlinesArchive(rawCsv);
    expect(candles[0]).toMatchObject({ open: expect.any(Number), close: expect.any(Number) });
  });

  it('ignore les lignes malformées sans planter tout le parsing', () => {
    const rawCsv = '1234,bad,data\n' + fixtureBinanceKlinesCSV();
    expect(() => parseKlinesArchive(rawCsv)).not.toThrow();
  });
});

describe('HistoricalDataFetcher.fetchRange (réseau mocké)', () => {
  it('ne re-télécharge pas une période déjà présente en base', async () => {
    const mockDb = createMockCandleRepository({ existingRange: ['2024-01-01', '2024-01-31'] });
    const fetcher = new HistoricalDataFetcher(mockHttpClient, mockDb);
    await fetcher.fetchRange('2024-01-01', '2024-01-31');
    expect(mockHttpClient.get).not.toHaveBeenCalled();
  });
});
```

### 3.4 API Backend (routes Express)

Les routes sont testées en isolation avec une base de données de test (ou un mock du repository Prisma), jamais contre la base de production.

```ts
describe('GET /api/trades', () => {
  it('retourne 200 et la liste des trades existants', async () => {
    const response = await request(app).get('/api/trades');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('retourne 400 si les paramètres de pagination sont invalides', async () => {
    const response = await request(app).get('/api/trades?page=-1');
    expect(response.status).toBe(400);
  });
});
```

## 4. Tests end-to-end (Playwright)

Les tests E2E valident des parcours complets côté dashboard, pas des détails d'implémentation. Ils doivent rester peu nombreux mais représentatifs des usages réels.

**Scénarios E2E prioritaires pour ce projet :**

```ts
test('le dashboard affiche le prix BTC/USDT courant au chargement', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('current-price')).toBeVisible();
  await expect(page.getByTestId('current-price')).not.toHaveText('');
});

test('lancer un backtest depuis l\'interface affiche les résultats', async ({ page }) => {
  await page.goto('/backtest');
  await page.getByLabel('Stratégie').selectOption('SMA');
  await page.getByLabel('Date de début').fill('2024-01-01');
  await page.getByLabel('Date de fin').fill('2024-06-01');
  await page.getByRole('button', { name: 'Lancer le backtest' }).click();
  await expect(page.getByTestId('backtest-pnl-result')).toBeVisible({ timeout: 15000 });
});

test('l\'historique des trades affiche les trades passés avec leur P&L', async ({ page }) => {
  await page.goto('/trades');
  const rows = page.getByTestId('trade-row');
  await expect(rows.first()).toBeVisible();
});
```

**Règle pour l'E2E** : privilégier les sélecteurs `data-testid` plutôt que des sélecteurs CSS fragiles (classes, structure DOM), pour que les tests ne cassent pas à chaque ajustement visuel du dashboard.

## 5. Tests de performance

Contrairement à l'unitaire et l'E2E, les tests de performance ne sont pas exécutés à chaque commit (trop coûteux), mais ponctuellement, en particulier avant toute optimisation du Backtest Runner ou changement structurel.

### 5.1 Cibles à mesurer

- **Débit du Backtest Runner** : temps nécessaire pour rejouer un an de données en granularité 1 minute (~525 600 bougies) à travers une stratégie donnée.
- **Latence du flux live** : délai entre la réception d'un prix via WebSocket et sa diffusion au dashboard via le WebSocket interne.
- **Temps de réponse de l'API REST** sur les endpoints retournant de gros volumes (ex: historique complet des trades).

### 5.2 Exemple de structure de test de performance

```ts
describe('Backtest Runner performance', () => {
  it('traite un an de bougies 1 minute en moins de X secondes', async () => {
    const candles = generateSyntheticCandles({ count: 525_600 }); // fixture générée, pas de vraies données nécessaires
    const start = performance.now();
    await backtestRunner.run(candles, smaStrategy);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10_000); // seuil à calibrer après une première mesure de référence
  });
});
```

**Important** : le seuil numérique (`10_000` ms ci-dessus) ne doit pas être inventé à l'avance. La première exécution sert à établir une **mesure de référence** ; le seuil du test est ensuite fixé légèrement au-dessus de cette référence, pour détecter une régression future plutôt que pour viser un objectif arbitraire non justifié.

### 5.3 Ce qu'on ne fait pas en performance

Pas de test de charge réseau réel contre l'API Binance (risque de rate limiting, non reproductible) : les tests de performance utilisent des données synthétiques ou des fixtures déjà téléchargées, jamais d'appels réseau réels vers Binance.

## 6. Organisation des fichiers de test

```
src/
  strategy-engine/
    sma.ts
    sma.test.ts
    rsi.ts
    rsi.test.ts
  trading-engine/
    risk-reward.ts
    risk-reward.test.ts
    trailing-stop.ts
    trailing-stop.test.ts
  historical-data-fetcher/
    fetcher.ts
    fetcher.test.ts
  api/
    routes/
      trades.ts
      trades.test.ts
e2e/
  dashboard.spec.ts
  backtest.spec.ts
performance/
  backtest-runner.perf.test.ts
```

Le test vit **juste à côté** du fichier qu'il teste (convention colocalisée), sauf pour l'E2E et la performance qui ont leurs propres dossiers à la racine, puisqu'ils ne testent pas un fichier unique mais un comportement transverse.

## 7. Fixtures partagées

Pour éviter de dupliquer des séries de prix arbitraires dans chaque test, les fixtures réutilisables (scénario de hausse continue, de chute continue, de range neutre, de forte volatilité) sont centralisées :

```
test/
  fixtures/
    price-series.ts   // fixtureOversoldScenario(), fixtureNeutralScenario(), etc.
    binance-csv.ts     // fixtureBinanceKlinesCSV()
```

Une fixture doit représenter un **scénario de marché nommé et compréhensible** (ex: `fixtureOversoldScenario`), pas juste un tableau de nombres sans contexte — l'intention du test doit rester lisible même sans ouvrir le fichier de fixture.

## 8. Ce que ce document n'impose pas

- Pas de seuil de couverture chiffré (voir 1.2).
- Pas d'obligation de mutation testing ou d'outils de test avancés à ce stade — à réévaluer si le projet mûrit.
- Pas de test de charge réseau réel contre Binance, ni en unitaire ni en performance.
- Pas de TDD imposé sur la configuration Docker elle-même (Dockerfiles, compose) : le TDD s'applique au code applicatif, pas à l'infrastructure, qui se valide par déploiement réel.
