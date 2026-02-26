# 🌐 Template de Page Web Individuelle - SAE 4.02

## Structure HTML Recommandée

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAE 4.02 - Améliorations Individuelles | Susan</title>
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Uncial+Antiqua&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- Highlight.js for code syntax -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <!-- Navigation fixe -->
  <nav class="navbar">
    <div class="nav-container">
      <h1 class="nav-logo">⚔️ Archery XR</h1>
      <ul class="nav-menu">
        <li><a href="#overview">Vue d'ensemble</a></li>
        <li><a href="#score">Score Local</a></li>
        <li><a href="#targets">Cibles Mobiles</a></li>
        <li><a href="#physics">Physique</a></li>
        <li><a href="#pause">Menu Pause</a></li>
        <li><a href="#ui">Interface</a></li>
        <li><a href="#links">Liens</a></li>
      </ul>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">SAE 4.02</h1>
      <h2 class="hero-subtitle">Améliorations Individuelles</h2>
      <p class="hero-description">
        Archery XR - Jeu de tir à l'arc en réalité étendue avec WebXR
      </p>
      <div class="hero-buttons">
        <a href="https://your-deployed-app.github.io" class="btn btn-primary" target="_blank">
          🎮 Lancer l'Application
        </a>
        <a href="https://github.com/your-repo" class="btn btn-secondary" target="_blank">
          💻 Voir le Code Source
        </a>
      </div>
    </div>
    <div class="hero-image">
      <!-- GIF ou image du jeu -->
      <img src="assets/gameplay.gif" alt="Archery XR Gameplay">
    </div>
  </section>

  <!-- Section Vue d'ensemble -->
  <section id="overview" class="section section-light">
    <div class="container">
      <h2 class="section-title">📋 Vue d'ensemble</h2>
      <p class="section-intro">
        Durant les 2 dernières semaines du projet, j'ai développé 5 améliorations majeures 
        qui enrichissent significativement l'expérience de jeu.
      </p>
      
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🏆</div>
          <h3>Score Persistant</h3>
          <p>Sauvegarde du meilleur score en localStorage</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Cibles Mobiles</h3>
          <p>Trajectoires circulaires adaptatives</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🏹</div>
          <h3>Physique Réaliste</h3>
          <p>Gravité, air drag, plantage dynamique</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⏸️</div>
          <h3>Menu Pause</h3>
          <p>Système complet pause/reprise</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🏰</div>
          <h3>UI Médiévale</h3>
          <p>Interface immersive cohérente</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 1: Score Persistant -->
  <section id="score" class="section section-dark">
    <div class="container">
      <h2 class="section-title">🏆 Conservation du Score en Local Storage</h2>
      
      <div class="content-grid">
        <!-- Vidéo à gauche -->
        <div class="content-media">
          <div class="video-container">
            <video controls poster="assets/score-thumbnail.jpg">
              <source src="assets/score-demo.mp4" type="video/mp4">
              Votre navigateur ne supporte pas la vidéo.
            </video>
          </div>
          <p class="media-caption">
            Démonstration de la persistance du score
          </p>
        </div>
        
        <!-- Explication à droite -->
        <div class="content-text">
          <h3>Fonctionnement</h3>
          <p>
            Le système utilise l'API <code>localStorage</code> pour sauvegarder 
            automatiquement le meilleur score du joueur. À chaque fin de partie, 
            le score actuel est comparé au record précédent.
          </p>
          
          <h4>Implémentation Technique</h4>
          <pre><code class="language-javascript">// game-manager.js - Fonction endGame()
endGame: function () {
  // Récupération du meilleur score stocké
  const storedBestScore = Number(
    localStorage.getItem("bestScore") || 0
  );
  
  // Calcul du nouveau record
  const newBestScore = Math.max(
    storedBestScore, 
    this.totalScore
  );
  
  // Détection d'un nouveau record
  this.isNewRecord = this.totalScore > storedBestScore;
  
  // Sauvegarde persistante
  localStorage.setItem(
    "bestScore", 
    newBestScore.toString()
  );
  
  // Affichage du menu de fin
  this.showEndMenu();
}</code></pre>

          <h4>Avantages</h4>
          <ul class="benefits-list">
            <li>✅ <strong>Persistance totale</strong> : Le score survit à la fermeture du navigateur</li>
            <li>✅ <strong>Motivation accrue</strong> : Encouragement à battre son propre record</li>
            <li>✅ <strong>Robustesse</strong> : Gestion des valeurs invalides (NaN, null)</li>
            <li>✅ <strong>Performance</strong> : Accès instantané sans requête serveur</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 2: Cibles Mobiles -->
  <section id="targets" class="section section-light">
    <div class="container">
      <h2 class="section-title">🎯 Système de Cibles Mobiles Circulaires</h2>
      
      <div class="content-grid reverse">
        <!-- Explication à gauche -->
        <div class="content-text">
          <h3>Concept</h3>
          <p>
            Les cibles suivent des trajectoires circulaires dans l'espace 3D. 
            Le système détecte automatiquement les obstacles (murs, plafond, sol) 
            et adapte le rayon de mouvement pour éviter les collisions.
          </p>
          
          <h4>Détection de l'Espace Disponible</h4>
          <pre><code class="language-javascript">// game-manager.js - Raycasting multi-directionnel
