# Règles de gestion du risque et de la récompense

Ce document détaille les décisions prises pour chaque trade : combien engager, où sortir en perte, où sortir en gain, et selon quelles règles un trade est accepté ou refusé. Il complète le cahier des charges technique et appartient au **Trading Engine / Order Manager** (voir architecture générale).

Toutes les règles ci-dessous s'appliquent à un mode **une seule position ouverte à la fois** sur BTC/USDT : tant qu'un trade est en cours, aucune nouvelle entrée n'est prise, même si un nouveau signal apparaît.

## 1. Vue d'ensemble du processus de décision

Quand le Strategy Engine émet un signal `BUY`, le Trading Engine ne l'exécute pas tel quel : il passe par une série de calculs avant de décider d'entrer ou non.

```
Signal BUY
   │
   ▼
1. Calcul du score de confiance du signal
   │
   ▼
2. Calcul du stop-loss (niveau technique)
   │
   ▼
3. Calcul du take-profit (niveau technique)
   │
   ▼
4. Calcul du ratio risque/récompense (frais inclus)
   │
   ▼
5. Ratio acceptable ? ──Non──► Trade refusé, signal ignoré
   │
  Oui
   │
   ▼
6. Calcul de la taille de position (selon la confiance)
   │
   ▼
7. Entrée en position
   │
   ▼
8. Gestion de la position ouverte (trailing stop, sorties partielles)
```

Chaque étape est détaillée dans les sections suivantes.

## 2. Score de confiance du signal

Les indicateurs (SMA, RSI, MACD) renvoient nativement un signal binaire (`BUY` / `SELL` / `HOLD`), sans notion de force. Pour piloter la taille de position dynamiquement, on introduit un **score de confiance** entre 0 et 1, calculé à partir de la qualité du signal.

### 2.1 Principe de calcul

Le score de confiance combine plusieurs facteurs, chacun normalisé entre 0 et 1, puis moyennés (ou pondérés) :

- **Force du signal sur l'indicateur déclencheur.** Exemples : pour un croisement SMA, l'écart entre les deux moyennes au moment du croisement (un croisement net inspire plus confiance qu'un croisement à plat) ; pour le RSI, la distance par rapport au seuil (un RSI à 15 inspire plus confiance qu'un RSI à 28 pour un signal de survente à 30).
- **Confirmation par d'autres indicateurs.** Si plusieurs indicateurs pointent dans le même sens au même moment (ex: RSI en survente ET MACD qui croise à la hausse), le score augmente. Si les indicateurs sont contradictoires, le score baisse.
- **Contexte de volatilité.** Un signal dans un marché très volatil est moins fiable qu'un signal dans un marché stable ; ce facteur peut pondérer (réduire) le score plutôt que l'augmenter.

### 2.2 Format de sortie

Chaque stratégie doit exposer, en plus du signal, un score de confiance :

```ts
interface StrategySignal {
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number; // entre 0 (aucune confiance) et 1 (confiance maximale)
  timestamp: number;
  price: number;
}
```

### 2.3 Seuil minimal d'entrée

Un score de confiance trop faible (à définir empiriquement via le backtest, par exemple `confidence < 0.3`) doit empêcher l'entrée en position, indépendamment du ratio risque/récompense — un signal trop incertain ne mérite pas d'être tradé même si le setup technique est favorable.

## 3. Stop-loss : niveau technique

Le stop-loss n'est pas un pourcentage fixe arbitraire, mais déterminé par la structure du marché au moment de l'entrée.

### 3.1 Méthodes de calcul (à combiner ou choisir selon le contexte)

