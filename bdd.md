# Scénarios de comportement (BDD)

Un scénario par test. Organisé par module, en miroir de `backend/src/`.
Écrit avant le test correspondant (TDD).

## Strategy Engine

### calculateSMA (`strategy-engine/sma.ts`)

**Calcul standard**
Étant donné une série de prix et une période valides
Quand un calcul de moyenne mobile est demandé
Alors le tableau des moyennes glissantes est retourné

**Période invalide**
Étant donné une période nulle ou négative
Quand un calcul de moyenne mobile est demandé
Alors une erreur est levée

**Série plus courte que la période**
Étant donné une série de prix plus courte que la période demandée
Quand un calcul de moyenne mobile est demandé
Alors un tableau vide est retourné et aucune erreur n'est levée

### generateSMASignal (`strategy-engine/sma.ts`)

**Signal d'achat sur croisement haussier**
Étant donné une série de prix pour laquelle la SMA courte croise la SMA longue vers le haut
Quand un signal SMA est demandé
Alors un signal BUY est retourné

**Signal de vente sur croisement baissier**
Étant donné une série de prix pour laquelle la SMA courte croise la SMA longue vers le bas
Quand un signal SMA est demandé
Alors un signal SELL est retourné

**Absence de croisement**
Étant donné une série de prix pour laquelle la SMA courte ne croise pas la SMA longue
Quand un signal SMA est demandé
Alors un signal HOLD est retourné

**Moyennes exactement égales**
Étant donné une série de prix pour laquelle la SMA courte et la SMA longue sont exactement égales au point considéré
Quand un signal SMA est demandé
Alors le comportement à l'égalité est défini sans ambiguïté (non considéré comme un croisement)

**Périodes invalides**
Étant donné une période courte supérieure ou égale à la période longue
Quand un signal SMA est demandé
Alors une erreur est levée

**Série plus courte que la période longue**
Étant donné une série de prix plus courte que la période longue
Quand un signal SMA est demandé
Alors aucune erreur n'est levée

### calculateRSI (`strategy-engine/rsi.ts`)

**Calcul standard**
Étant donné une série de prix et une période valides
Quand un calcul de RSI est demandé
Alors la valeur du RSI est retournée pour chaque point disponible

**Période invalide**
Étant donné une période nulle ou négative
Quand un calcul de RSI est demandé
Alors une erreur est levée

**Série plus courte que la période**
Étant donné une série de prix plus courte que la période demandée
Quand un calcul de RSI est demandé
Alors un tableau vide est retourné et aucune erreur n'est levée

**Prix constants (variance nulle)**
Étant donné une série de prix strictement identiques
Quand un calcul de RSI est demandé
Alors aucune division par zéro ne se produit et une valeur de RSI valide est retournée

### generateRSISignal (`strategy-engine/rsi.ts`)

**Signal d'achat en zone de survente**
Étant donné une série de prix dont le RSI calculé descend sous le seuil de survente
Quand un signal RSI est demandé
Alors un signal BUY est retourné

**Signal de vente en zone de surachat**
Étant donné une série de prix dont le RSI calculé dépasse le seuil de surachat
Quand un signal RSI est demandé
Alors un signal SELL est retourné

**Zone neutre**
Étant donné une série de prix dont le RSI calculé se situe entre les seuils de survente et de surachat
Quand un signal RSI est demandé
Alors un signal HOLD est retourné

**Valeur exactement à la borne d'un seuil**
Étant donné une série de prix dont le RSI calculé est exactement égal au seuil de survente ou de surachat
Quand un signal RSI est demandé
Alors le comportement à la borne est défini sans ambiguïté (ni considéré au-dessus, ni en dessous du seuil)

**Série plus courte que la période RSI**
Étant donné une série de prix plus courte que la période RSI configurée
Quand un signal RSI est demandé
Alors aucune erreur n'est levée

### calculateMACD (`strategy-engine/macd.ts`)

**Calcul standard**
Étant donné une série de prix et des périodes (rapide, lente, signal) valides
Quand un calcul de MACD est demandé
Alors la ligne MACD, la ligne de signal et l'histogramme sont retournés pour chaque point disponible

**Périodes invalides**
Étant donné une période rapide supérieure ou égale à la période lente
Quand un calcul de MACD est demandé
Alors une erreur est levée

**Série plus courte que la période nécessaire**
Étant donné une série de prix plus courte que la période lente additionnée à la période de signal
Quand un calcul de MACD est demandé
Alors un tableau vide est retourné et aucune erreur n'est levée