calculateAvailableMovementSpace: function (spawnPosition, surfaceNormal) {
  const raycaster = new THREE.Raycaster();
  
  // Directions de test (8 axes)
  const testDirections = [
    { dir: rightDir, axis: 'X', name: 'droite' },
    { dir: leftDir, axis: 'X', name: 'gauche' },
    { dir: upDir, axis: 'Y', name: 'haut' },
    { dir: downDir, axis: 'Y', name: 'bas' },
    // + diagonales...
  ];
  
  // Tester les collisions
  for (const test of testDirections) {
    raycaster.set(spawnPosition, test.dir);
    const hits = raycaster.intersectObjects(collisionObjects);
    
    if (hits.length > 0) {
      // Marge de sécurité de 20cm
      const safeDistance = Math.max(0.10, hits[0].distance - 0.20);
      
      // Ajuster les limites par axe
      if (test.axis === 'X') maxAmplitudeX = Math.min(maxAmplitudeX, safeDistance);
      // ...
    }
  }
  
  return { x: maxAmplitudeX, y: maxAmplitudeY, z: maxAmplitudeZ };
}</code></pre>

          <h4>Mouvement Circulaire</h4>
          <pre><code class="language-javascript">// flying-target.js - Animation optimisée
tick: function (time, deltaTime) {
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
  
  this.el.object3D.position.copy(this.helperVector);
}</code></pre>
        </div>
        
        <!-- Vidéo à droite -->
        <div class="content-media">
          <div class="video-container">
            <video controls poster="assets/targets-thumbnail.jpg">
              <source src="assets/targets-demo.mp4" type="video/mp4">
            </video>
          </div>
          <p class="media-caption">
            Cibles en mouvement circulaire sur différents plans
          </p>
          
          <!-- Schéma explicatif -->
          <div class="diagram">
            <img src="assets/circular-motion-diagram.svg" alt="Schéma mouvement circulaire">
            <p class="diagram-caption">
              3 plans de rotation possibles : XY (vertical), XZ (horizontal), YZ (sagittal)
            </p>
          </div>
        </div>
      </div>
      
      <!-- Statistiques -->
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-number">8</div>
          <div class="stat-label">Directions raycasting</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">20cm</div>
          <div class="stat-label">Marge de sécurité</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">3</div>
          <div class="stat-label">Plans de rotation</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">60 FPS</div>
          <div class="stat-label">Performance stable</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 3: Physique des Flèches -->
  <section id="physics" class="section section-dark">
    <div class="container">
      <h2 class="section-title">🏹 Physique Avancée des Flèches</h2>
      
      <div class="physics-showcase">
        <div class="showcase-item">
          <h3>1. Trajectoire Parabolique</h3>
          <img src="assets/parabola.gif" alt="Trajectoire parabolique">
          <p>Simulation de la gravité et de la résistance de l'air</p>
        </div>
        <div class="showcase-item">
          <h3>2. Rotation Dynamique</h3>
          <img src="assets/rotation.gif" alt="Rotation de la flèche">
          <p>Alignement automatique avec la vélocité</p>
        </div>
        <div class="showcase-item">
          <h3>3. Plantage Réaliste</h3>
          <img src="assets/sticking.gif" alt="Flèche plantée">
          <p>Enfoncement variable dans les surfaces</p>
        </div>
      </div>
      
      <h3>Code de Simulation Physique</h3>
      <pre><code class="language-javascript">// arrow-physics.js - Boucle physique principale
