/**
 * Système game-manager pour A-Frame
 * Gère le cycle de jeu, le spawn des cibles et le score global
 * Spawn sur surfaces réelles (hit-test) + fallback surface-detector
 */

AFRAME.registerSystem("game-manager", {
  schema: {
    spawnInterval: { type: "number", default: 1000 }, // 1 seconde entre chaque spawn (réduit pour plus d'action)
    maxTargets: { type: "number", default: 4 },
    difficulty: { type: "string", default: "normal" }, // easy, normal, hard
    requireRealSurfaces: { type: "boolean", default: true },
    instantHitTestSpawn: { type: "boolean", default: true },
    instantSpawnCooldown: { type: "number", default: 300 },
  },

  init: function () {
    this.activeTargets = [];
    this.totalScore = 0;
    this.totalArrowsShot = 0;
    this.totalHits = 0;
    this.spawnTimer = null;
    this.gameRunning = false;
    this.gamePaused = false; // ⏸️ État de pause
    this.surfacesReady = false;
    this.surfaceDetector = null;
    this.sceneMeshHandler = null;
    this.anchorManager = null;
    this.useAnchors = false;
    this.firstTargetSpawned = false;
    this.lastSpawnPosition = null; // 🚫 Historique de spawn pour éviter les répétitions
    this.movementPhaseActive = false; // 🎪 Phases de mouvement des cibles
    this.lastInstantSpawnTime = 0;

    this.el.addEventListener("target-hit", this.onTargetHit.bind(this));
    this.el.addEventListener("target-destroyed", this.onTargetDestroyed.bind(this));
    this.el.addEventListener("arrow-shot", this.onArrowShot.bind(this));

    this.el.addEventListener("anchor-manager-ready", () => {
      const anchorManagerEl = this.el.querySelector("[webxr-anchor-manager]");
      if (anchorManagerEl && anchorManagerEl.components["webxr-anchor-manager"]) {
        this.anchorManager = anchorManagerEl.components["webxr-anchor-manager"];
        this.useAnchors = true;
      }
    });

    this.el.addEventListener("scene-mesh-handler-ready", () => {
      const handlerEl = this.el.querySelector("[scene-mesh-handler]");
      if (handlerEl && handlerEl.components["scene-mesh-handler"]) {
        this.sceneMeshHandler = handlerEl.components["scene-mesh-handler"];
      }
    });

    this.el.addEventListener("surfaces-detected", (evt) => {
      const realCount = Number(evt.detail?.real || 0);
      const meshCount = Number(evt.detail?.mesh || 0);
      const hitTestCount = Number(evt.detail?.hitTest || 0);
      const hasRealSurface = realCount + meshCount + hitTestCount > 0;

      const surfaceLog =
        `Surfaces: real=${realCount} mesh=${meshCount} hitTest=${hitTestCount}`;
      console.log(
        "🧭 Surfaces détectées:",
        `${surfaceLog} hasRealSurface=${hasRealSurface}`,
      );

      if (this.data.requireRealSurfaces && !hasRealSurface) {
        return;
      }

      this.surfacesReady = true;
      const detectorEl = this.el.querySelector("[surface-detector]");
      if (detectorEl && detectorEl.components["surface-detector"]) {
        this.surfaceDetector = detectorEl.components["surface-detector"];
      }

      if (!this.gameRunning) {
        this.startGame();
      }

      if (
        this.gameRunning &&
        this.data.instantHitTestSpawn &&
        this.sceneMeshHandler &&
        this.sceneMeshHandler.isHitTestActive()
      ) {
        const now = Date.now();
        if (now - this.lastInstantSpawnTime >= this.data.instantSpawnCooldown) {
          this.lastInstantSpawnTime = now;
          this.spawnRandomTarget();
        }
      }
    });

    this.el.addEventListener("start-game", () => {
      this.startGame();
    });

    // ⏸️ Écouteurs pour la pause
    this.el.addEventListener("pause-game", () => {
      this.pauseGame();
    });

    this.el.addEventListener("resume-game", () => {
      this.resumeGame();
    });

    this.el.addEventListener("restart-game", () => {
      this.restartGame();
    });

    this.el.addEventListener("quit-to-menu", () => {
      this.quitToMenu();
    });

    console.log("🎮 Game Manager initialisé");
  },

  startGame: function () {
    if (this.gameRunning) return;

    this.gameRunning = true;
    this.totalScore = 0;
    this.totalHits = 0;
    this.totalArrowsShot = 0;
    this.gameTime = 60;
    this.el.setAttribute("state", "gameStarted", true);

    const bgSound = document.getElementById("background-sound");
    if (bgSound) {
      bgSound.volume = 0.3;
      bgSound
        .play()
        .catch((e) => console.log("Son de fond non disponible:", e));
    }

    this.startTargetSpawning();
    this.createScoreDisplay();
    this.startCountdown();
    
    // 🎯 SPAWN INITIAL: 3 cibles au démarrage
    setTimeout(() => {
      console.log("🎯 Spawn des 3 cibles initiales...");
      for (let i = 0; i < 3; i++) {
        if (this.activeTargets.length < this.data.maxTargets && this.hasAvailableSurface()) {
          this.spawnRandomTarget();
        }
      }
    }, 200); // Petit délai pour que les surfaces soient détectées
    
    // DISABLED FOR TESTING: this.startMovementPhases();
  },

  startMovementPhases: function () {
    // DISABLED FOR TESTING: Phase system disabled, all targets are flying
    // To re-enable, uncomment the code below and uncomment the call in startGame()
  },

  startCountdown: function () {
    this.countdownTimer = setInterval(() => {
      if (this.gamePaused) return; // ⏸️ Ne pas décompter si en pause

      this.gameTime--;
      this.updateTimerDisplay();

      console.log(`⏱️ Temps restant: ${this.gameTime}s`);

      if (this.gameTime <= 0) {
        this.endGame();
      }
    }, 1000);
  },

  updateTimerDisplay: function () {
    const timerEl = document.getElementById("timer-value");
    if (timerEl) {
      timerEl.textContent = this.gameTime;
      // Animation pulsante si moins de 3 secondes
      if (this.gameTime <= 3) {
        timerEl.classList.add("warning");
      } else {
        timerEl.classList.remove("warning");
      }
    }
  },

  endGame: function () {
    console.log("🏁 Fin du jeu!");

    // Arrêter le jeu
    this.stopGame();

    // Arrêter le compte à rebours
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }

    // Arrêter les phases de mouvement
    if (this.movementPhaseTimer) {
      clearInterval(this.movementPhaseTimer);
      this.movementPhaseTimer = null;
    }

    // Arrêter la musique
    const bgSound = document.getElementById("background-sound");
    if (bgSound) {
      bgSound.pause();
    }

    const storedBestScore = Number(localStorage.getItem("bestScore") || 0);
    const currentBestScore = Number.isNaN(storedBestScore)
      ? 0
      : storedBestScore;
    const newBestScore = Math.max(currentBestScore, this.totalScore);
    this.bestScore = newBestScore;
    this.isNewRecord = this.totalScore > currentBestScore;
    localStorage.setItem("bestScore", newBestScore.toString());

    // Émettre l'événement de fin de jeu pour cacher le HUD VR
    this.el.emit("game-ended");

    // Afficher le menu de fin
    this.showEndMenu();
  },

  showEndMenu: function () {
    // Créer l'entité du menu de fin
    const endMenu = document.createElement("a-entity");
    endMenu.setAttribute("end-menu", {
      score: this.totalScore,
      hits: this.totalHits,
      arrows: this.totalArrowsShot,
      bestScore: this.bestScore || 0,
      isNewRecord: !!this.isNewRecord,
    });
    this.el.appendChild(endMenu);
  },

  pauseGame: function () {
    if (this.gamePaused || !this.gameRunning) return;

    this.gamePaused = true;
    console.log("⏸️ Jeu en pause");

    // Émettre l'événement pour afficher le menu de pause
    this.el.sceneEl.emit("game-paused");
  },

  resumeGame: function () {
    if (!this.gamePaused || !this.gameRunning) return;

    this.gamePaused = false;
    console.log("▶️ Jeu repris");

    // Émettre l'événement pour masquer le menu de pause
    this.el.sceneEl.emit("game-resumed");
  },

  restartGame: function () {
    console.log("🔄 Redémarrage du jeu");
    
    // Arrêter le jeu actuel
    this.stopGame();

    // Nettoyer les éléments
    this.gamePaused = false;
    this.gameRunning = false;
    this.firstTargetSpawned = false;
    
    // Supprimer toutes les cibles
    for (const target of this.activeTargets) {
      if (target && target.parentNode) {
        target.parentNode.removeChild(target);
      }
    }
    this.activeTargets = [];

    // Redémarrer le jeu
    this.startGame();
  },

  quitToMenu: function () {
    console.log("🚪 Retour au menu principal");
    
    // Arrêter le jeu
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

    // Arrêter la musique
    const bgSound = document.getElementById("background-sound");
    if (bgSound) {
      bgSound.pause();
    }

    // Émettre l'événement de fin de jeu
    this.el.emit("game-ended");

    // Afficher le menu de démarrage (re-initialiser l'écran)
    const mainScene = document.querySelector("[vr-menu]");
    if (mainScene) {
      mainScene.setAttribute("visible", true);
    }

    // Supprimer le menu de pause
    const pauseMenu = document.querySelector("[pause-menu]");
    if (pauseMenu && pauseMenu.parentNode) {
      pauseMenu.parentNode.removeChild(pauseMenu);
    }
  },

  startTargetSpawning: function () {
    this.spawnTimer = setInterval(() => {
      if (this.gamePaused) return; // ⏸️ Ne pas spawner si en pause
      
      const currentCount = this.activeTargets.length;
      
      // 🎯 LIMITE: Maximum 3 cibles en même temps
      if (currentCount >= this.data.maxTargets) {
        console.log(`⏸️ Spawn bloqué: ${currentCount}/${this.data.maxTargets} cibles actives`);
        return;
      }
      
      if (!this.hasAvailableSurface()) return;
      
      console.log(`🎯 Spawn cible: ${currentCount + 1}/${this.data.maxTargets}`);
      this.spawnRandomTarget();
    }, this.data.spawnInterval);
  },

  hasAvailableSurface: function () {
    if (this.sceneMeshHandler && this.sceneMeshHandler.isHitTestActive()) {
      const detected = this.sceneMeshHandler.getDetectedSurface();
      if (detected && detected.isRealSurface) {
        console.log("✅ Hit-test actif: surface réelle disponible");
        this.debugLog("Hit-test: surface OK");
        return true;
      }
    }

    if (!this.surfaceDetector || !this.surfaceDetector.surfaces) return false;

    const horizontal = this.surfaceDetector.surfaces.horizontal || [];
    const vertical = this.surfaceDetector.surfaces.vertical || [];
    const total = horizontal.length + vertical.length;
    if (total === 0) {
      console.log("⚠️ Aucune surface détectée par surface-detector");
      return false;
    }

    if (!this.data.requireRealSurfaces) {
      console.log("ℹ️ requireRealSurfaces désactivé, surface acceptée");
      return true;
    }

    const realHorizontal = horizontal.filter((s) => s.isRealSurface).length;
    const realVertical = vertical.filter((s) => s.isRealSurface).length;
    const hasReal = realHorizontal + realVertical > 0;
    console.log(
      "🧱 Surfaces réelles surface-detector:",
      `horizontal=${realHorizontal} vertical=${realVertical} hasReal=${hasReal}`,
    );
    return hasReal;
  },

  generateFreeSpacePosition: function () {
    // 🌟 NOUVELLE APPROCHE: Générer une position dans l'espace libre devant le joueur
    // Les surfaces ne sont PAS utilisées pour le spawn, seulement pour délimiter le mouvement
    
    const camera = this.el.sceneEl.camera;
    if (!camera) {
      console.warn("⚠️ Pas de caméra pour générer position libre");
      return null;
    }

    const cameraPos = camera.getWorldPosition(new THREE.Vector3());
    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // Position aléatoire dans un volume devant le joueur (zone élargie)
    const distance = 2.0 + Math.random() * 3.0; // 2.0m à 5.0m devant le joueur
    const horizontalOffset = (Math.random() - 0.5) * 3.5; // -1.75m à +1.75m sur les côtés (zone plus large)
    const verticalOffset = (Math.random() - 0.3) * 1.2; // Position autour du niveau des yeux
    
    // Direction de base vers l'avant
    const spawnDir = cameraForward.clone();
    
    // Ajouter offset horizontal (perpendiculaire à la direction)
    const rightDir = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    spawnDir.add(rightDir.multiplyScalar(horizontalOffset / distance));
    spawnDir.normalize();
    
    // Position finale
    const position = cameraPos.clone()
      .add(spawnDir.multiplyScalar(distance))
      .add(new THREE.Vector3(0, verticalOffset, 0));
    
    // Vérifier qu'il n'y a pas d'obstacle à cette position
    const raycaster = new THREE.Raycaster();
    const dirToPos = position.clone().sub(cameraPos).normalize();
    const distToPos = position.distanceTo(cameraPos);
    
    raycaster.set(cameraPos, dirToPos);
    raycaster.far = distToPos;
    
    const scene = this.el.sceneEl;
    const obstacles = [];
    scene.object3D.traverse((obj) => {
      if (obj.isMesh && obj.visible && !obj.el?.hasAttribute('target-behavior')) {
        obstacles.push(obj);
      }
    });
    
    const intersects = raycaster.intersectObjects(obstacles, false);
    if (intersects.length > 0 && intersects[0].distance < distToPos * 0.7) {
      console.log("⚠️ Obstacle trop proche dans la ligne de vue, position rejetée");
      return null;
    }
    
    // Rotation pour faire face à la caméra
    const toCamera = cameraPos.clone().sub(position).normalize();
    const rotation = {
      x: 0,
      y: THREE.MathUtils.radToDeg(Math.atan2(toCamera.x, toCamera.z)),
      z: 0
    };
    
    console.log(
      `🌟 Position libre générée: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}) | distance=${distance.toFixed(1)}m`,
    );
    
    return {
      position,
      rotation,
      surfaceType: "vertical", // Type virtuel pour compatibilité
      isRealSurface: false,
      normal: toCamera // Direction vers la caméra comme "normale" virtuelle
    };
  },

  calculateSpawnFromHitTest: function (detectedSurface) {
    // Cette fonction n'est plus utilisée pour le spawn direct
    // Elle sert uniquement de référence pour calculer les normales de surfaces
    const position = detectedSurface.position.clone
      ? detectedSurface.position.clone()
      : new THREE.Vector3(
          detectedSurface.position.x,
          detectedSurface.position.y,
          detectedSurface.position.z,
        );
    const normal = detectedSurface.normal.clone
      ? detectedSurface.normal.clone()
      : new THREE.Vector3(
          detectedSurface.normal.x,
          detectedSurface.normal.y,
          detectedSurface.normal.z,
        );

    const flattenedNormal = new THREE.Vector3(normal.x, 0, normal.z);
    if (flattenedNormal.lengthSq() < 0.0001) {
      return null;
    }
    const normalizedNormal = flattenedNormal.normalize();

    return {
      position,
      rotation: { x: 0, y: 0, z: 0 },
      surfaceType: "vertical",
      isRealSurface: true,
      normal: normalizedNormal,
    };
  },

  ensureFacingCamera: function (spawnData) {
    const camera = this.el.sceneEl.camera;
    if (!camera || !spawnData?.rotation) return;

    const position = spawnData.position instanceof THREE.Vector3
      ? spawnData.position
      : new THREE.Vector3(
          spawnData.position.x,
          spawnData.position.y,
          spawnData.position.z,
        );

    const cameraPos = camera.getWorldPosition(new THREE.Vector3());
    const toCamera = new THREE.Vector3()
      .subVectors(cameraPos, position)
      .normalize();

    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(spawnData.rotation.x || 0),
      THREE.MathUtils.degToRad(spawnData.rotation.y || 0),
      THREE.MathUtils.degToRad(spawnData.rotation.z || 0),
      "YXZ",
    );
    const forwardNegZ = new THREE.Vector3(0, 0, -1)
      .applyEuler(euler)
      .normalize();
    const forwardPosZ = new THREE.Vector3(0, 0, 1)
      .applyEuler(euler)
      .normalize();

    // Choisir l'axe qui regarde le plus la caméra, puis corriger si besoin
    if (forwardNegZ.dot(toCamera) < forwardPosZ.dot(toCamera)) {
      spawnData.rotation.y = (spawnData.rotation.y || 0) + 180;
    } else if (forwardNegZ.dot(toCamera) < 0) {
      spawnData.rotation.y = (spawnData.rotation.y || 0) + 180;
    }
  },

  calculateAvailableMovementSpace: function (spawnPosition, surfaceNormal) {
    // ⭕ Calculer le RAYON MAX CIRCULAIRE pour chaque plan de rotation
    // Test sur 360° pour éviter toute collision
    const raycaster = new THREE.Raycaster();
    raycaster.near = 0.01;
    raycaster.far = 5.0;
    
    const scene = this.el.sceneEl;
    const collisionObjects = [];
    
    // Collecter les surfaces WebXR détectées
    const realSurfaces = scene.querySelectorAll('[data-real-surface="true"]');
    console.log(`🌐 WebXR surfaces: ${realSurfaces.length}`);
    
    realSurfaces.forEach(surfaceEntity => {
      surfaceEntity.object3D.traverse((child) => {
        if (child.isMesh && child.visible && child.geometry) {
          collisionObjects.push(child);
        }
      });
    });
    
    // Collecter autres objets (exclure cibles, HUD, flèches)
    scene.object3D.traverse((object) => {
      if (object.isMesh && object.visible && object.geometry) {
        let isExcluded = false;
        let parent = object;
        while (parent) {
          if (parent.el) {
            if (parent.el.hasAttribute('target-behavior') || 
                parent.el.hasAttribute('flying-target') ||
                parent.el.hasAttribute('hud-element') ||
                parent.el.classList.contains('clickable') ||
                parent.el.hasAttribute('arrow-physics') ||
                parent.el.hasAttribute('data-real-surface')) {
              isExcluded = true;
              break;
            }
          }
          parent = parent.parent;
        }
        if (!isExcluded) collisionObjects.push(object);
      }
    });
    
    console.log(`🔍 ${collisionObjects.length} objets collision (${realSurfaces.length} WebXR)`);
    
    // Tester 3 plans de rotation possibles
    // Plan XY (vertical): cercle dans l'espace gauche-droite / haut-bas
    // Plan XZ (horizontal): cercle dans l'espace gauche-droite / avant-arrière  
    // Plan YZ (sagittal): cercle dans l'espace haut-bas / avant-arrière
    
    const testPlanes = [
      { name: 'XY', axis1: new THREE.Vector3(1, 0, 0), axis2: new THREE.Vector3(0, 1, 0) },
      { name: 'XZ', axis1: new THREE.Vector3(1, 0, 0), axis2: new THREE.Vector3(0, 0, 1) },
      { name: 'YZ', axis1: new THREE.Vector3(0, 1, 0), axis2: new THREE.Vector3(0, 0, 1) }
    ];
    
    const radiusPerPlane = {};
    let totalHits = 0;
    
    for (const plane of testPlanes) {
      let minDistance = 0.6; // Distance max par défaut (60cm de rayon - réduit pour éviter les murs)
      const numAngles = 32; // Tester 32 directions sur le cercle (tous les 11.25°)
      let planeHits = 0;
      
      for (let i = 0; i < numAngles; i++) {
        const angle = (i / numAngles) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        // Direction = cos * axis1 + sin * axis2
        const direction = new THREE.Vector3()
          .addScaledVector(plane.axis1, cos)
          .addScaledVector(plane.axis2, sin)
          .normalize();
        
        raycaster.set(spawnPosition, direction);
        const hits = raycaster.intersectObjects(collisionObjects, false);
        
        if (hits.length > 0) {
          // Marge de sécurité: 35cm avant l'obstacle (augmenté pour plus de sécurité)
          const safeDistance = Math.max(0.10, hits[0].distance - 0.35);
          minDistance = Math.min(minDistance, safeDistance);
          planeHits++;
        }
      }
      
      // Rayon minimum garanti: 20cm
      radiusPerPlane[plane.name] = Math.max(minDistance, 0.20);
      totalHits += planeHits;
      
      console.log(`   ${plane.name}: r=${radiusPerPlane[plane.name].toFixed(2)}m (${planeHits} obstacles)`);
    }
    
    console.log(`⭕ Rayons circulaires calculés: XY=${radiusPerPlane.XY.toFixed(2)}m, XZ=${radiusPerPlane.XZ.toFixed(2)}m, YZ=${radiusPerPlane.YZ.toFixed(2)}m`);
    
    return { 
      radiusXY: radiusPerPlane.XY,
      radiusXZ: radiusPerPlane.XZ,
      radiusYZ: radiusPerPlane.YZ
    };
  },

  spawnRandomTarget: function () {
    const target = document.createElement("a-entity");
    const targetId = `target-${Date.now()}`;

    let spawnData = null;
    let spawnSource = "espace libre";

    // 🌟 NOUVELLE APPROCHE: Générer directement dans l'espace libre
    // Les surfaces ne servent QUE pour calculer les limites de mouvement
    spawnData = this.generateFreeSpacePosition();
    
    if (!spawnData) {
      console.log("❌ Impossible de générer une position dans l'espace libre");
      this.debugLog("Spawn: no free space");
      return;
    }

    const camera = this.el.sceneEl.camera;
    const cameraPos = camera
      ? camera.getWorldPosition(new THREE.Vector3())
      : new THREE.Vector3(0, 1.6, 0);

    const pos = spawnData.position instanceof THREE.Vector3
      ? spawnData.position
      : new THREE.Vector3(
          spawnData.position.x,
          spawnData.position.y,
          spawnData.position.z,
        );

    const distance = pos.distanceTo(cameraPos);
    if (distance < 1.2 || distance > 12) {
      console.log(
        "⚠️ Spawn rejeté (distance)",
        distance.toFixed(2),
      );
      this.debugLog(`Spawn: distance ${distance.toFixed(2)}`);
      return;
    }

    const toTarget = new THREE.Vector3()
      .subVectors(pos, cameraPos)
      .normalize();
    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      camera?.quaternion || new THREE.Quaternion(),
    );
    const angle = Math.acos(toTarget.dot(cameraForward)) * (180 / Math.PI);
    const maxAngle = this.firstTargetSpawned ? 120 : 60;
    if (angle > maxAngle) {
      console.log(
        "⚠️ Spawn rejeté (angle)",
        angle.toFixed(1),
        `max=${maxAngle}`,
      );
      this.debugLog(`Spawn: angle ${angle.toFixed(1)}/${maxAngle}`);
      return;
    }

    // 🚫 Empêcher le spawn au même endroit que la cible précédente
    if (this.lastSpawnPosition) {
      const distanceToPrevious = pos.distanceTo(this.lastSpawnPosition);
      if (distanceToPrevious < 0.5) {
        console.log(
          "⚠️ Spawn rejeté (même position que précédente)",
          distanceToPrevious.toFixed(2) + "m",
        );
        this.debugLog(`Spawn: same pos as prev ${distanceToPrevious.toFixed(2)}m`);
        return;
      }
    }

    // 🎯 La rotation est déjà définie correctement dans calculateSpawnFromHitTest()
    // Pas besoin de correction supplémentaire pour les surfaces verticales

    const minDistance = 0.7; // Réduit pour permettre plus de cibles proches
    for (const existing of this.activeTargets) {
      if (!existing || !existing.object3D) continue;
      if (existing.object3D.position.distanceTo(pos) < minDistance) return;
    }

    // 📏 Taille INVERSEMENT proportionnelle à la distance pour le réalisme
    // Distance min=1.2m => scale max=0.70, Distance max=12m => scale min=0.30
    const maxScale = 0.70;
    const minScale = 0.30;
    const maxDistance = 12;
    const minDistanceSpawn = 1.2;
    // Formula: plus loin = plus petit
    const scale = maxScale - ((distance - minDistanceSpawn) / (maxDistance - minDistanceSpawn)) * (maxScale - minScale);

    console.log(
      `📏 Cible: distance=${distance.toFixed(1)}m → scale=${scale.toFixed(3)} (plus loin = plus petit)`,
    );

    let points = 10;
    let hp = 1;

    if (this.data.difficulty === "hard") {
      points = 20;
      hp = Math.floor(Math.random() * 3) + 1;
    } else if (this.data.difficulty === "normal") {
      points = 15;
      hp = Math.random() > 0.7 ? 2 : 1;
    }

    if (spawnData.surfaceType === "vertical") {
      points = Math.floor(points * 1.2);
    }

    target.id = targetId;
    target.setAttribute("position", `${pos.x} ${pos.y} ${pos.z}`);
    target.setAttribute("rotation", spawnData.rotation);
    target.setAttribute("scale", `${scale} ${scale} ${scale}`);
    
    console.log(`📍 Position de la cible définie: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    
    // ✈️ TEST MODE: ALL targets are flying (phase system disabled)
    const isFlyingTarget = true;
    const surfaceType = "vertical";
    target.setAttribute("surface-type", surfaceType);

    console.log(`🎯 Cible créée: isFlyingTarget=${isFlyingTarget} (ALWAYS TRUE IN TEST MODE)`);

    if (!isFlyingTarget) {
      target.setAttribute("static-body", {
        shape: "cylinder",
        cylinderAxis: "z",
      });
    }

    target.setAttribute("target-behavior", {
      points,
      hp,
      movable: false,
    });

    // Créer la géométrie de la cible avec fallback visuel
    const modelEntity = document.createElement("a-entity");
    modelEntity.setAttribute("gltf-model", "#target-model");
    // Rotation du modèle 3D : la cible par défaut regarde vers -Z (forward)
    // Si le modèle apparaît de profil, ajustez la rotation Y (0, 90, 180, ou 270)
    modelEntity.setAttribute("rotation", "0 0 0");
    modelEntity.setAttribute("scale", "1 1 1");

    const fallbackSphere = document.createElement("a-entity");
    fallbackSphere.setAttribute("geometry", {
      primitive: "sphere",
      radius: 0.25,
    });
    fallbackSphere.setAttribute("material", {
      color: "#ff3b30",
      shader: "flat",
      opacity: 0.9,
    });
    // Garder la sphère visible pour confirmer le mouvement circulaire
    fallbackSphere.setAttribute("visible", true);

    // Afficher le modèle après chargement (la sphère est déjà cachée)
    modelEntity.addEventListener("model-loaded", () => {
      this.debugLog("Target model loaded");
    });

    modelEntity.addEventListener("model-error", (evt) => {
      const errorDetail = evt?.detail?.src || "unknown";
      console.warn(`⚠️ Erreur chargement modèle cible: ${errorDetail}`);
      this.debugLog(`Target model error: ${errorDetail}`);
      // Afficher la sphère fallback en cas d'erreur
      fallbackSphere.setAttribute("visible", true);
    });

    target.appendChild(modelEntity);
    target.appendChild(fallbackSphere);

    // Ajouter à la scène D'ABORD
    this.el.appendChild(target);
    this.activeTargets.push(target);
    this.firstTargetSpawned = true;

    // TOUTES les cibles sont mobiles avec mouvement circulaire
    // Calculer le rayon maximum et le plan de rotation basés sur les limites détectées
    
    // 🔍 DEBUG: Vérifier que la normale existe
    if (!spawnData.normal) {
      console.error(`❌ PROBLÈME: spawnData.normal est undefined!`, spawnData);
      // Fallback: utiliser une normale par défaut
      spawnData.normal = new THREE.Vector3(0, 0, 1);
    }
    
    console.log(`🔍 Normal avant calculateAvailableMovementSpace:`, spawnData.normal);
    const radiusData = this.calculateAvailableMovementSpace(pos, spawnData.normal);
    console.log(`⭕ Rayons calculés:`, radiusData);
    
    // Choisir le plan de rotation avec le plus grand rayon disponible
    let plane = "xy";
    let radius = radiusData.radiusXY;
    
    if (radiusData.radiusXZ > radius) {
      plane = "xz";
      radius = radiusData.radiusXZ;
    }
    if (radiusData.radiusYZ > radius) {
      plane = "yz";
      radius = radiusData.radiusYZ;
    }
    
    // Rayon minimum pour mouvement visible (réduit pour éviter les collisions)
    radius = Math.max(radius, 0.25);
    
    const planeNames = { xy: "vertical", xz: "horizontal", yz: "sagittal" };
    const planeName = planeNames[plane] || plane;
    
    console.log(`⭕ Mouvement circulaire:`);
    console.log(`   📐 Plan optimal: ${planeName} (${plane})`);
    console.log(`   📏 Rayon: ${radius.toFixed(2)}m`);
    console.log(`   🔄 Tous rayons: XY=${radiusData.radiusXY.toFixed(2)}m, XZ=${radiusData.radiusXZ.toFixed(2)}m, YZ=${radiusData.radiusYZ.toFixed(2)}m`);
    
    // ⚠️ CORRECTION: Augmenter le délai pour s'assurer que l'entité est complètement initialisée
    // Attendre que l'entité soit complètement initialisée avant d'ajouter le composant de mouvement
    setTimeout(() => {
      // Vérifier que l'entité est toujours dans la scène
      if (!target.parentNode) {
        console.error(`❌ Entité ${targetId} n'est plus dans la scène!`);
        return;
      }

      // ✅ CORRECTION: Forcer la mise à jour de la matrice world avant de capturer la position
      target.object3D.updateMatrixWorld(true);
      
      // Vérifier la position de l'entité
      const currentPos = target.object3D.position;
      console.log(`🔍 Position vérifiée avant ajout flying-target: (${currentPos.x.toFixed(2)}, ${currentPos.y.toFixed(2)}, ${currentPos.z.toFixed(2)})`);

      // Mouvement circulaire pour des cibles volantes dans l'espace libre
      const speed = 0.3 + Math.random() * 0.4; // Vitesse angulaire entre 0.3 et 0.7 rad/s (réduit pour meilleure visibilité)
      
      console.log(`🎯 Application du composant flying-target avec:`, {
        radius: radius.toFixed(2),
        plane: plane,
        speed: speed.toFixed(1),
        enabled: true
      });
      
      // 🔥 Mouvement circulaire avec rayon calculé pour éviter les collisions
      target.setAttribute("flying-target-simple", {
        radius: radius,
        plane: plane,
        speed: speed,
        enabled: true
      });
      
      console.log(`✅ Composant flying-target-simple configuré: rayon=${radius.toFixed(2)}m, vitesse=${speed.toFixed(1)} rad/s, plan=${planeName}`);
    }, 50); // Délai minimal pour s'assurer que l'entité est initialisée

    // 🚫 Sauvegarder la position de spawn pour éviter les répétitions
    this.lastSpawnPosition = pos.clone();

    if (this.useAnchors && this.anchorManager) {
      setTimeout(() => {
        this.anchorTarget(target, pos, spawnData.rotation);
      }, 100);
    }

    console.log(
      `🎯 Nouvelle cible spawned: ${targetId} | source=${spawnSource} | (${points}pts, ${hp}HP) | pos=(${pos.x.toFixed(2)},${pos.y.toFixed(2)},${pos.z.toFixed(2)}) | rot=(${spawnData.rotation.x.toFixed(0)},${spawnData.rotation.y.toFixed(0)},${spawnData.rotation.z.toFixed(0)}) | real=${spawnData.isRealSurface ? "OUI" : "NON"} | distance=${distance.toFixed(1)}m`,
    );
  },

  onTargetHit: function (evt) {
    const { points } = evt.detail;

    if (!points) return;

    this.totalHits++;
    const currentScore = this.totalScore;
    const newScore = currentScore + points;
    this.totalScore = newScore;
    this.el.setAttribute("state", "score", newScore);
    this.updateScoreDisplay();
  },

  onTargetDestroyed: function (evt) {
    const { bonusPoints } = evt.detail;
    const beforeCount = this.activeTargets.length;
    this.activeTargets = this.activeTargets.filter((t) => t.parentNode);
    const afterCount = this.activeTargets.length;
    
    console.log(`💥 Cible détruite: ${beforeCount} → ${afterCount} cibles actives`);

    if (bonusPoints > 0) {
      const newScore = this.totalScore + bonusPoints;
      this.totalScore = newScore;
      this.el.setAttribute("state", "score", newScore);
    }

    this.updateScoreDisplay();
  },

  onArrowShot: function (evt) {
    this.totalArrowsShot++;
    console.log(`🏹 Flèches tirées: ${this.totalArrowsShot}`);
  },

  createScoreDisplay: function () {
    const hud = document.createElement("div");
    hud.id = "game-hud";
    hud.innerHTML = `
      <style>
        #game-hud {
          position: fixed;
          top: 20px;
          left: 20px;
          background: linear-gradient(135deg, #2d1b0e 0%, #4a3728 100%);
          border: 3px solid #d4af37;
          border-radius: 8px;
          padding: 15px 25px;
          font-family: 'Georgia', serif;
          color: #f4e4bc;
          z-index: 1000;
          pointer-events: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3);
          min-width: 180px;
        }
        #game-hud .hud-title {
          text-align: center;
          font-size: 14px;
          color: #d4af37;
          border-bottom: 2px solid #d4af37;
          padding-bottom: 8px;
          margin-bottom: 12px;
          letter-spacing: 2px;
        }
        #game-hud .hud-timer {
          text-align: center;
          font-size: 42px;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
          margin: 8px 0;
        }
        #game-hud .hud-timer-label {
          text-align: center;
          font-size: 12px;
          color: #d4af37;
          margin-bottom: 12px;
        }
        #game-hud .hud-timer.warning {
          color: #e74c3c;
          animation: pulse-warning 0.5s ease-in-out infinite;
        }
        @keyframes pulse-warning {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        #game-hud .hud-stat {
          display: flex;
          justify-content: space-between;
          margin: 6px 0;
          font-size: 16px;
        }
        #game-hud .hud-stat-label {
          color: #d4af37;
        }
        #game-hud .hud-stat-value {
          color: #fff;
          font-weight: bold;
        }
        #game-hud .hud-separator {
          height: 1px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          margin: 10px 0;
        }
      </style>
      <div class="hud-title">⚔️ CHASSE EN COURS ⚔️</div>
      <div class="hud-timer" id="timer-value">10</div>
      <div class="hud-timer-label">secondes restantes</div>
      <div class="hud-separator"></div>
      <div class="hud-stat">
        <span class="hud-stat-label">Butin :</span>
        <span class="hud-stat-value" id="score-value">0</span>
      </div>
      <div class="hud-stat">
        <span class="hud-stat-label">Cibles :</span>
        <span class="hud-stat-value" id="targets-value">0</span>
      </div>
    `;
    document.body.appendChild(hud);
  },

  updateScoreDisplay: function () {
    const scoreEl = document.getElementById("score-value");
    const targetsEl = document.getElementById("targets-value");

    if (scoreEl) {
      scoreEl.textContent = this.totalScore;
    }

    if (targetsEl) {
      targetsEl.textContent = this.activeTargets.length;
    }
  },

  anchorTarget: async function (target, position, rotation) {
    if (!this.anchorManager) return;

    try {
      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(rotation.x || 0),
        THREE.MathUtils.degToRad(rotation.y || 0),
        THREE.MathUtils.degToRad(rotation.z || 0),
        "XYZ",
      );
      const quaternion = new THREE.Quaternion().setFromEuler(euler);

      const anchorId = await this.anchorManager.createAnchor({
        position: new THREE.Vector3(position.x, position.y, position.z),
        quaternion,
      });

      if (anchorId) {
        this.anchorManager.attachToAnchor(target, anchorId);
      }
    } catch (error) {
      console.log(`⚠️ Impossible d'ancrer la cible ${target.id}:`, error);
    }
  },

  stopGame: function () {
    this.gameRunning = false;
    if (this.spawnTimer) {
      clearInterval(this.spawnTimer);
      this.spawnTimer = null;
    }

    // Arrêter les phases de mouvement
    if (this.movementPhaseTimer) {
      clearInterval(this.movementPhaseTimer);
      this.movementPhaseTimer = null;
    }

    console.log("🎮 Jeu arrêté");
  },

  tick: function (time, deltaTime) {
    // Mise à jour périodique si nécessaire
    if (this.gameRunning && time % 1000 < 16) {
      this.updateScoreDisplay();
    }
  },
});
