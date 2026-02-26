# 🎬 Guide des Captures Vidéo - SAE 4.02

## 📋 Checklist des Vidéos à Créer

### ✅ Vidéo 1: Conservation du Score (30-45 secondes)

**Scénario :**
1. **Introduction** (5s) : Montrer le menu de démarrage
2. **Première partie** (10s) : Jouer et marquer 150 points
3. **Fin de partie** (10s) : Menu de fin montrant "Score: 150 | Best: 150"
4. **Seconde partie** (10s) : Rejouer et marquer 250 points
5. **Nouveau record** (5s) : Menu de fin montrant "Score: 250 | Best: 250 🆕"

**Points à capturer :**
- Close-up sur le texte "Nouveau Record !" dans le menu de fin
- Interface du localStorage dans DevTools (F12) montrant la clé "bestScore"
- Fermer et rouvrir le navigateur, le best score est toujours là

**Code à afficher en parallèle :**
```javascript
// game-manager.js ligne 190-195
const storedBestScore = Number(localStorage.getItem("bestScore") || 0);
const newBestScore = Math.max(currentBestScore, this.totalScore);
this.isNewRecord = this.totalScore > currentBestScore;
localStorage.setItem("bestScore", newBestScore.toString());
```

---

### ✅ Vidéo 2: Cibles Mobiles Circulaires (45-60 secondes)

**Scénario :**
1. **Vue d'ensemble** (10s) : Montrer 3 cibles en mouvement simultané
2. **Plan vertical XY** (10s) : Focus sur une cible bougeant gauche-droite + haut-bas
3. **Plan horizontal XZ** (10s) : Focus sur une cible bougeant en cercle au sol
4. **Collision avec mur** (10s) : Montrer une cible qui s'adapte à un espace réduit
5. **Tir réussi** (10s) : Toucher une cible en mouvement

**Points à capturer :**
- Vue latérale pour voir le mouvement circulaire
- Vue de dessus pour le plan horizontal
- Console montrant les logs de rayon calculé et limites détectées

**Code à afficher :**
```javascript
// flying-target.js ligne 110-130
// Calculer l'angle actuel basé sur le temps
const dt = deltaTime / 1000;
this.currentAngle += this.data.speed * dt;

// Position sur le cercle
const cosAngle = Math.cos(this.currentAngle);
const sinAngle = Math.sin(this.currentAngle);

switch (this.data.plane) {
  case "xy": // Plan vertical
    this.helperVector.x += cosAngle * this.adaptiveRadius.x;
    this.helperVector.y += sinAngle * this.adaptiveRadius.y;
    break;
  // ...
}
```

---

### ✅ Vidéo 3: Physique des Flèches (60 secondes)

**Scénario :**
1. **Tir horizontal** (15s) : Montrer la chute parabolique sur 5-6 mètres
2. **Tir vers le haut** (15s) : Montrer l'arc complet (montée + descente)
3. **Plantage dans le mur** (15s) : Flèche qui se plante avec angle variable
4. **Slow motion** (15s) : Ralenti montrant la rotation de la flèche en vol

**Angles de caméra :**
- Vue de profil pour voir la parabole
- Vue de face pour voir l'enfoncement dans le mur
- Close-up sur la flèche plantée (alignement avec la normale du mur)

**Code à afficher :**
```javascript
// arrow-physics.js ligne 95-115
// 1. Accélération due à la gravité
const gravityAcc = new THREE.Vector3(0, -this.data.gravity, 0);

// 2. Résistance de l'air (force quadratique)
const dragForce = this.velocity.clone()
  .normalize()
  .multiplyScalar(-this.data.dragCoefficient * velocityMagnitude * velocityMagnitude);
const dragAcc = dragForce.divideScalar(this.data.mass);

// 3. Somme des accélérations
this.acceleration.copy(gravityAcc).add(dragAcc);

// 4. Mise à jour vélocité
this.velocity.add(this.acceleration.clone().multiplyScalar(dt));

// 5. Déplacement
const displacement = this.velocity.clone().multiplyScalar(dt);
```

---

### ✅ Vidéo 4: Menu de Pause (30 secondes)