tick: function (time, deltaTime) {
  const dt = deltaTime / 1000;

  // 1. Gravité
  const gravityAcc = new THREE.Vector3(0, -this.data.gravity, 0);

  // 2. Résistance de l'air (force quadratique)
  const velocityMagnitude = this.velocity.length();
  const dragForce = this.velocity.clone()
    .normalize()
    .multiplyScalar(
      -this.data.dragCoefficient * 
      velocityMagnitude * 
      velocityMagnitude
    );
  const dragAcc = dragForce.divideScalar(this.data.mass);

  // 3. Accélération totale
  this.acceleration.copy(gravityAcc).add(dragAcc);

  // 4. Mise à jour vélocité (v = v + a * dt)
  this.velocity.add(this.acceleration.clone().multiplyScalar(dt));

  // 5. Déplacement (s = v * dt)
  const displacement = this.velocity.clone().multiplyScalar(dt);

  // 6. Rotation vers la direction du mouvement
  if (velocityMagnitude > 0.1) {
    const targetDirection = this.velocity.clone().normalize();
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, -1), 
      targetDirection
    );
    this.el.object3D.quaternion.copy(targetQuaternion);
  }

  // 7. Appliquer le déplacement
  this.el.object3D.position.add(displacement);
}</code></pre>

      <h3>Système de Plantage</h3>
      <pre><code class="language-javascript">// Alignement avec la normale du mur
attachArrowToSurface: function (surfaceEl, worldImpactPoint, worldNormal) {
  // Enfoncement variable (4-10cm)
  const penetrationDepth = 0.04 + Math.random() * 0.06;

  // Aligner avec la normale
  const inwardNormal = worldNormal.clone().multiplyScalar(-1).normalize();
  const targetQuaternion = new THREE.Quaternion();
  targetQuaternion.setFromUnitVectors(
    new THREE.Vector3(0, 0, -1),
    inwardNormal
  );
  this.el.object3D.quaternion.copy(targetQuaternion);

  // Enfoncer dans la surface
  this.el.object3D.position.add(
    inwardNormal.clone().multiplyScalar(penetrationDepth)
  );
  
  // Attacher à la surface (pour qu'elle suive si elle bouge)
  surfaceEl.appendChild(this.el);
}</code></pre>

      <div class="physics-params">
        <h4>Paramètres de Simulation</h4>
        <table class="params-table">
          <thead>
            <tr>
              <th>Paramètre</th>
              <th>Valeur</th>
              <th>Unité</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Gravité</td>
              <td>0.005</td>
              <td>m/s²</td>
              <td>Accélération gravitationnelle réduite pour WebXR</td>
            </tr>
            <tr>
              <td>Masse</td>
              <td>0.001</td>
              <td>kg</td>
              <td>Masse de la flèche</td>
            </tr>
            <tr>
              <td>Coefficient de traînée</td>
              <td>0.0005</td>
              <td>-</td>
              <td>Résistance de l'air</td>
            </tr>
            <tr>
              <td>Vitesse min</td>
              <td>8</td>
              <td>m/s</td>
              <td>Vitesse minimale de tir</td>
            </tr>
            <tr>
              <td>Vitesse max</td>
              <td>80</td>
              <td>m/s</td>
              <td>Vitesse maximale (tension complète)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- Section 4: Menu Pause -->
  <section id="pause" class="section section-light">
    <div class="container">
      <h2 class="section-title">⏸️ Système de Pause/Reprise</h2>
      
      <div class="content-grid">
        <div class="content-media">
          <video controls poster="assets/pause-thumbnail.jpg">
            <source src="assets/pause-demo.mp4" type="video/mp4">
          </video>
          <p class="media-caption">Menu de pause avec 3 options</p>
        </div>
        
        <div class="content-text">
          <h3>Fonctionnalités</h3>
          <ul class="features-list">
            <li>🎮 Pause complète du gameplay (timer, spawn, mouvements)</li>
            <li>📍 Menu positionné dynamiquement face au joueur</li>
            <li>🎨 Design médiéval cohérent</li>
            <li>⚡ 3 actions : Reprendre, Redémarrer, Quitter</li>
          </ul>
          
          <h3>Code</h3>
          <pre><code class="language-javascript">// game-manager.js
pauseGame: function () {
  if (this.gamePaused || !this.gameRunning) return;
  
  this.gamePaused = true;
  
  // Arrêt du timer
  // Arrêt du spawn
  // Pause des cibles mobiles
  
  this.el.sceneEl.emit("game-paused");
},

resumeGame: function () {
  if (!this.gamePaused) return;
  
  this.gamePaused = false;
  this.el.sceneEl.emit("game-resumed");
  
  // Reprise du timer
  // Reprise du spawn
  // Reprise des mouvements
}</code></pre>

          <pre><code class="language-javascript">// pause-menu.js - Positionnement dynamique