- **Support/résistance récent.** Le stop-loss est placé légèrement sous le dernier support significatif (pour un achat) — un support cassé invalide la thèse du trade.
- **ATR (Average True Range).** Le stop-loss est placé à une distance du prix d'entrée proportionnelle à la volatilité récente (ex: `prix d'entrée - 1.5 × ATR(14)`), ce qui adapte automatiquement le stop à des marchés plus ou moins agités, sans avoir à redéfinir un pourcentage à la main.
- **Combinaison des deux.** Calculer les deux niveaux et retenir le plus prudent (le plus proche du prix d'entrée), pour éviter qu'un ATR très large ne génère un stop-loss déraisonnablement éloigné.

### 3.2 Trailing stop

Une fois en position et en gain, le stop-loss est remonté progressivement pour sécuriser une partie du profit, sans jamais redescendre.

- **Règle de base** : le stop-loss ne peut que monter (ou rester identique), jamais redescendre, même si le prix recule temporairement.
- **Déclenchement** : le trailing s'active une fois qu'un seuil de gain minimal est atteint (ex: dès que le prix a parcouru 50% de la distance jusqu'au take-profit), pour éviter de resserrer le stop trop tôt et sortir sur du simple bruit de marché.
- **Méthode de calcul du nouveau niveau** : recalculée selon la même logique que le stop initial (ATR ou structure de marché), recalculée à chaque nouvelle bougie/tick tant qu'elle progresse dans le bon sens.

## 4. Take-profit : niveaux techniques

Le take-profit est défini par l'analyse technique plutôt que par un ratio fixe, ce qui implique qu'il peut y avoir plusieurs niveaux de sortie successifs.

### 4.1 Identification des niveaux

- **Résistances identifiées** sur l'historique récent (zones où le prix a déjà buté par le passé).
- **Bandes de Bollinger** : la bande supérieure peut servir de premier objectif de sortie en contexte de range ou de retour à la moyenne.
- **Niveaux de Fibonacci ou extensions** (optionnel, à évaluer en phase d'optimisation) si le besoin de précision augmente.

### 4.2 Sorties partielles

Plutôt qu'une sortie unique, le take-profit peut être découpé en plusieurs paliers :

- **Premier palier** (ex: au premier niveau de résistance) : sortie d'une portion de la position (ex: 50%), pour sécuriser un gain et réduire l'exposition.
- **Reste de la position** : laissé courir, piloté par le trailing stop défini en section 3.2, pour capter un mouvement plus large si le marché continue dans le bon sens.
- **Le pourcentage exact sorti à chaque palier** est un paramètre de la stratégie, ajustable et testable via le Backtest Runner — il n'y a pas de valeur "correcte" universelle, seulement des compromis testés empiriquement.

## 5. Ratio risque/récompense (frais inclus)

C'est le filtre final avant d'accepter un trade : si le rapport entre gain potentiel et perte potentielle est trop faible, le trade est refusé même si le signal et la confiance sont bons.

### 5.1 Formule de base

```
Risque       = prix d'entrée − prix du stop-loss        (en valeur, par unité de BTC)
Récompense   = prix du take-profit (1er palier) − prix d'entrée
Ratio brut   = Récompense / Risque
```

### 5.2 Intégration des frais

Les frais d'aller-retour (achat + vente) doivent être déduits de la récompense avant calcul du ratio, sous peine de surestimer systématiquement la rentabilité réelle d'un trade — particulièrement sur des mouvements de faible amplitude où les frais peuvent représenter une part significative du gain visé.

```
Frais estimés = 2 × taux de frais taker × prix d'entrée    (hypothèse par défaut : 0,10 % par ordre, soit 0,20 % l'aller-retour, sans réduction BNB ni palier VIP)
Récompense nette = (prix du take-profit − prix d'entrée) − Frais estimés
Ratio net = Récompense nette / Risque
```

Le taux de frais doit être un **paramètre configurable** (pas une constante figée dans le code), pour refléter d'éventuels changements de palier VIP ou de réduction BNB à l'avenir.

### 5.3 Règle d'acceptation du trade

Un seuil minimal de ratio net est défini (ex: `ratio net ≥ 1.5`), en deçà duquel le trade est automatiquement refusé, quelle que soit la qualité du signal d'entrée. Ce seuil est un paramètre testable et ajustable via le Backtest Runner — il n'y a pas de valeur universelle, mais un compromis entre fréquence de trades acceptés et qualité moyenne des trades pris.

### 5.4 Cas de refus

Un trade est refusé dans les cas suivants, listés par ordre de vérification :

1. Score de confiance du signal sous le seuil minimal (section 2.3).
2. Une position est déjà ouverte (règle "une seule position à la fois").
3. Ratio net sous le seuil minimal défini (section 5.3).

Chaque refus doit être journalisé (raison du refus, valeurs calculées) pour permettre, en phase d'analyse, de comprendre combien d'opportunités sont filtrées et pourquoi — utile pour ajuster les seuils sans devoir relire tout l'historique de prix à la main.

## 6. Taille de position selon la confiance

Une fois le trade accepté, la taille de position (% du portefeuille engagé) est calculée à partir du score de confiance.

### 6.1 Principe

```
Taille de position (%) = Taille minimale + (Taille maximale − Taille minimale) × confidence
```

Avec des bornes explicites et conservatrices à définir (ex: `Taille minimale = 2%`, `Taille maximale = 10%` du portefeuille), pour qu'un signal même très confiant ne mette jamais en jeu une part démesurée du capital — cohérent avec l'objectif affiché d'approche conservatrice qui évite de perdre rapidement le portefeuille.

### 6.2 Lien avec le risque réel

La taille de position déterminée ici, combinée à la distance du stop-loss (section 3), donne le risque réel en valeur absolue pour le trade :

```
Risque réel en valeur = Taille de position (en valeur) × (Risque / prix d'entrée)
```

Bien qu'aucun plafond de risque maximal indépendant n'ait été retenu pour ce projet (la taille de position dynamique étant jugée suffisante pour limiter le risque), il est recommandé de **calculer et journaliser** ce risque réel à chaque trade, pour vérifier empiriquement via le backtest qu'aucune combinaison de paramètres ne produit des pertes disproportionnées sur un trade isolé.

## 7. Paramètres à exposer (résumé)

Tous les éléments suivants doivent être configurables (et non codés en dur), pour permettre l'optimisation via le Backtest Runner :

| Paramètre | Exemple de valeur initiale | Description |
|---|---|---|
| `minConfidenceThreshold` | 0.3 | Score de confiance minimal pour considérer un signal |
| `stopLossMethod` | `ATR` | Méthode de calcul du stop-loss (`ATR`, `support`, ou combinaison) |
| `atrMultiplier` | 1.5 | Multiplicateur appliqué à l'ATR pour le stop-loss |
| `trailingActivationRatio` | 0.5 | Fraction du chemin vers le take-profit à partir de laquelle le trailing stop s'active |
| `takeProfitMethod` | `resistance+bollinger` | Méthode(s) de calcul des niveaux de take-profit |
| `partialExitRatio` | 0.5 | Fraction de la position sortie au premier palier de take-profit |
| `takerFeeRate` | 0.001 (0,10 %) | Taux de frais utilisé dans le calcul du ratio net |
| `minNetRiskRewardRatio` | 1.5 | Ratio net minimal pour accepter un trade |
| `minPositionSize` | 0.02 (2 %) | Taille de position minimale du portefeuille |
| `maxPositionSize` | 0.10 (10 %) | Taille de position maximale du portefeuille |

## 8. Points à valider via le backtest

Ce document fixe les **règles** ; les **valeurs numériques** des paramètres (seuils, multiplicateurs) ne doivent pas être figées définitivement à la conception. Elles sont des hypothèses de départ, à confronter aux données historiques via le Backtest Runner avant toute mise en live :

- Le seuil de confiance minimal filtre-t-il efficacement les mauvais signaux sans éliminer trop d'opportunités valables ?
- Le multiplicateur ATR produit-il des stop-loss ni trop serrés (sorties prématurées sur du bruit) ni trop larges (risque excessif par trade) ?
- Le ratio risque/récompense minimal exigé laisse-t-il suffisamment de trades pour être statistiquement significatif sur la période testée ?
- La taille de position dynamique, combinée aux autres règles, produit-elle un profil de drawdown acceptable sur l'historique testé ?

## 9. Glossaire complémentaire

- **ATR (Average True Range)** : indicateur mesurant l'amplitude moyenne des mouvements de prix récents, utilisé ici pour adapter le stop-loss à la volatilité du marché.
- **Trailing stop** : stop-loss qui se déplace dans le sens favorable au trade pour sécuriser des gains, sans jamais reculer.
- **Maker / taker** : un ordre *maker* ajoute de la liquidité au carnet d'ordres (limite non exécutée immédiatement) ; un ordre *taker* retire de la liquidité (exécution immédiate au prix du marché). Les frais taker sont généralement plus élevés ou égaux aux frais maker.
- **Ratio risque/récompense** : rapport entre la perte potentielle (jusqu'au stop-loss) et le gain potentiel (jusqu'au take-profit) d'un trade.
- **Drawdown** : baisse maximale du capital depuis un sommet, mesure de risque d'une stratégie sur une période donnée.