**Scénario :**
1. **Partie en cours** (5s) : Jeu actif avec timer
2. **Activation pause** (5s) : Appuyer sur le bouton pause
3. **Menu affiché** (10s) : Montrer les 3 options (Reprendre, Redémarrer, Quitter)
4. **Reprise** (5s) : Cliquer "Reprendre", le timer reprend
5. **Redémarrage** (5s) : Tester le bouton "Redémarrer"

**Points à capturer :**
- Timer qui s'arrête quand le jeu est en pause
- Menu qui se positionne toujours face au joueur
- Spawn de cibles qui s'arrête pendant la pause

**Code à afficher :**
```javascript
// game-manager.js ligne 230-250
pauseGame: function () {
  this.gamePaused = true;
  this.el.sceneEl.emit("game-paused");
},

resumeGame: function () {
  this.gamePaused = false;
  this.el.sceneEl.emit("game-resumed");
},

// Dans startCountdown()
if (this.gamePaused) return; // Ne pas décompter si en pause
```

---

### ✅ Vidéo 5: Interface Médiévale (30 secondes)

**Scénario :**
1. **Menu principal** (10s) : Montrer le parchemin, bordures dorées, typographie
2. **HUD en jeu** (10s) : Score, timer, cibles restantes (style médiéval)
3. **Menu de fin** (10s) : Statistiques avec décoration médiévale

**Points à capturer :**
- Détails de la palette de couleurs (or, bois, parchemin)
- Animation pulse du bouton "Jouer"
- Cohérence visuelle entre tous les menus

---

## 🎥 Paramètres de Capture Recommandés

### Logiciels
- **OBS Studio** : Qualité maximale, 60 FPS
- **ScreenToGif** : Pour créer des GIFs animés courts
- **DaVinci Resolve** (gratuit) : Pour le montage

### Résolution
- **1920x1080** minimum
- **60 FPS** pour la fluidité
- **Bitrate** : 8000-10000 kbps

### Console du Navigateur
- Ouvrir les DevTools (F12)
- Activer "Preserve log" pour garder les messages
- Augmenter la taille de la police pour la lisibilité

---

## 📸 Captures d'Écran Statiques Nécessaires

### Image 1: Architecture du Code
**Capture de VS Code montrant :**
- Arborescence du projet à gauche
- Code du composant `flying-target.js` au centre
- Terminal avec `npm run dev` en bas

### Image 2: LocalStorage
**Capture du DevTools :**
- Onglet "Application" > "Local Storage"
- Clé "bestScore" avec une valeur
- Console montrant `localStorage.getItem("bestScore")`

### Image 3: Raycasting Visuel
**Capture en jeu avec DevTools :**
- Console montrant les logs de collision
- Cible en mouvement dans l'espace
- Lignes de debug du raycasting (si visualizeSurfaces activé)

### Image 4: Menu VR
**Capture haute résolution :**
- Menu principal médiéval en pleine vue
- Détails des bordures et textures
- Bouton cible avec animation pulse

### Image 5: Flèche Plantée
**Close-up :**
- Flèche enfoncée dans un mur
- Angle montrant l'alignement avec la normale
- Autres flèches en arrière-plan pour comparaison

---

## 🎨 Éléments de Design pour la Page Web

### Sections à Inclure

1. **Hero Section**
   - Titre : "SAE 4.02 - Améliorations Individuelles"
   - Sous-titre : "Archery XR - Version Susan"
   - GIF animé de gameplay

2. **Navigation**
   - Conservation du Score
   - Cibles Mobiles
   - Physique des Flèches
   - Système de Pause
   - Interface Médiévale

3. **Pour Chaque Fonctionnalité**
   - Icône représentative (emoji ou SVG)
   - Description courte (2-3 phrases)
   - Vidéo démonstration (embedded)
   - Bloc de code avec syntaxe highlighting
   - Explication technique

4. **Footer**
   - Liens GitHub
   - Statistiques du projet
   - Ressources consultées
   - Contact

### Palette de Couleurs Web

```css
:root {
  /* Thème médiéval cohérent avec le jeu */
  --dark-wood: #2d1b0e;
  --light-wood: #4a3728;
  --gold: #d4af37;
  --parchment: #f4e4bc;
  --dark-red: #8b0000;
  
  /* Accents */
  --accent-green: #4CC3D9;
  --accent-orange: #FFA500;
  
  /* Fond */
  --bg-dark: #1a1410;
  --bg-light: #f5f5f0;
}
```

