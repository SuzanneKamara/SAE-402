# 🎯 SAE 4.02 - Améliorations Individuelles
## Archery XR - Version Susan

---

## 📋 Vue d'ensemble

Cette page présente mes améliorations individuelles apportées au projet **Archery XR** durant les 2 dernières semaines de développement. Le projet de base était un jeu de tir à l'arc en réalité étendue (WebXR) développé en trinôme.

### 🎮 Fonctionnalités Ajoutées

1. ✅ **Système de persistance du score** (localStorage)
2. ✅ **Cibles mobiles avec trajectoires circulaires**
3. ✅ **Physique avancée des flèches** (plantage dans les surfaces)
4. ✅ **Système de pause/reprise**
5. ✅ **Menu médiéval immersif**

---

## 🏆 1. Conservation du Score en Local Storage

### Description
Implémentation d'un système de persistance qui sauvegarde le meilleur score du joueur localement. Le record est conservé entre les sessions et affiché dans le menu de fin de partie.

### Fonctionnement Technique

Le système utilise l'API `localStorage` du navigateur pour sauvegarder et récupérer le meilleur score :

```javascript
// Fichier: src/systems/game-manager.js - Ligne 183-200

endGame: function () {
  console.log("🏁 Fin du jeu!");
  this.stopGame();
  
  // Arrêter le compte à rebours et les timers
  if (this.countdownTimer) {
    clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }

  // Récupération et comparaison du meilleur score
  const storedBestScore = Number(localStorage.getItem("bestScore") || 0);
  const currentBestScore = Number.isNaN(storedBestScore) ? 0 : storedBestScore;
  const newBestScore = Math.max(currentBestScore, this.totalScore);
  
  this.bestScore = newBestScore;
  this.isNewRecord = this.totalScore > currentBestScore;
  
  // Sauvegarde du nouveau record
  localStorage.setItem("bestScore", newBestScore.toString());

  // Afficher le menu de fin avec les statistiques
  this.showEndMenu();
}
```

### Avantages
- 🔒 **Persistance** : Le score survit à la fermeture du navigateur
- 🏅 **Motivation** : Affichage du meilleur score et détection de nouveaux records
- 📊 **Validation** : Gestion des cas limites (NaN, valeurs invalides)

### Capture d'écran
*[Insérer ici une capture du menu de fin montrant le best score]*

---

## 🎯 2. Système de Cibles Mobiles Circulaires

### Description
Développement d'un composant `flying-target` permettant aux cibles de suivre des trajectoires circulaires dans l'espace 3D, avec détection automatique des limites pour éviter les collisions avec les murs.

### Architecture

Le système calcule dynamiquement l'espace disponible autour de chaque cible en utilisant un **raycasting** multi-directionnel :

```javascript
// Fichier: src/systems/game-manager.js - Ligne 460-540

calculateAvailableMovementSpace: function (spawnPosition, surfaceNormal) {
  const raycaster = new THREE.Raycaster();
  raycaster.near = 0.01;
  raycaster.far = 5.0;
  
  // 8 directions de test (droite, gauche, haut, bas, + diagonales)
  const rightDir = new THREE.Vector3(-surfaceNormal.z, 0, surfaceNormal.x).normalize();
  const upDir = new THREE.Vector3(0, 1, 0);
  const forwardDir = surfaceNormal.clone().negate();
  
  // Distance max avant collision
  let maxAmplitudeX = 1.2;  // Largeur
  let maxAmplitudeY = 1.0;  // Hauteur
  let maxAmplitudeZ = 0.8;  // Profondeur
  
  const testDirections = [
    { dir: rightDir.clone(), axis: 'X', name: 'droite' },
    { dir: rightDir.clone().negate(), axis: 'X', name: 'gauche' },
    { dir: upDir.clone(), axis: 'Y', name: 'haut' },
    // ... autres directions
  ];
  
  // Raycasting pour détecter les obstacles
  for (const test of testDirections) {
    raycaster.set(spawnPosition, test.dir);
    const hits = raycaster.intersectObjects(collisionObjects, false);
    
    if (hits.length > 0) {
      const distance = hits[0].distance;
      const safeDistance = Math.max(0.10, distance - 0.20); // Marge de sécurité
      
      if (test.axis === 'X') maxAmplitudeX = Math.min(maxAmplitudeX, safeDistance);
      else if (test.axis === 'Y') maxAmplitudeY = Math.min(maxAmplitudeY, safeDistance);
      else if (test.axis === 'Z') maxAmplitudeZ = Math.min(maxAmplitudeZ, safeDistance);
    }
  }
  
  return { x: maxAmplitudeX, y: maxAmplitudeY, z: maxAmplitudeZ };
}
```

