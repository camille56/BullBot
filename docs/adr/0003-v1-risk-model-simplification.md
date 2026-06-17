# Simplification du Trading Engine pour la v1

`regles-risque-recompense.md` décrit le stop-loss comme ATR et/ou support/résistance (en combinant les deux et en retenant le plus prudent), et le take-profit comme résistances historiques et/ou bande de Bollinger, avec sorties partielles possibles sur plusieurs paliers.

**Mise à jour** : la simplification décrite initialement dans cet ADR (calcul direct seul, sans combinaison) n'a finalement pas eu lieu — la détection de pivots support/résistance s'est révélée assez simple pour être implémentée dès la première itération. Les fonctions pures (`atr.ts`, `support-resistance.ts`, `take-profit.ts`, `partial-exit.ts`) couvrent déjà la combinaison complète (ATR+support pour le stop-loss, résistance+Bollinger pour le take-profit, retenue du niveau le plus prudent) et le calcul d'une sortie partielle par palier, toutes testées.

La simplification réelle de la v1 se situe maintenant au niveau de l'**orchestration** (`TradingEngine`, `BacktestRunner`), pas du calcul :

- **Sortie complète en une fois.** `partial-exit.ts` existe et est testé, mais `TradingEngine.evaluatePriceUpdate` ne l'appelle pas encore : une position se clôture intégralement dès que le stop-loss ou le take-profit est touché, sans palier. Câbler la sortie partielle demande de faire porter à `TradingEngine` un état supplémentaire (quantité déjà sortie, drapeau "palier déjà franchi") qui n'a pas été jugé nécessaire avant d'avoir validé le pipeline simple de bout en bout via le Backtest Runner.
- **Une seule stratégie branchée.** `BacktestRunner` ne pilote que le signal SMA (`generateSMASignal`). RSI et MACD existent dans le Strategy Engine mais ne sont ni combinés entre eux, ni branchés au Backtest Runner.

Câbler les sorties partielles dans `TradingEngine` et combiner plusieurs indicateurs restent l'objectif documenté, repoussés à l'étape "itération sur les stratégies" de la roadmap (cahier des charges, §11), une fois le pipeline de base (Historical Data Fetcher → Strategy Engine → Backtest Runner → Trading Engine) validé sur le flux simple.

## Considered Options

- Différer la combinaison ATR+support/résistance et résistance+Bollinger à une itération ultérieure (option retenue dans la version initiale de cet ADR) : abandonnée en pratique, la détection de pivots ne s'est pas révélée plus complexe à tester que les calculs directs qu'elle remplace.
- Câbler la sortie partielle dans `TradingEngine` dès cette itération : rejeté pour l'instant, ajoute de l'état (quantité restante, palier déjà franchi) à la coquille à état avant que le flux simple (sortie complète) n'ait été validé par un backtest réel.
- Combiner SMA/RSI/MACD dans `BacktestRunner` dès cette itération : rejeté, aucun indicateur autre que SMA n'est encore branché à un score de confiance combiné (`regles-risque-recompense.md` §2.1, confirmation croisée) ; prématuré avant la première itération de calibrage des paramètres.