### Polices Recommandées

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Uncial+Antiqua&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">

<!-- Utilisation -->
font-family: 'Uncial Antiqua', cursive; /* Titres */
font-family: 'Cinzel', serif; /* Corps de texte */
font-family: 'Fira Code', monospace; /* Code */
```

---

## 📊 Données pour les Graphiques

### Graphique 1: Répartition du Code
```javascript
{
  labels: ['Composants', 'Systems', 'Configuration', 'Assets'],
  data: [1200, 400, 150, 300],
  colors: ['#d4af37', '#4a3728', '#4CC3D9', '#FFA500']
}
```

### Graphique 2: Performance
```javascript
{
  labels: ['Avant', 'Après Optimisation'],
  data: {
    FPS: [55, 60],
    MemoryMB: [180, 150],
    LoadTimeMs: [2500, 1800]
  }
}
```

---

## 🗣️ Script de Présentation Orale (Anglais)

### Introduction (1 min)

> "Good morning/afternoon everyone. Today I'll present my individual improvements to the Archery XR project. During the last 2 weeks, I focused on 4 main features: score persistence, dynamic moving targets, advanced arrow physics, and an immersive medieval interface. Let's dive in."

### Partie 1: Score Persistence (2 min)

> "First, the score persistence system. Using the browser's localStorage API, I implemented a best score tracking mechanism. Every time the game ends, the system compares the current score with the stored high score and updates it if necessary. Here's the core implementation..."
>
> [Montrer le code + vidéo]
>
> "As you can see in this video, even after closing the browser, the best score persists. This encourages players to replay and beat their own records."

### Partie 2: Moving Targets (3 min)

> "The second major feature is the flying target system. Targets now follow circular trajectories in 3D space. The challenge was to make them move without colliding with walls. I solved this using multi-directional raycasting..."
>
> [Montrer le code de calculateAvailableMovementSpace]
>
> "The system shoots rays in 8 directions to detect obstacles, then calculates safe movement boundaries. Each target adapts its circular path to the available space."
>
> [Montrer la vidéo avec différents plans de rotation]

### Partie 3: Arrow Physics (2 min)

> "For realistic arrow behavior, I implemented a full physics simulation. Each tick, the system applies gravity, air resistance, and updates the velocity using Newton's laws..."
>
> [Montrer le code de tick() dans arrow-physics]
>
> "When the arrow hits a surface, it aligns with the normal vector and penetrates realistically. The penetration depth is randomized between 4 and 10 centimeters for natural variation."
>
> [Montrer la vidéo de flèches en vol et plantage]

### Partie 4: Pause System (1 min)

> "I also added a complete pause system. Players can pause the game, which stops the countdown timer and target spawning. The pause menu offers three options: resume, restart, or quit to main menu."
>
> [Montrer vidéo du menu de pause]

### Partie 5: Medieval Interface (1 min)

> "Finally, I designed a cohesive medieval interface. All menus use a consistent color palette: dark wood, gold, and parchment. The main menu features a target button that players shoot to start the game, reinforcing the archery theme."

### Conclusion (1 min)

> "In summary, these improvements enhance player engagement through score persistence, add dynamic challenges with moving targets, increase realism with physics simulation, and create a more immersive experience with the medieval theme. Thank you for your attention. I'm ready for questions."

---

## ✅ Checklist Finale Avant Présentation

- [ ] Toutes les vidéos capturées et montées
- [ ] Captures d'écran en haute résolution
- [ ] Page web déployée et testée
- [ ] Liens GitHub vérifiés
- [ ] Code commenté en anglais pour la présentation
- [ ] Script de présentation répété (timing: 15 min max)
- [ ] Backup des vidéos sur USB (au cas où)
- [ ] Test de la page web sur différents navigateurs
- [ ] Vérifier que toutes les démos fonctionnent
- [ ] Préparer les réponses aux questions techniques courantes

---

*Guide créé le 26 février 2026*
*Pour la présentation finale SAE 4.02*