### Mouvement Circulaire

Le composant `flying-target` anime la cible sur un cercle avec optimisation des performances :

```javascript
// Fichier: src/components/flying-target.js - Ligne 74-180

tick: function (time, deltaTime) {
  if (!this.data.enabled) return;

  // Capturer la position centrale au premier tick
  if (!this.centerCaptured) {
    this.centerPosition.copy(this.el.object3D.position);
    
    // Pré-calculer les rayons adaptatifs (optimisation)
    this.adaptiveRadius.x = Math.min(this.data.radius, this.data.maxX * 0.85);
    this.adaptiveRadius.y = Math.min(this.data.radius, this.data.maxY * 0.85);
    this.adaptiveRadius.z = Math.min(this.data.radius, this.data.maxZ * 0.85);
    
    this.centerCaptured = true;
  }

  // Calculer l'angle actuel basé sur le temps
  const dt = deltaTime ? (deltaTime / 1000) : 0.016;
  this.currentAngle += this.data.speed * dt;
  
  if (this.currentAngle > Math.PI * 2) {
    this.currentAngle -= Math.PI * 2;
  }

  // Position sur le cercle selon le plan (xy, xz, ou yz)
  const cosAngle = Math.cos(this.currentAngle);
  const sinAngle = Math.sin(this.currentAngle);
  
  this.helperVector.copy(this.centerPosition);

  switch (this.data.plane) {
    case "xy": // Plan vertical
      this.helperVector.x += cosAngle * this.adaptiveRadius.x;
      this.helperVector.y += sinAngle * this.adaptiveRadius.y;
      break;
    case "xz": // Plan horizontal
      this.helperVector.x += cosAngle * this.adaptiveRadius.x;
      this.helperVector.z += sinAngle * this.adaptiveRadius.z;
      break;
    case "yz": // Plan sagittal
      this.helperVector.y += cosAngle * this.adaptiveRadius.y;
      this.helperVector.z += sinAngle * this.adaptiveRadius.z;
      break;
  }

  // Appliquer la nouvelle position
  this.el.object3D.position.copy(this.helperVector);
}
```

### Caractéristiques
- 🔄 **3 plans de rotation** : Vertical (XY), Horizontal (XZ), Sagittal (YZ)
- 🧭 **Détection automatique** : Choix du plan optimal selon l'espace disponible
- ⚡ **Performance optimisée** : Objets réutilisables, pas d'allocation mémoire dans tick()
- 🛡️ **Sécurité** : Marge de 20cm pour éviter les collisions avec les murs

### Vidéo de démonstration
*[Insérer ici une vidéo montrant les cibles en mouvement circulaire]*

---

## 🏹 3. Physique Avancée des Flèches

### Description
Simulation physique réaliste des flèches avec gravité, résistance de l'air, et système de plantage dynamique dans les surfaces détectées.

### Physique Balistique

