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