**Prix constants (variance nulle)**
Étant donné une série de prix strictement identiques
Quand un calcul de MACD est demandé
Alors la ligne MACD et l'histogramme valent zéro sur toute la série, sans erreur

### generateMACDSignal (`strategy-engine/macd.ts`)

**Signal d'achat sur croisement haussier**
Étant donné une série de prix pour laquelle la ligne MACD croise la ligne de signal vers le haut
Quand un signal MACD est demandé
Alors un signal BUY est retourné

**Signal de vente sur croisement baissier**
Étant donné une série de prix pour laquelle la ligne MACD croise la ligne de signal vers le bas
Quand un signal MACD est demandé
Alors un signal SELL est retourné

**Absence de croisement**
Étant donné une série de prix pour laquelle la ligne MACD ne croise pas la ligne de signal
Quand un signal MACD est demandé
Alors un signal HOLD est retourné

**Lignes exactement égales**
Étant donné une série de prix pour laquelle la ligne MACD et la ligne de signal sont exactement égales au point considéré
Quand un signal MACD est demandé
Alors le comportement à l'égalité est défini sans ambiguïté (non considéré comme un croisement)

**Série plus courte que la période nécessaire**
Étant donné une série de prix plus courte que la période lente additionnée à la période de signal du MACD
Quand un signal MACD est demandé
Alors aucune erreur n'est levée

## Trading Engine

### calculateNetRiskRewardRatio (`trading-engine/risk-reward.ts`)

**Calcul standard**
Étant donné un prix d'entrée, un stop-loss, un take-profit et un taux de frais taker valides
Quand le ratio risque/récompense net est demandé
Alors le ratio net (récompense nette des frais, divisée par le risque) est retourné

**Stop-loss invalide**
Étant donné un stop-loss supérieur ou égal au prix d'entrée
Quand le ratio risque/récompense net est demandé
Alors une erreur est levée

**Frais qui dépassent la récompense brute**
Étant donné des frais estimés (aller-retour) supérieurs à la récompense brute (take-profit moins prix d'entrée)
Quand le ratio risque/récompense net est demandé
Alors un ratio net négatif est retourné, sans erreur

### updateTrailingStop (`trading-engine/trailing-stop.ts`)

**Trailing non actif**
Étant donné un prix actuel n'ayant pas encore parcouru le ratio d'activation du trailing vers le take-profit
Quand une mise à jour du trailing stop est demandée
Alors le stop-loss actuel est retourné inchangé

**Trailing actif, nouveau niveau plus favorable**
Étant donné un prix actuel ayant dépassé le ratio d'activation et un niveau de stop-loss candidat supérieur au stop-loss actuel
Quand une mise à jour du trailing stop est demandée
Alors le niveau candidat est retourné

**Le stop-loss ne recule jamais**
Étant donné un niveau de stop-loss candidat inférieur au stop-loss actuel, alors même que le trailing est actif
Quand une mise à jour du trailing stop est demandée
Alors le stop-loss actuel est conservé, jamais abaissé

**Exactement au seuil d'activation**
Étant donné un prix actuel ayant parcouru exactement le ratio d'activation
Quand une mise à jour du trailing stop est demandée
Alors le trailing est considéré actif (comportement défini sans ambiguïté à la borne)

### decideTradeAcceptance (`trading-engine/acceptance-decision.ts`)

**Confidence sous le seuil minimal**
Étant donné un signal dont la confidence est sous le seuil minimal
Quand la décision d'acceptation du trade est demandée
Alors le trade est rejeté pour le motif "confidence insuffisante"

**Confidence exactement au seuil minimal**
Étant donné un signal dont la confidence est exactement égale au seuil minimal
Quand la décision d'acceptation du trade est demandée
Alors le trade n'est pas rejeté pour ce motif (la vérification suivante s'applique)

**Position déjà ouverte**
Étant donné une confidence suffisante mais une position déjà ouverte
Quand la décision d'acceptation du trade est demandée
Alors le trade est rejeté pour le motif "position déjà ouverte"

**Ratio net sous le seuil minimal**
Étant donné une confidence suffisante, aucune position ouverte, mais un ratio risque/récompense net sous le seuil minimal
Quand la décision d'acceptation du trade est demandée
Alors le trade est rejeté pour le motif "ratio net insuffisant", avec le ratio calculé renvoyé

