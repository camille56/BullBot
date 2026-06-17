# BullBot

Bot de trading automatique en paper trading sur BTC/USDT (Binance Spot), combinant des indicateurs techniques et des règles de gestion du risque pour produire des trades simulés, en backtest comme en live.

## Language

**Signal** (`StrategySignal`):
Résultat produit par un indicateur technique pour l'instant présent : un type (`BUY`/`SELL`/`HOLD`), un score de confiance, un prix et un timestamp. Toujours calculé pour le dernier prix reçu, jamais pour toute une série historique d'un coup — c'est ce qui permet au même code de tourner en backtest et en live.
_Avoid_: alerte, recommandation

**Score de confiance** (`confidence`):
Valeur entre 0 et 1 indiquant la fiabilité d'un signal. Calculé par un indicateur isolé, il ne reflète que la force de ce signal (ex: écart entre deux moyennes mobiles au moment du croisement) — il ne tient pas compte des autres indicateurs ni de la volatilité. Ces facteurs n'interviennent qu'au niveau de la confirmation croisée.
_Avoid_: probabilité, score de qualité

**Confirmation croisée**:
Renforcement (ou affaiblissement) du score de confiance d'un signal lorsque plusieurs indicateurs pointent dans le même sens (ou se contredisent) au même moment. N'existe qu'au niveau de la combinaison de plusieurs signaux ; un indicateur isolé ne la calcule jamais lui-même.
_Avoid_: consensus, accord entre indicateurs

**Portefeuille** (`Portfolio`):
État détenu par le Trading Engine : `cashBalance` (capital disponible, non engagé) + `position` (nullable, car une seule position ouverte à la fois). Sa valeur totale (`cashBalance + valeur de marché de la position`) sert de base au calcul de la taille de position en %. Distinct de `Position`, qui ne décrit que le trade actuellement ouvert.
_Avoid_: compte, capital (seul)

**Position**:
Le trade actuellement ouvert sur BTC/USDT, le cas échéant : quantité détenue, prix moyen d'entrée, P&L latent. `null` quand aucun trade n'est en cours. Ne contient pas l'historique des trades clôturés — ceux-ci vivent dans `Trade` (persistance), pas dans l'état en mémoire du Portefeuille.
_Avoid_: trade (pour désigner la position ouverte), ordre