showMenu: function () {
  const camera = this.el.sceneEl.camera;
  const cameraPos = camera.getWorldPosition(new THREE.Vector3());
  
  // 2 mètres devant la caméra
  const cameraDir = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .multiplyScalar(2);
  
  const menuPos = new THREE.Vector3()
    .addVectors(cameraPos, cameraDir)
    .setY(cameraPos.y);

  this.el.setAttribute("position", menuPos);
  this.el.object3D.lookAt(cameraPos);
}</code></pre>
        </div>
      </div>
    </div>
  </section>

  <!-- Section 5: Interface Médiévale -->
  <section id="ui" class="section section-dark">
    <div class="container">
      <h2 class="section-title">🏰 Interface Médiévale Immersive</h2>
      
      <div class="ui-showcase">
        <div class="ui-sample">
          <img src="assets/menu-start.jpg" alt="Menu principal">
          <h4>Menu Principal</h4>
          <p>Parchemin, bordures dorées, bouton cible interactif</p>
        </div>
        <div class="ui-sample">
          <img src="assets/hud.jpg" alt="HUD en jeu">
          <h4>HUD en Jeu</h4>
          <p>Score, timer, statistiques avec style médiéval</p>
        </div>
        <div class="ui-sample">
          <img src="assets/menu-end.jpg" alt="Menu de fin">
          <h4>Menu de Fin</h4>
          <p>Résultats, nouveau record, statistiques détaillées</p>
        </div>
      </div>
      
      <h3>Palette de Couleurs</h3>
      <div class="color-palette">
        <div class="color-swatch" style="background: #2d1b0e;">
          <span>#2d1b0e</span>
          <p>Bois Foncé</p>
        </div>
        <div class="color-swatch" style="background: #4a3728;">
          <span>#4a3728</span>
          <p>Bois Clair</p>
        </div>
        <div class="color-swatch" style="background: #d4af37;">
          <span>#d4af37</span>
          <p>Or</p>
        </div>
        <div class="color-swatch" style="background: #f4e4bc;">
          <span>#f4e4bc</span>
          <p>Parchemin</p>
        </div>
        <div class="color-swatch" style="background: #8b0000;">
          <span>#8b0000</span>
          <p>Rouge Foncé</p>
        </div>
      </div>
      
      <h3>Code du Menu VR</h3>
      <pre><code class="language-javascript">// vr-menu.js - Construction du panneau