**Trade accepté**
Étant donné une confidence suffisante, aucune position ouverte, et un ratio net au-dessus du seuil minimal
Quand la décision d'acceptation du trade est demandée
Alors le trade est accepté, avec le ratio calculé renvoyé

**Ordre de priorité : confidence avant position ouverte**
Étant donné une confidence sous le seuil minimal ET une position déjà ouverte
Quand la décision d'acceptation du trade est demandée
Alors le motif de rejet renvoyé est "confidence insuffisante", pas "position déjà ouverte"

**Ordre de priorité : position ouverte avant ratio net**
Étant donné une position déjà ouverte ET un ratio net qui serait insuffisant
Quand la décision d'acceptation du trade est demandée
Alors le motif de rejet renvoyé est "position déjà ouverte", pas "ratio net insuffisant"

### calculatePositionSize (`trading-engine/position-size.ts`)

**Calcul standard**
Étant donné un score de confidence, une taille minimale et une taille maximale valides
Quand la taille de position est demandée
Alors la taille retournée varie linéairement entre la taille minimale et la taille maximale selon la confidence

**Confidence minimale (0)**
Étant donné une confidence de 0
Quand la taille de position est demandée
Alors la taille minimale est retournée

**Confidence maximale (1)**
Étant donné une confidence de 1
Quand la taille de position est demandée
Alors la taille maximale est retournée

**Confidence hors bornes**
Étant donné une confidence supérieure à 1
Quand la taille de position est demandée
Alors la taille retournée ne dépasse jamais la taille maximale configurée

### calculateATR (`trading-engine/atr.ts`)

**Calcul standard**
Étant donné une série de bougies (high/low/close) et une période valides
Quand un calcul d'ATR est demandé
Alors le tableau des valeurs d'ATR (moyenne du True Range sur la période) est retourné

**Période invalide**
Étant donné une période nulle ou négative
Quand un calcul d'ATR est demandé
Alors une erreur est levée

**Série plus courte que la période**
Étant donné une série de bougies plus courte que la période demandée
Quand un calcul d'ATR est demandé
Alors un tableau vide est retourné et aucune erreur n'est levée

**Première bougie sans clôture précédente**
Étant donné une série de bougies où la première n'a pas de clôture précédente disponible
Quand un calcul d'ATR est demandé
Alors le True Range de la première bougie est calculé à partir de son seul écart haut/bas, sans erreur

### calculateATRStopLoss (`trading-engine/atr.ts`)

**Calcul standard**
Étant donné un prix d'entrée, une valeur d'ATR et un multiplicateur valides
Quand le stop-loss basé sur l'ATR est demandé
Alors le niveau retourné est le prix d'entrée moins le multiplicateur fois l'ATR

**ATR nul (marché plat)**
Étant donné un ATR de 0
Quand le stop-loss basé sur l'ATR est demandé
Alors le niveau retourné est égal au prix d'entrée

### findRecentSupport (`trading-engine/support-resistance.ts`)

**Détection standard**
Étant donné une série de bougies contenant un creux local (pivot bas) dans la fenêtre de recherche
Quand la recherche du support récent est demandée
Alors le niveau bas de la bougie pivot la plus récente est retourné

**Aucun pivot dans la fenêtre**
Étant donné une série de bougies strictement monotone (sans creux local) dans la fenêtre de recherche
Quand la recherche du support récent est demandée
Alors aucun support n'est retourné (null)

**Série trop courte pour détecter un pivot**
Étant donné une série de bougies de moins de 3 éléments
Quand la recherche du support récent est demandée
Alors aucun support n'est retourné (null), sans erreur

### calculateSupportStopLoss (`trading-engine/support-resistance.ts`)

**Calcul standard**
Étant donné un niveau de support et une marge de sécurité valides
Quand le stop-loss basé sur le support est demandé
Alors le niveau retourné est légèrement sous le support, proportionnellement à la marge

### combineStopLoss (`trading-engine/support-resistance.ts`)

**Le niveau ATR est le plus conservateur**
Étant donné un stop-loss ATR plus proche du prix d'entrée que le stop-loss support
Quand la combinaison des deux niveaux est demandée
Alors le niveau ATR est retourné

**Le niveau support est le plus conservateur**
Étant donné un stop-loss support plus proche du prix d'entrée que le stop-loss ATR
Quand la combinaison des deux niveaux est demandée
Alors le niveau support est retourné

**Aucun support détecté**
Étant donné l'absence de support détecté (null)
Quand la combinaison des deux niveaux est demandée
Alors le niveau ATR est retourné seul, sans erreur

