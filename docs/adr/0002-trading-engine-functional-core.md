# Trading Engine : noyau fonctionnel, coquille à état

Le Trading Engine doit faire respecter des règles avec état (une seule position ouverte à la fois, trailing stop qui ne peut que monter), mais les exemples de tests de `strategie-de-test.md` (§3.2) portent sur des fonctions pures sans état caché (`calculateNetRiskRewardRatio`, `isTradeAccepted`, `updateTrailingStop`). On a tranché pour un découpage **noyau fonctionnel / coquille à état** : toute la logique de décision reste en fonctions pures recevant tout leur contexte en argument ; une classe `TradingEngine` fine détient le seul état mutable (le Portefeuille : `cashBalance` + `position`) et orchestre les appels à ces fonctions. Ça garde l'essentiel de la logique métier — et la quasi-totalité des tests pédagogiques — trivialement testable sans setup d'objet, conformément aux exemples du document de stratégie de test ; la coquille à état n'a besoin que de quelques tests d'intégration légers.

## Considered Options

- Une classe `TradingEngine` à état où chaque règle est une méthode lisant/modifiant directement `this.position`, `this.currentStopLoss`, etc. : rejeté, chaque test aurait dû instancier et configurer l'état de l'objet avant de vérifier un comportement, à l'inverse des exemples du document de stratégie de test.