```javascript
// Fichier: src/components/arrow-physics.js - Ligne 85-145

tick: function (time, deltaTime) {
  if (this.hasCollided) return;

  const dt = deltaTime / 1000; // Conversion en secondes

  // 1. Accélération due à la gravité
  const gravityAcc = new THREE.Vector3(0, -this.data.gravity, 0);

  // 2. Résistance de l'air (force quadratique)
  const velocityMagnitude = this.velocity.length();
  let dragAcc = new THREE.Vector3(0, 0, 0);
  
  if (velocityMagnitude > 0.0001) {
    const dragForce = this.velocity.clone()
      .normalize()
      .multiplyScalar(-this.data.dragCoefficient * velocityMagnitude * velocityMagnitude);
    dragAcc = dragForce.divideScalar(this.data.mass);
  }

  // 3. Somme des accélérations
  this.acceleration.copy(gravityAcc).add(dragAcc);

  // 4. Mise à jour de la vélocité: v = v + a * dt
  this.velocity.add(this.acceleration.clone().multiplyScalar(dt));

  // 5. Déplacement: s = v * dt
  const displacement = this.velocity.clone().multiplyScalar(dt);

  // 6. Orienter la flèche dans la direction du mouvement
  if (velocityMagnitude > 0.1) {
    const targetDirection = this.velocity.clone().normalize();
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1), 
      targetDirection
    );
    this.el.object3D.quaternion.copy(targetQuaternion);
  }

  // Raycast pour détecter les collisions
  const currentPos = this.el.object3D.position.clone();
  const rayDistance = displacement.length();
  const rayDir = displacement.lengthSq() > 0 
    ? displacement.clone().normalize() 
    : this.velocity.clone().normalize();
    
  this.raycaster.set(currentPos, rayDir);
  this.raycaster.far = Math.max(rayDistance * 1.2, 0.001);

  // Détecter les intersections
  const allObjects = this.collisionObjects.map((obj) => obj.object);
  const intersects = this.raycaster.intersectObjects(allObjects, true);

  if (intersects.length > 0 && intersects[0].distance <= rayDistance) {
    this.handleCollision(intersects[0]);
  } else {
    this.el.object3D.position.add(displacement);
  }
}
```

### Système de Plantage

Lorsqu'une flèche touche une surface, elle s'aligne avec la normale et s'enfonce :

```javascript
// Fichier: src/components/arrow-physics.js - Ligne 250-280

attachArrowToSurface: function (surfaceEl, worldImpactPoint, worldNormal) {
  // Positionner la flèche au point d'impact
  this.el.object3D.position.copy(worldImpactPoint);

  // Enfoncement variable pour réalisme (4-10cm)
  const penetrationDepth = 0.04 + Math.random() * 0.06;

  // Aligner avec la normale (pointer vers la surface)
  if (worldNormal) {
    const inwardNormal = worldNormal.clone().multiplyScalar(-1).normalize();
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      inwardNormal
    );
    this.el.object3D.quaternion.copy(targetQuaternion);

    // Pousser la flèche dans la surface
    this.el.object3D.position.add(
      inwardNormal.clone().multiplyScalar(penetrationDepth)
    );
  }

  // Attacher à la surface (pour qu'elle bouge avec)
  if (surfaceEl && surfaceEl.object3D) {
    const localImpact = surfaceEl.object3D.worldToLocal(worldImpactPoint.clone());
    surfaceEl.appendChild(this.el);
    this.el.object3D.position.copy(localImpact);
  }

  // Jouer le son d'impact
  const hitSound = document.getElementById("hit-sound");
  if (hitSound) {
    hitSound.currentTime = 0;
    hitSound.play();
  }
}
```

### Points Techniques
- 📐 **Trajectoire parabolique** : Gravité réaliste (0.005 par défaut)
- 💨 **Résistance de l'air** : Force quadratique proportionnelle au carré de la vitesse
- 🎯 **Détection précise** : Raycasting continu pour éviter le tunneling
- 🔧 **Enfoncement variable** : Profondeur aléatoire (4-10cm) pour réalisme
- 🔗 **Attachement dynamique** : La flèche suit la surface si elle bouge

---

## ⏸️ 4. Système de Pause/Reprise

### Description
Menu de pause immersif avec options de reprise, redémarrage et retour au menu principal.

### Implémentation