### findRecentResistance (`trading-engine/take-profit.ts`)

**Détection standard**
Étant donné une série de bougies contenant un sommet local (pivot haut) dans la fenêtre de recherche
Quand la recherche de la résistance récente est demandée
Alors le niveau haut de la bougie pivot la plus récente est retourné

**Aucun pivot dans la fenêtre**
Étant donné une série de bougies strictement monotone (sans sommet local) dans la fenêtre de recherche
Quand la recherche de la résistance récente est demandée
Alors aucune résistance n'est retournée (null)

**Série trop courte pour détecter un pivot**
Étant donné une série de bougies de moins de 3 éléments
Quand la recherche de la résistance récente est demandée
Alors aucune résistance n'est retournée (null), sans erreur

### calculateBollingerBands (`trading-engine/take-profit.ts`)

**Calcul standard**
Étant donné une série de prix, une période et un multiplicateur d'écart-type valides
Quand le calcul des bandes de Bollinger est demandé
Alors la bande médiane (SMA), la bande haute et la bande basse (médiane ± multiplicateur × écart-type) sont retournées pour chaque point disponible

**Période invalide**
Étant donné une période nulle ou négative
Quand le calcul des bandes de Bollinger est demandé
Alors une erreur est levée

**Série plus courte que la période**
Étant donné une série de prix plus courte que la période demandée
Quand le calcul des bandes de Bollinger est demandé
Alors un tableau vide est retourné et aucune erreur n'est levée

**Prix constants (écart-type nul)**
Étant donné une série de prix strictement identiques
Quand le calcul des bandes de Bollinger est demandé
Alors la bande haute et la bande basse sont égales à la bande médiane, sans erreur

### combineTakeProfit (`trading-engine/take-profit.ts`)

**La résistance est l'objectif le plus proche**
Étant donné un niveau de résistance plus proche du prix d'entrée que la bande de Bollinger haute
Quand la combinaison des niveaux de take-profit est demandée
Alors le niveau de résistance est retourné

**La bande de Bollinger est l'objectif le plus proche**
Étant donné une bande de Bollinger haute plus proche du prix d'entrée que le niveau de résistance
Quand la combinaison des niveaux de take-profit est demandée
Alors la bande de Bollinger haute est retournée

**Aucune résistance détectée**
Étant donné l'absence de résistance détectée (null)
Quand la combinaison des niveaux de take-profit est demandée
Alors la bande de Bollinger haute est retournée seule, sans erreur

### evaluatePartialExit (`trading-engine/partial-exit.ts`)

**Premier palier non atteint**
Étant donné un prix actuel sous le niveau du premier palier de take-profit
Quand l'évaluation de la sortie partielle est demandée
Alors aucune sortie n'est déclenchée et la position reste intacte

**Premier palier atteint**
Étant donné un prix actuel ayant atteint le niveau du premier palier
Quand l'évaluation de la sortie partielle est demandée
Alors une sortie partielle est déclenchée, proportionnelle au ratio de sortie configuré, et le reste de la position est laissé ouvert

**Exactement au niveau du premier palier**
Étant donné un prix actuel exactement égal au niveau du premier palier
Quand l'évaluation de la sortie partielle est demandée
Alors la sortie partielle est déclenchée (le niveau atteint compte comme franchi)

**Sortie partielle déjà effectuée**
Étant donné une sortie partielle déjà effectuée pour cette position
Quand l'évaluation de la sortie partielle est demandée
Alors aucune nouvelle sortie n'est déclenchée, même si le prix dépasse à nouveau le niveau du palier

## Historical Data Fetcher

### parseKlinesArchive (`historical-data-fetcher/klines-parser.ts`)

**Fichier CSV valide**
Étant donné un fichier CSV de klines au format Binance (sans en-tête, 12 colonnes)
Quand le parsing de l'archive est demandé
Alors un tableau de bougies (timestamp, open, high, low, close, volume) est retourné

**Lignes malformées**
Étant donné une ligne avec un nombre de colonnes incorrect, ou avec le bon nombre de colonnes mais des valeurs non numériques
Quand le parsing de l'archive est demandé
Alors la ligne est ignorée sans que le parsing des autres lignes ne soit interrompu

**Lignes vides**
Étant donné des lignes vides dans le fichier CSV
Quand le parsing de l'archive est demandé
Alors elles sont ignorées sans erreur

**Entrée vide**
Étant donné un contenu CSV vide
Quand le parsing de l'archive est demandé
Alors un tableau vide est retourné