createMenuPanel: function () {
  const COLORS = {
    darkWood: "#2d1b0e",
    gold: "#d4af37",
    parchment: "#f4e4bc"
  };

  // Bordure dorée
  const borderOuter = document.createElement("a-entity");
  borderOuter.setAttribute("geometry", {
    primitive: "plane",
    width: 1.5,
    height: 1.7
  });
  borderOuter.setAttribute("material", {
    color: COLORS.gold,
    shader: "flat"
  });

  // Panneau de bois
  const panel = document.createElement("a-entity");
  panel.setAttribute("material", {
    color: COLORS.darkWood,
    opacity: 0.98
  });

  // Titre médiéval
  const title = document.createElement("a-text");
  title.setAttribute("value", "⚔️ ARCHERY XR ⚔️");
  title.setAttribute("color", COLORS.gold);
  
  // Bouton cible animé
  this.createPlayButton(menu, COLORS);
}</code></pre>
    </div>
  </section>

  <!-- Section Statistiques -->
  <section class="section section-light">
    <div class="container">
      <h2 class="section-title">📊 Statistiques du Projet</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">1200+</div>
          <div class="stat-label">Lignes de code ajoutées</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">5</div>
          <div class="stat-label">Composants créés</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">60 FPS</div>
          <div class="stat-label">Performance stable</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">2</div>
          <div class="stat-label">Semaines de développement</div>
        </div>
      </div>
      
      <h3>Technologies Utilisées</h3>
      <div class="tech-stack">
        <div class="tech-item">
          <img src="assets/icons/aframe.svg" alt="A-Frame">
          <p>A-Frame 1.7.1</p>
        </div>
        <div class="tech-item">
          <img src="assets/icons/threejs.svg" alt="Three.js">
          <p>Three.js</p>
        </div>
        <div class="tech-item">
          <img src="assets/icons/webxr.svg" alt="WebXR">
          <p>WebXR API</p>
        </div>
        <div class="tech-item">
          <img src="assets/icons/vite.svg" alt="Vite">
          <p>Vite</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section Liens -->
  <section id="links" class="section section-dark">
    <div class="container">
      <h2 class="section-title">🔗 Liens et Ressources</h2>
      
      <div class="links-grid">
        <div class="link-card">
          <h3>🎮 Application Déployée</h3>
          <p>Essayez le jeu en ligne (nécessite un casque VR compatible WebXR)</p>
          <a href="https://your-app.github.io" class="btn btn-primary" target="_blank">
            Lancer l'Application
          </a>
        </div>
        
        <div class="link-card">
          <h3>💻 Code Source</h3>
          <p>Dépôt GitHub avec tout le code source et l'historique des commits</p>
          <a href="https://github.com/your-repo" class="btn btn-secondary" target="_blank">
            Voir sur GitHub
          </a>
        </div>
        
        <div class="link-card">
          <h3>📚 Documentation</h3>
          <p>README technique complet et guide de développement</p>
          <a href="https://github.com/your-repo/blob/main/README.md" class="btn btn-secondary" target="_blank">
            Lire la Doc
          </a>
        </div>
      </div>
      
      <h3>Ressources Consultées</h3>
      <ul class="resources-list">
        <li>
          <a href="https://aframe.io/docs/" target="_blank">
            Documentation officielle A-Frame
          </a>
        </li>
        <li>
          <a href="https://threejs.org/docs/" target="_blank">
            Documentation Three.js
          </a>
        </li>
        <li>
          <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API" target="_blank">
            MDN - WebXR Device API
          </a>
        </li>
        <li>
          <a href="https://github.com/c-frame/aframe-physics-system" target="_blank">
            A-Frame Physics System (GitHub)
          </a>
        </li>
        <li>
          <a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage" target="_blank">
            MDN - Web Storage API
          </a>
        </li>
      </ul>
    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <p class="footer-text">
        SAE 4.02 - MMI - Développé par Susan | Février 2026
      </p>
      <p class="footer-links">
        <a href="mailto:your.email@example.com">Contact</a> |
        <a href="https://github.com/your-profile" target="_blank">GitHub</a> |
        <a href="https://linkedin.com/in/your-profile" target="_blank">LinkedIn</a>
      </p>
    </div>
  </footer>

  <!-- Scripts -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script>
    // Syntax highlighting
    hljs.highlightAll();
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  </script>
</body>
</html>
```

---

## 🎨 Fichier CSS Complet

```css
/* styles.css */

:root {
  /* Couleurs médiévales */
  --dark-wood: #2d1b0e;
  --light-wood: #4a3728;
  --gold: #d4af37;
  --parchment: #f4e4bc;
  --dark-red: #8b0000;
  
  /* Accents */
  --accent-blue: #4CC3D9;
  --accent-orange: #FFA500;
  
  /* Backgrounds */
  --bg-dark: #1a1410;
  --bg-light: #f5f5f0;
  
  /* Typographie */
  --font-title: 'Uncial Antiqua', cursive;
  --font-body: 'Cinzel', serif;
  --font-code: 'Fira Code', monospace;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 2rem;
  --spacing-lg: 4rem;
  --spacing-xl: 6rem;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-body);
  line-height: 1.6;
  color: var(--parchment);
  background: var(--bg-dark);
}

/* Navigation */
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  background: linear-gradient(135deg, var(--dark-wood) 0%, var(--light-wood) 100%);
  border-bottom: 3px solid var(--gold);
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-family: var(--font-title);
  font-size: 1.8rem;
  color: var(--gold);
  text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 2rem;
}

.nav-menu a {
  color: var(--parchment);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
}

.nav-menu a::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--gold);
  transition: width 0.3s ease;
}

.nav-menu a:hover {
  color: var(--gold);
}

.nav-menu a:hover::after {
  width: 100%;
}

/* Hero Section */
.hero {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 4rem;
  padding: var(--spacing-xl) var(--spacing-md);
  max-width: 1400px;
  margin: 0 auto;
  background: radial-gradient(
    1200px 600px at 50% 30%, 
    rgba(255, 244, 214, 0.15), 
    rgba(10, 8, 6, 0)
  );
}

.hero-content {
  padding: 2rem;
}

.hero-title {
  font-family: var(--font-title);
  font-size: 4rem;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(212, 175, 55, 0.4);
  margin-bottom: 1rem;
  letter-spacing: 3px;
}

.hero-subtitle {
  font-size: 2rem;
  color: var(--parchment);
  margin-bottom: 1.5rem;
}