```javascript
// Fichier: src/systems/game-manager.js - Ligne 230-300

pauseGame: function () {
  if (this.gamePaused || !this.gameRunning) return;

  this.gamePaused = true;
  console.log("⏸️ Jeu en pause");

  // Émettre l'événement pour afficher le menu
  this.el.sceneEl.emit("game-paused");
},

resumeGame: function () {
  if (!this.gamePaused || !this.gameRunning) return;

  this.gamePaused = false;
  console.log("▶️ Jeu repris");

  this.el.sceneEl.emit("game-resumed");
},

restartGame: function () {
  this.stopGame();
  this.gamePaused = false;
  this.gameRunning = false;
  
  // Supprimer toutes les cibles
  for (const target of this.activeTargets) {
    if (target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
  }
  this.activeTargets = [];

  // Redémarrer
  this.startGame();
}
```

### Menu Pause VR

Le menu de pause est positionné devant le joueur avec un style médiéval cohérent :

```javascript
// Fichier: src/components/pause-menu.js - Ligne 220-235

showMenu: function () {
  if (this.isVisible) return;
  this.isVisible = true;
  this.el.setAttribute("visible", true);

  // Positionner devant la caméra
  const camera = this.el.sceneEl.camera;
  if (camera) {
    const cameraPos = camera.getWorldPosition(new THREE.Vector3());
    const cameraDir = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(camera.quaternion);
    cameraDir.multiplyScalar(2); // 2 mètres devant
    
    const menuPos = new THREE.Vector3()
      .addVectors(cameraPos, cameraDir)
      .setY(cameraPos.y);

    this.el.setAttribute("position", menuPos);
    this.el.object3D.lookAt(cameraPos);
  }
}
```

### Fonctionnalités
- ⏸️ **Pause intelligente** : Arrêt du timer et du spawn de cibles
- 📍 **Positionnement dynamique** : Menu toujours face au joueur
- 🎨 **Style médiéval** : Cohérent avec l'univers du jeu
- 🎮 **3 options** : Reprendre, Redémarrer, Quitter

---

## 🏰 5. Interface Médiévale Immersive

### Description
Création d'un système d'interface utilisateur complet avec des menus VR stylisés dans un thème médiéval.

### Menu Principal VR

```javascript
// Fichier: src/components/vr-menu.js - Ligne 28-120

createMenuPanel: function () {
  const menu = this.el;

  // Positionner devant le joueur à 2.5m
  menu.setAttribute("position", "0 1.5 -2.5");

  // Palette médiévale
  const COLORS = {
    darkWood: "#2d1b0e",
    lightWood: "#4a3728",
    gold: "#d4af37",
    parchment: "#f4e4bc",
    darkRed: "#8b0000",
  };

  // Bordure dorée extérieure
  const borderOuter = document.createElement("a-entity");
  borderOuter.setAttribute("geometry", {
    primitive: "plane",
    width: 1.5,
    height: 1.7,
  });
  borderOuter.setAttribute("material", {
    color: COLORS.gold,
    opacity: 1,
    shader: "flat",
  });
  menu.appendChild(borderOuter);

  // Panneau de bois
  const panel = document.createElement("a-entity");
  panel.setAttribute("geometry", {
    primitive: "plane",
    width: 1.44,
    height: 1.64,
  });
  panel.setAttribute("material", {
    color: COLORS.darkWood,
    opacity: 0.98,
    shader: "flat",
  });
  menu.appendChild(panel);

  // Titre avec style médiéval
  const title = document.createElement("a-text");
  title.setAttribute("value", "⚔️ ARCHERY XR ⚔️");
  title.setAttribute("color", COLORS.gold);
  title.setAttribute("width", "2.2");
  menu.appendChild(title);

  // ... (sections QUÊTE, CONTRÔLES, RÉCOMPENSES)
  
  // Bouton cible pour démarrer
  this.createPlayButton(menu, COLORS);
}
```

### Bouton Interactif

Le bouton de démarrage est une cible qui réagit aux flèches :

```javascript
// Fichier: src/components/vr-menu.js - Ligne 280-295

checkArrowHit: function (arrowPosition) {
  if (!this.isVisible || !this.playButton) return false;

  this.playButton.object3D.getWorldPosition(this.playButtonWorldPos);
  const distance = arrowPosition.distanceTo(this.playButtonWorldPos);

  if (distance < 0.5) {
    console.log("🎯 Bouton touché par une flèche !");
    this.onPlayClick();
    return true;
  }

  return false;
}
```