### buildDailyKlineUrl / enumerateDailyDates (`historical-data-fetcher/klines-url.ts`)

**Construction de l'URL d'archive**
Étant donné un symbole, un intervalle et une date
Quand la construction de l'URL d'archive journalière est demandée
Alors l'URL au format `data.binance.vision` est retournée

**Énumération sur une période**
Étant donné une date de début et une date de fin
Quand l'énumération des dates journalières est demandée
Alors toutes les dates comprises entre les deux bornes (incluses) sont retournées, y compris à travers un changement de mois

**Bornes inversées**
Étant donné une date de début postérieure à la date de fin
Quand l'énumération des dates journalières est demandée
Alors une erreur est levée

### filterMissingDates (`historical-data-fetcher/missing-ranges.ts`)

**Couverture partielle**
Étant donné une liste de dates demandées et un ensemble de dates déjà couvertes en base
Quand le filtrage des dates manquantes est demandé
Alors seules les dates absentes de la couverture existante sont retournées

**Couverture totale ou nulle**
Étant donné une couverture totale, ou l'absence totale de couverture
Quand le filtrage des dates manquantes est demandé
Alors respectivement aucune date, ou toutes les dates demandées, sont retournées

### BinanceVisionHttpClient (`historical-data-fetcher/http-client.ts`)

**Téléchargement et extraction réussis**
Étant donné une réponse HTTP OK contenant une archive ZIP avec un fichier CSV
Quand le téléchargement de l'URL est demandé
Alors le contenu CSV extrait de l'archive est retourné

**Réponse HTTP en erreur**
Étant donné une réponse HTTP non OK (ex: archive inexistante, 404)
Quand le téléchargement de l'URL est demandé
Alors une erreur explicite mentionnant le code HTTP est levée

### PrismaCandleRepository (`historical-data-fetcher/candle-repository.ts`, intégration)

**Aucune donnée**
Étant donné aucune bougie sauvegardée pour un intervalle donné
Quand les dates couvertes sont demandées
Alors un ensemble vide est retourné

**Sauvegarde puis lecture**
Étant donné des bougies sauvegardées pour une date donnée
Quand les dates couvertes sont demandées
Alors cette date apparaît dans l'ensemble retourné

**Doublons**
Étant donné une bougie déjà sauvegardée (même timestamp/intervalle/source)
Quand la même bougie est sauvegardée à nouveau
Alors elle n'est pas dupliquée en base, sans erreur levée

### HistoricalDataFetcher.fetchRange (`historical-data-fetcher/historical-data-fetcher.ts`, réseau mocké)

**Période déjà entièrement couverte**
Étant donné une période déjà entièrement présente en base
Quand le téléchargement de la période est demandé
Alors aucune requête réseau n'est effectuée et aucune bougie n'est sauvegardée

**Période partiellement couverte**
Étant donné une période partiellement présente en base
Quand le téléchargement de la période est demandé
Alors seules les dates manquantes sont téléchargées

**Aucune couverture**
Étant donné une période totalement absente de la base
Quand le téléchargement de la période est demandé
Alors chaque date est téléchargée, parsée puis sauvegardée

## Backtest Runner

### Portfolio (`trading-engine/portfolio.ts`)

**Ouverture de position**
Étant donné un portefeuille sans position ouverte et un cash suffisant
Quand l'ouverture d'une position est demandée
Alors le cash est débité du coût (prix × quantité) et la position est créée

**Ouverture refusée**
Étant donné une position déjà ouverte, ou un cash insuffisant pour le coût demandé
Quand l'ouverture d'une position est demandée
Alors une erreur est levée

**Clôture de position**
Étant donné une position ouverte
Quand la clôture au prix de sortie est demandée
Alors le cash est crédité du produit de la vente et la position est vidée

**Valeur du portefeuille**
Étant donné un portefeuille avec ou sans position ouverte
Quand la valeur totale au prix courant est demandée
Alors le cash plus la valeur de marché de la position (le cas échéant) est retournée

### computeStopLoss / computeTakeProfit (`trading-engine/risk-levels.ts`)

**Combinaison la plus prudente**
Étant donné une série de bougies où le support (ou la résistance) détecté est plus proche du prix que le niveau ATR (ou Bollinger)
Quand le calcul du stop-loss (ou du take-profit) est demandé
Alors le niveau le plus proche du prix est retenu

**Absence de support/résistance**
Étant donné une série de bougies sans support ou résistance détectable
Quand le calcul du stop-loss (ou du take-profit) est demandé
Alors le niveau ATR (ou Bollinger) seul est retourné

