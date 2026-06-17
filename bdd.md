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