.hero-description {
  font-size: 1.2rem;
  color: rgba(244, 228, 188, 0.8);
  margin-bottom: 2rem;
  line-height: 1.8;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 1rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  display: inline-block;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: linear-gradient(135deg, var(--gold) 0%, #f3d07a 100%);
  color: var(--dark-wood);
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
}

.btn-secondary {
  background: transparent;
  color: var(--gold);
  border: 2px solid var(--gold);
}

.btn-secondary:hover {
  background: var(--gold);
  color: var(--dark-wood);
}

.hero-image img {
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border: 3px solid var(--gold);
}

/* Sections */
.section {
  padding: var(--spacing-xl) var(--spacing-md);
}

.section-light {
  background: var(--bg-light);
  color: var(--dark-wood);
}

.section-dark {
  background: var(--bg-dark);
  color: var(--parchment);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.section-title {
  font-family: var(--font-title);
  font-size: 3rem;
  text-align: center;
  margin-bottom: var(--spacing-lg);
  color: var(--gold);
  text-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
}

.section-intro {
  text-align: center;
  font-size: 1.3rem;
  max-width: 800px;
  margin: 0 auto var(--spacing-lg);
  opacity: 0.9;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid var(--gold);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  color: var(--gold);
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

/* Content Grid */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
  margin-top: 3rem;
}

.content-grid.reverse {
  direction: rtl;
}

.content-grid.reverse > * {
  direction: ltr;
}

.video-container {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  border: 3px solid var(--gold);
}

.video-container video {
  width: 100%;
  display: block;
}

.media-caption {
  text-align: center;
  margin-top: 1rem;
  font-style: italic;
  opacity: 0.8;
}

/* Code Blocks */
pre {
  background: #282c34;
  border-radius: 8px;
  padding: 1.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  border: 2px solid var(--gold);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

code {
  font-family: var(--font-code);
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Lists */
.benefits-list,
.features-list,
.resources-list {
  list-style: none;
  margin: 1.5rem 0;
}

.benefits-list li,
.features-list li {
  padding: 0.8rem 0;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.benefits-list li:last-child,
.features-list li:last-child {
  border-bottom: none;
}

.resources-list li {
  margin: 1rem 0;
}

.resources-list a {
  color: var(--gold);
  text-decoration: none;
  transition: color 0.3s ease;
}

.resources-list a:hover {
  color: #f3d07a;
  text-decoration: underline;
}

/* Stats */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  margin-top: 4rem;
  padding: 3rem;
  background: rgba(212, 175, 55, 0.1);
  border-radius: 12px;
  border: 2px solid var(--gold);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  color: var(--gold);
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.8;
}

/* Tables */
.params-table {
  width: 100%;
  margin: 2rem 0;
  border-collapse: collapse;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.params-table th {
  background: var(--gold);
  color: var(--dark-wood);
  padding: 1rem;
  text-align: left;
  font-weight: 600;
}

.params-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.params-table tr:last-child td {
  border-bottom: none;
}

/* Color Palette */
.color-palette {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.color-swatch {
  flex: 1;
  min-width: 150px;
  height: 150px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--gold);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.color-swatch span {
  font-family: var(--font-code);
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  margin-bottom: 0.5rem;
}

.color-swatch p {
  color: #fff;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}

/* Footer */
.footer {
  background: linear-gradient(135deg, var(--dark-wood) 0%, #000 100%);
  border-top: 3px solid var(--gold);
  padding: 2rem;
  text-align: center;
}

.footer-text {
  margin-bottom: 1rem;
  opacity: 0.8;
}

.footer-links a {
  color: var(--gold);
  text-decoration: none;
  margin: 0 1rem;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #f3d07a;
}

/* Responsive */
@media (max-width: 1024px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .nav-menu {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: 1fr;
  }
}
```

---

## 📋 Checklist de Déploiement

- [ ] Remplacer tous les `[Insérer vidéo]` par les vrais fichiers
- [ ] Ajouter les captures d'écran dans `/assets`
- [ ] Mettre à jour les liens GitHub et application déployée
- [ ] Tester sur mobile et desktop
- [ ] Vérifier que toutes les vidéos se chargent
- [ ] Optimiser les images (compression)
- [ ] Tester la vitesse de chargement
- [ ] Vérifier l'accessibilité (contraste, alt text)
- [ ] Déployer sur GitHub Pages
- [ ] Tester le site déployé

---

*Template créé le 26 février 2026*