**Historique insuffisant**
Étant donné une série de bougies plus courte que la période ATR ou Bollinger configurée
Quand le calcul du stop-loss ou du take-profit est demandé
Alors une erreur explicite est levée

### TradingEngine (`trading-engine/trading-engine.ts`, coquille à état)

**Refus en cascade**
Étant donné un signal sous le seuil de confiance, ou une position déjà ouverte, ou un ratio net insuffisant
Quand l'évaluation du signal est demandée
Alors le signal est refusé avec la raison correspondante, dans l'ordre de vérification du document de risque/récompense

**Acceptation et ouverture**
Étant donné un signal valide (confiance suffisante, aucune position ouverte, ratio net suffisant)
Quand l'évaluation du signal est demandée
Alors une position est ouverte, dimensionnée selon la confiance entre la taille minimale et maximale configurées

**Sortie sur stop-loss ou take-profit**
Étant donné une position ouverte et un prix courant atteignant le stop-loss ou le take-profit
Quand la mise à jour de prix est évaluée
Alors la position est clôturée au niveau touché, avec la raison de sortie correspondante

**Trailing stop**
Étant donné une position ouverte ayant atteint le seuil d'activation du trailing
Quand la mise à jour de prix est évaluée avec un nouveau niveau de stop-loss candidat plus favorable
Alors le stop-loss de la position est relevé, sans jamais redescendre, et la position reste ouverte

### runBacktest (`backtest-runner/backtest-runner.ts`)

**Série vide**
Étant donné une série de bougies vide
Quand le backtest est lancé
Alors une erreur est levée

**Marché plat**
Étant donné un marché sans croisement de moyennes mobiles
Quand le backtest est lancé
Alors aucun trade n'est pris, le P&L final et le drawdown max sont nuls

**Historique insuffisant**
Étant donné une série de bougies plus courte que l'historique minimal requis par la stratégie et les niveaux de risque
Quand le backtest est lancé
Alors aucun trade n'est pris, sans erreur levée

**Tendance haussière soutenue**
Étant donné une tendance haussière produisant un croisement SMA accepté par le Trading Engine
Quand le backtest est lancé
Alors le trade est ouvert puis clôturé (stop-loss ou take-profit), et le résultat (P&L final, drawdown max, nombre de trades) est cohérent avec l'historique des trades

### PrismaBacktestRunRepository (`backtest-runner/backtest-run-repository.ts`, intégration)

**Persistance d'un résultat de backtest**
Étant donné le résultat d'un backtest et l'identifiant d'une stratégie existante
Quand la sauvegarde est demandée
Alors un enregistrement `BacktestRun` est créé en base avec les valeurs du résultat

## Market Data Provider (live)

### LiveTradingSession (`market-data-provider/live-trading-session.ts`, PriceFeed mocké)

**Historique insuffisant**
Étant donné moins de bougies reçues que l'historique minimal requis par la stratégie et les niveaux de risque
Quand de nouvelles bougies arrivent via le PriceFeed
Alors aucun événement n'est émis et aucune position n'est ouverte

**Interchangeabilité avec le Backtest Runner**
Étant donné le même scénario de marché (tendance haussière) rejoué bougie par bougie via un PriceFeed plutôt qu'en une seule passe sur un tableau
Quand chaque bougie est reçue
Alors le même Strategy Engine et le même Trading Engine produisent l'ouverture puis la clôture de la position, avec le même résultat final sur le portefeuille

### BinanceMarketDataProvider (`market-data-provider/binance-market-data-provider.ts`, réseau mocké)

**Bougie clôturée**
Étant donné un message WebSocket kline avec `k.x = true` (bougie clôturée)
Quand le message est reçu
Alors il est normalisé en `RawCandle` (timestamp, OHLCV) et transmis à tous les abonnés `onPrice`

**Bougie non clôturée**
Étant donné un message WebSocket kline avec `k.x = false` (bougie en cours)
Quand le message est reçu
Alors aucun abonné n'est notifié

**Message non-kline**
Étant donné un message WebSocket qui n'est pas un événement `kline` (ex: `aggTrade`)
Quand le message est reçu
Alors aucun abonné n'est notifié

**Abonnement au flux**
Étant donné un symbole et un intervalle configurés
Quand `subscribe()` est appelé
Alors le client WebSocket s'abonne au topic kline correspondant (`{symbol}@kline_{interval}`) sur la connexion `main`