### Éléments Visuels
- 🎨 **Palette cohérente** : Bois sombre, or, parchemin
- 📜 **Typographie médiévale** : Police Georgia avec effets
- ✨ **Animations** : Pulse sur le bouton cible
- 🎯 **Interaction naturelle** : Tirer sur la cible pour commencer

---

## 📊 Statistiques de Code

| Métrique | Valeur |
|----------|--------|
| **Nouveaux composants** | 5 |
| **Lignes de code ajoutées** | ~1200 |
| **Fichiers modifiés** | 8 |
| **Systèmes améliorés** | 2 |
| **Fonctions créées** | 15+ |

---

## 🎬 Démonstrations Vidéo

### Vidéo 1: Conservation du Score
*[Vidéo montrant le best score affiché dans le menu de fin]*

**Points clés :**
- Affichage du meilleur score précédent
- Détection et célébration d'un nouveau record
- Persistance après fermeture du navigateur

### Vidéo 2: Cibles Mobiles
*[Vidéo montrant plusieurs cibles en mouvement circulaire sur différents plans]*

**Points clés :**
- Mouvement circulaire fluide
- Détection automatique de l'espace disponible
- Différents plans de rotation (vertical, horizontal, sagittal)

### Vidéo 3: Physique des Flèches
*[Vidéo montrant des flèches suivant une trajectoire parabolique et se plantant dans les murs]*

**Points clés :**
- Trajectoire parabolique réaliste avec gravité
- Alignement automatique avec la direction du mouvement
- Plantage dans les surfaces avec enfoncement variable

### Vidéo 4: Menu de Pause
*[Vidéo montrant l'activation du menu de pause et les différentes options]*

**Points clés :**
- Activation du menu avec bouton VR
- Arrêt complet du gameplay (timer, spawn)
- Options de reprise, redémarrage et retour au menu

---

## 🔧 Technologies Utilisées

- **A-Frame 1.7.1** : Framework WebXR
- **Three.js** : Bibliothèque 3D (via A-Frame)
- **WebXR API** : Détection de surfaces réelles
- **localStorage API** : Persistance du score
- **Vite** : Build tool moderne

---

## 📈 Améliorations Futures (Non Implémentées)

### Archer Ennemi IA
Un système d'adversaires contrôlés par IA qui tirent également sur des cibles, créant une compétition :

```javascript
// Concept non implémenté
AFRAME.registerComponent('enemy-archer', {
  schema: {
    accuracy: { type: 'number', default: 0.7 },
    shootInterval: { type: 'number', default: 3000 }
  },
  
  init: function() {
    this.shootTimer = setInterval(() => {
      this.shootAtRandomTarget();
    }, this.data.shootInterval);
  },
  
  shootAtRandomTarget: function() {
    const targets = document.querySelectorAll('[target-behavior]');
    if (targets.length === 0) return;
    
    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
    // Logique de tir avec imprécision basée sur accuracy
  }
});
```

**Complexité technique :**
- Calcul de trajectoire inverse (position → angle)
- Système de compétition (score ennemi vs joueur)
- Animation du personnage archer
- IA de sélection de cibles

---

## 🔗 Liens et Ressources

- **Code source complet** : [Lien vers le dépôt GitHub]
- **Application déployée** : [Lien vers la version hébergée]
- **Documentation A-Frame** : https://aframe.io/docs/
- **WebXR Explainer** : https://github.com/immersive-web/webxr/blob/master/explainer.md

---

## 📝 Conclusion

Ces améliorations individuelles ont significativement enrichi l'expérience de jeu en ajoutant :
- **La persistance des données** pour fidéliser les joueurs
- **Des défis dynamiques** avec les cibles mobiles
- **Un réalisme physique** avec la gravité et le plantage des flèches
- **Un confort d'utilisation** avec le système de pause
- **Une immersion renforcée** avec l'interface médiévale

Le projet démontre une maîtrise des concepts avancés de WebXR, de la physique 3D, et de l'architecture ECS d'A-Frame.

---

*Document créé le 26 février 2026*
*SAE 4.02 - MMI - Version Individuelle*
