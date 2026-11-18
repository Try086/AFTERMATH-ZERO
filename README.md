# AFTERMATH : ZERO

Jeu d'extraction (type DMZ) jouable dans le navigateur, **dans un seul fichier HTML** : aucun serveur, aucun téléchargement, aucun plugin — fonctionne sur tout PC (Windows, Mac, Linux) avec Chrome, Edge ou Firefox.

## Comment jouer

1. Télécharger `index.html` (ou ouvrir la page d'extraction déployée).
2. Double-cliquer sur le fichier → le jeu se lance dans le navigateur.
3. Créer un compte (pseudo, e-mail, mot de passe) ou entrer en invité, puis **JOUER**.

## Commandes

| Touche | Action |
|---|---|
| Z Q S D / W A S D | Se déplacer |
| Souris | Viser |
| Clic gauche | Tirer |
| Molette / 1-2 | Changer d'arme |
| E | Ramasser un objet • Réanimer un allié à terre |
| R | Kit de réanimation (quand on est à terre) |
| F | Appeler l'extraction en hélicoptère |
| Échap | Pause |

## Modes et systèmes

- **Carte "Tactical Island"** : 5 zones (base militaire au Nord en neige, zone Sec Ouest, ville en ruines au centre, village à l'Est, désert de sable au Sudissions), météo et brouillard propres à chaque biome.
- **Extraction DMZ** : appeler F → l'hélico arrive, atterrit → montée à l'échelle animée → écran de mission réussie. L'argent ne se conserve que si l'on s'extrait.
- **Stash persistant** : chaque arme ramassée est débloquée définitivement dans l'Armurerie, même en cas de mort.
- **Classes** : 5 classes configurables (onglets 1-5), armes affichées en images, armure, 5 accessoires max, bouton SAUVEGARDER.
- **Opérateur unique** (`ALPHA-01`) customisable : 6 tenues tactiques.
- **Personnalisation** : skins d'armes, 6 accessoires, éditeur de crosshair complet (Couleur / Résolution / Taille / Épaisseur/Contour).
- **Alliés IA** ("BRAVO", "CHARLIE") qui combattent et réaniment le joueur à terre.
- **Menu principal** : JOUER, MULTIJOUER (serveurs en maintenance), PARAMÈTRES, PROGRESSION, BOUTIQUE, QUITTER LE JEU — compteur de joueurs en ligne en temps réels simulé côté jeu.
- **Sauvegarde locale** : comptes, XP, armes débloquées et réglages enregistrés en `localStorage` (aucune donnée ne quitte le PC).

## Structure du dépôt

```
index.html    ← LE JEU complet (le seul fichier nécessaire)
src/          ← sources de développement découpées (menu, écrans, gameplay, rendu, init)
README.md
```
