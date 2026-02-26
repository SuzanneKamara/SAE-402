/**
 * Composant flying-target pour A-Frame
 * Anime une cible avec un mouvement CIRCULAIRE dans l'espace 3D
 * Utilise les surfaces détectées comme limites pour éviter les collisions
 */

AFRAME.registerComponent("flying-target", {
  schema: {
    // Rayon du cercle de mouvement (calculé automatiquement selon les limites)
    radius: { type: "number", default: 0.5 },
    
    // Vitesse angulaire (radians par seconde)
    speed: { type: "number", default: 1.0 },
    
    // Plan de rotation: 'xy' (vertical face à moi), 'xz' (horizontal), 'yz' (sagittal)
    plane: { type: "string", default: "xy" },
    
    // Limites de mouvement (calculées par game-manager)
    maxX: { type: "number", default: 0.5 },
    maxY: { type: "number", default: 0.5 },
    maxZ: { type: "number", default: 0.5 },
    
    // Activé/Désactivé
    enabled: { type: "boolean", default: true },
  },

  init: function () {
    this.centerPosition = new THREE.Vector3(); // Position centrale du cercle (réutilisable)
    this.centerCaptured = false;
    this.startAngle = Math.random() * Math.PI * 2; // Angle de départ aléatoire
    this.currentAngle = this.startAngle;
    this.lastLogTime = 0;
    this.tickCount = 0;
    
    // Objets helper THREE.js réutilisables (PERFORMANCE OPTIMIZATION)
    // Évite les allocations mémoire répétées dans tick()
    this.helperVector = new THREE.Vector3();
    this.adaptiveRadius = { x: 0, y: 0, z: 0 }; // Cache pour rayons adaptatifs
    
    // Écouteurs d'événements pour la pause/reprise du jeu
    this.onGamePaused = this.pause.bind(this);
    this.onGameResumed = this.resume.bind(this);
    
    this.el.sceneEl.addEventListener("game-paused", this.onGamePaused);
    this.el.sceneEl.addEventListener("game-resumed", this.onGameResumed);
    
    console.log(`🎯 Flying-target (CIRCULAIRE) initialisé: enabled=${this.data.enabled}, plane=${this.data.plane}, radius=${this.data.radius.toFixed(2)}m, speed=${this.data.speed.toFixed(1)} rad/s`);
    console.log(`🔍 Limites reçues: maxX=${this.data.maxX}, maxY=${this.data.maxY}, maxZ=${this.data.maxZ}`);
    
    // 🧪 TEST CRITIQUE: Vérifier l'état de l'entité
    console.log(`🧪 Entity state: isPlaying=${this.el.isPlaying}, hasLoaded=${this.el.hasLoaded}`);
    
    // Debug VR
    if (window.vrDebugLog) {
      window.vrDebugLog(`FlyTarget INIT: r=${this.data.radius.toFixed(1)}m ${this.data.plane}`);
    }
  },

  update: function (oldData) {
    console.log(`🔄 Flying-target update: radius=${this.data.radius.toFixed(2)}m, limites=[X:${this.data.maxX.toFixed(2)}, Y:${this.data.maxY.toFixed(2)}, Z:${this.data.maxZ.toFixed(2)}], plane=${this.data.plane}`);
    
    // Si changement de radius ou limites, ajuster le rayon pour ne pas dépasser
    const effectiveRadius = Math.min(
      this.data.radius,
      this.data.maxX * 0.9,
      this.data.maxY * 0.9,
      this.data.maxZ * 0.9
    );
    
    if (effectiveRadius !== this.data.radius) {
      console.log(`⚠️ Rayon ajusté de ${this.data.radius.toFixed(2)}m à ${effectiveRadius.toFixed(2)}m pour respecter les limites`);
      this.data.radius = effectiveRadius;
    }
    
    // Réinitialiser si réactivé
    if (oldData && oldData.enabled === false && this.data.enabled === true) {
      this.centerCaptured = false;
      console.log("🔄 Réactivation: réinitialisation de la position centrale");
    }
  },

  tick: function (time, deltaTime) {
    this.tickCount++;
    
    // Logs de debug au démarrage
    if (this.tickCount === 1) {
      console.log("✅ TICK APPELÉ - Mouvement circulaire activé!");
      if (window.vrDebugLog) {
        window.vrDebugLog("TICK1: FlyTarget activé!");
      }
    }
    
    if (this.tickCount === 10) {
      console.log("✅ 10 ticks exécutés - Trajectoire circulaire en cours");
      if (window.vrDebugLog) {
        window.vrDebugLog("TICK10: Mouvement OK");
      }
    }

    if (!this.data.enabled) {
      if (this.tickCount <= 3) {
        console.log("⚠️ Mouvement désactivé (enabled=false)");
      }
      return;
    }

    // Capturer la position centrale au premier tick
    if (!this.centerCaptured) {
      // Copier la position actuelle (pas de clone() - meilleure performance)
      this.centerPosition.copy(this.el.object3D.position);
      
      // Pré-calculer les rayons adaptatifs (évite les calculs répétés)
      // 🧪 TEST: Utiliser 0.95 au lieu de 0.85 pour garder un rayon plus grand
      this.adaptiveRadius.x = Math.min(this.data.radius, this.data.maxX * 0.95);
      this.adaptiveRadius.y = Math.min(this.data.radius, this.data.maxY * 0.95);
      this.adaptiveRadius.z = Math.min(this.data.radius, this.data.maxZ * 0.95);
      
      // 🧪 TEST: Forcer un minimum absolu pour être visible
      this.adaptiveRadius.x = Math.max(this.adaptiveRadius.x, 0.30);
      this.adaptiveRadius.y = Math.max(this.adaptiveRadius.y, 0.30);
      this.adaptiveRadius.z = Math.max(this.adaptiveRadius.z, 0.20);
      
      this.centerCaptured = true;
      console.log(`📍 Position centrale capturée: [${this.centerPosition.x.toFixed(2)}, ${this.centerPosition.y.toFixed(2)}, ${this.centerPosition.z.toFixed(2)}]`);
      console.log(`⭕ Trajectoire circulaire: rayon=${this.data.radius.toFixed(2)}m, plan=${this.data.plane}, vitesse=${this.data.speed.toFixed(1)} rad/s`);
      console.log(`📏 Limites: X=${this.data.maxX.toFixed(2)}m, Y=${this.data.maxY.toFixed(2)}m, Z=${this.data.maxZ.toFixed(2)}m`);
      console.log(`🔧 Rayons adaptatifs: X=${this.adaptiveRadius.x.toFixed(2)}m, Y=${this.adaptiveRadius.y.toFixed(2)}m, Z=${this.adaptiveRadius.z.toFixed(2)}m`);
      if (window.vrDebugLog) {
        window.vrDebugLog(`${this.data.plane} R=${this.data.radius.toFixed(2)}m`);
        window.vrDebugLog(`Adapt: x=${this.adaptiveRadius.x.toFixed(2)} y=${this.adaptiveRadius.y.toFixed(2)}`);
      }
    }

    // Calculer l'angle actuel basé sur le temps
    const dt = deltaTime ? (deltaTime / 1000) : 0.016; // Fallback 60fps
    this.currentAngle += this.data.speed * dt;
    
    // Debug VR pour voir l'évolution de l'angle
    if (this.tickCount % 30 === 15 && window.vrDebugLog) {
      window.vrDebugLog(`Angle: ${(this.currentAngle * 180 / Math.PI).toFixed(0)}deg`);
    }
    
    // Normaliser l'angle entre 0 et 2π
    if (this.currentAngle > Math.PI * 2) {
      this.currentAngle -= Math.PI * 2;
    }

    // Calculer la nouvelle position sur le cercle selon le plan
    // Utiliser les rayons adaptatifs pré-calculés pour meilleure performance
    const cosAngle = Math.cos(this.currentAngle);
    const sinAngle = Math.sin(this.currentAngle);
    
    // Utiliser le vecteur helper pour construire la nouvelle position
    this.helperVector.copy(this.centerPosition);

    switch (this.data.plane) {
      case "xy": // Plan vertical face caméra (X = horizontal, Y = vertical)
        this.helperVector.x += cosAngle * this.adaptiveRadius.x;
        this.helperVector.y += sinAngle * this.adaptiveRadius.y;
        break;
        
      case "xz": // Plan horizontal (X = gauche/droite, Z = profondeur)
        this.helperVector.x += cosAngle * this.adaptiveRadius.x;
        this.helperVector.z += sinAngle * this.adaptiveRadius.z;
        break;
        
      case "yz": // Plan sagittal (Y = haut/bas, Z = profondeur)
        this.helperVector.y += cosAngle * this.adaptiveRadius.y;
        this.helperVector.z += sinAngle * this.adaptiveRadius.z;
        break;
        
      default: // Par défaut: plan XY
        this.helperVector.x += cosAngle * this.adaptiveRadius.x;
        this.helperVector.y += sinAngle * this.adaptiveRadius.y;
        break;
    }

    // Vérification stricte des limites avec marge de sécurité (optimisée)
    const deltaX = Math.abs(this.helperVector.x - this.centerPosition.x);
    const deltaY = Math.abs(this.helperVector.y - this.centerPosition.y);
    const deltaZ = Math.abs(this.helperVector.z - this.centerPosition.z);
    
    // Utiliser une marge de sécurité de 90% des limites
    const safeMarginX = this.data.maxX * 0.90;
    const safeMarginY = this.data.maxY * 0.90;
    const safeMarginZ = this.data.maxZ * 0.90;
    
    if (deltaX > safeMarginX || deltaY > safeMarginY || deltaZ > safeMarginZ) {
      if (this.tickCount % 100 === 0) {
        console.warn(`⚠️ Position proche des limites! Delta=[${deltaX.toFixed(2)}, ${deltaY.toFixed(2)}, ${deltaZ.toFixed(2)}] SafeMargin=[${safeMarginX.toFixed(2)}, ${safeMarginY.toFixed(2)}, ${safeMarginZ.toFixed(2)}]`);
      }
      // Ajuster la position pour rester dans les limites
      this.helperVector.x = this.centerPosition.x + Math.sign(this.helperVector.x - this.centerPosition.x) * Math.min(deltaX, safeMarginX);
      this.helperVector.y = this.centerPosition.y + Math.sign(this.helperVector.y - this.centerPosition.y) * Math.min(deltaY, safeMarginY);
      this.helperVector.z = this.centerPosition.z + Math.sign(this.helperVector.z - this.centerPosition.z) * Math.min(deltaZ, safeMarginZ);
    }

    // Appliquer la nouvelle position - UTILISER object3D.position.set() (méthode recommandée A-Frame)
    const oldX = this.el.object3D.position.x;
    const oldY = this.el.object3D.position.y;
    const oldZ = this.el.object3D.position.z;
    
    this.el.object3D.position.set(
      this.helperVector.x,
      this.helperVector.y,
      this.helperVector.z
    );
    
    // 🧪 TEST CRITIQUE: Vérifier immédiatement que la position a bien été modifiée
    const newX = this.el.object3D.position.x;
    const newY = this.el.object3D.position.y;
    const changed = Math.abs(newX - this.helperVector.x) < 0.0001 && 
                    Math.abs(newY - this.helperVector.y) < 0.0001;
    
    if (this.tickCount === 5 && window.vrDebugLog) {
      window.vrDebugLog(`POS SET: old=${oldX.toFixed(3)} new=${newX.toFixed(3)}`);
      window.vrDebugLog(`Applied: ${changed ? 'YES' : 'NO!!!'}`);
    }
    
    // Debug toutes les 60 frames
    if (this.tickCount % 60 === 30 && window.vrDebugLog) {
      const dist = Math.sqrt(
        Math.pow(this.helperVector.x - this.centerPosition.x, 2) +
        Math.pow(this.helperVector.y - this.centerPosition.y, 2) +
        Math.pow(this.helperVector.z - this.centerPosition.z, 2)
      );
      const moved = Math.abs(oldX - this.helperVector.x) > 0.001 || 
                    Math.abs(oldY - this.helperVector.y) > 0.001 ||
                    Math.abs(oldZ - this.helperVector.z) > 0.001;
      window.vrDebugLog(`Pos: ${this.helperVector.x.toFixed(2)},${this.helperVector.y.toFixed(2)} d=${dist.toFixed(2)}m moved=${moved}`);
    }
    
    // Log au premier mouvement
    if (this.tickCount === 2) {
      const deltaX = this.helperVector.x - this.centerPosition.x;
      const deltaY = this.helperVector.y - this.centerPosition.y;
      const deltaZ = this.helperVector.z - this.centerPosition.z;
      const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY + deltaZ*deltaZ);
      
      console.log(`🚀 PREMIER MOUVEMENT CIRCULAIRE:`);
      console.log(`   Centre:  (${this.centerPosition.x.toFixed(3)}, ${this.centerPosition.y.toFixed(3)}, ${this.centerPosition.z.toFixed(3)})`);
      console.log(`   Angle:   ${(this.currentAngle * 180 / Math.PI).toFixed(1)}°`);
      console.log(`   Nouvelle: (${this.helperVector.x.toFixed(3)}, ${this.helperVector.y.toFixed(3)}, ${this.helperVector.z.toFixed(3)})`);
      console.log(`   Delta:   (${deltaX.toFixed(3)}, ${deltaY.toFixed(3)}, ${deltaZ.toFixed(3)})`);
      console.log(`   Distance: ${distance.toFixed(3)}m`);
      
      if (window.vrDebugLog) {
        window.vrDebugLog(`Movement: delta=${distance.toFixed(3)}m`);
        if (distance < 0.01) {
          window.vrDebugLog(`!!! DELTA TOO SMALL !!!`);
        }
      }
    }

    // Log périodique (toutes les 2 secondes)
    if (!this.lastLogTime) this.lastLogTime = time;
    if (time - this.lastLogTime > 2000) {
      const currentPos = this.el.object3D.position;
      const distanceFromCenter = Math.sqrt(
        Math.pow(currentPos.x - this.centerPosition.x, 2) +
        Math.pow(currentPos.y - this.centerPosition.y, 2) +
        Math.pow(currentPos.z - this.centerPosition.z, 2)
      );
      
      console.log(`⭕ Trajectoire: angle=${(this.currentAngle * 180 / Math.PI).toFixed(1)}°, rayon effectif=${distanceFromCenter.toFixed(2)}m (cible=${this.data.radius.toFixed(2)}m), pos=[${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)}]`);
      
      if (distanceFromCenter < 0.05) {
        console.error(`❌ PROBLÈME: La cible ne bouge pas! Distance du centre < 5cm`);
      }
      
      this.lastLogTime = time;
    }
  },

  // Pause/Reprendre le mouvement
  pause: function () {
    this.data.enabled = false;
    console.log("⏸️ Mouvement cible pausé");
  },

  resume: function () {
    this.data.enabled = true;
    console.log("▶️ Mouvement cible repris");
  },

  // Nettoyer les écouteurs d'événements
  remove: function () {
    if (this.onGamePaused) {
      this.el.sceneEl.removeEventListener("game-paused", this.onGamePaused);
    }
    if (this.onGameResumed) {
      this.el.sceneEl.removeEventListener("game-resumed", this.onGameResumed);
    }
    console.log("🧹 Flying-target nettoyé");
  },
});
