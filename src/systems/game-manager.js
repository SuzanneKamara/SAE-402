/**
 * Système game-manager pour A-Frame
 * Gère le cycle de jeu, le spawn des cibles et le score global
 * Spawn sur surfaces réelles (hit-test) + fallback surface-detector
 */

AFRAME.registerSystem("game-manager", {
  schema: {
    spawnInterval: { type: "number", default: 500 }, // 0.8 secondes
    maxTargets: { type: "number", default: 3 },
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
    this.debugLog = (message) => {
      if (typeof window !== "undefined" && window.vrDebugLog) {
        window.vrDebugLog(message);
      }
    };
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
      this.debugLog(`${surfaceLog} ok=${hasRealSurface}`);

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
      if (this.activeTargets.length >= this.data.maxTargets) return;
      if (!this.hasAvailableSurface()) return;
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
      this.debugLog("Surface-detector: 0 surface");
      return false;
    }

    if (!this.data.requireRealSurfaces) {
      console.log("ℹ️ requireRealSurfaces désactivé, surface acceptée");
      this.debugLog("Surfaces: fallback ok");
      return true;
    }

    const realHorizontal = horizontal.filter((s) => s.isRealSurface).length;
    const realVertical = vertical.filter((s) => s.isRealSurface).length;
    const hasReal = realHorizontal + realVertical > 0;
    console.log(
      "🧱 Surfaces réelles surface-detector:",
      `horizontal=${realHorizontal} vertical=${realVertical} hasReal=${hasReal}`,
    );
    this.debugLog(
      `Surfaces: h=${realHorizontal} v=${realVertical} ok=${hasReal}`,
    );
    return hasReal;
  },

  calculateSpawnFromHitTest: function (detectedSurface) {
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

    // S'assurer que la normale pointe vers la camera pour que la cible fasse face au joueur
    const camera = this.el.sceneEl.camera;
    if (camera) {
      const cameraPos = camera.getWorldPosition(new THREE.Vector3());
      const toCamera = new THREE.Vector3()
        .subVectors(cameraPos, position)
        .normalize();
      if (normal.dot(toCamera) < 0) {
        normal.multiplyScalar(-1);
      }
    }

    let surfaceType = "vertical";
    let rotation = { x: 0, y: 0, z: 0 };

    // Garder uniquement les surfaces verticales et forcer une orientation droite
    const flattenedNormal = new THREE.Vector3(normal.x, 0, normal.z);
    if (flattenedNormal.lengthSq() < 0.0001) {
      return null;
    }
    const normalizedNormal = flattenedNormal.normalize();

    // Rotation verticale uniquement (yaw) pour garder la cible droite
    rotation = {
      x: 0,
      y: THREE.MathUtils.radToDeg(Math.atan2(normalizedNormal.x, normalizedNormal.z)),
      z: 0,
    };

    // Décaler la cible suffisamment hors de la surface pour éviter les collisions
    // Augmenté à 0.20m (20cm) pour tenir compte de la taille des cibles
    position.add(normalizedNormal.clone().multiplyScalar(0.20));

    console.log(
      `🎯 Spawn alignment: ${surfaceType} | normal=(${normalizedNormal.x.toFixed(2)},${normalizedNormal.y.toFixed(2)},${normalizedNormal.z.toFixed(2)}) | rotation=(${rotation.x.toFixed(0)},${rotation.y.toFixed(0)},${rotation.z.toFixed(0)})`,
    );

    return {
      position,
      rotation,
      surfaceType,
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
    // Deterner l'espace disponible pour le mouvement (raycast dans plusieurs directions)
    const raycaster = new THREE.Raycaster();
    
    // Directions de test (axes perpendiculaires à la surface)
    const rightDir = new THREE.Vector3(-surfaceNormal.z, 0, surfaceNormal.x).normalize();
    const upDir = new THREE.Vector3(0, 1, 0);
    
    // Distance max avant collision pour chaque direction
    let maxAmplitudeX = 0.5;  // Largeur (gauche/droite)
    let maxAmplitudeY = 0.3;  // Hauteur (haut/bas)
    
    // Tester les collisions en 4 directions (gauche, droite, haut, bas)
    const testDirections = [
      { dir: rightDir.clone().multiplyScalar(1), axis: 'X' },
      { dir: rightDir.clone().multiplyScalar(-1), axis: 'X' },
      { dir: upDir.clone().multiplyScalar(1), axis: 'Y' },
      { dir: upDir.clone().multiplyScalar(-1), axis: 'Y' }
    ];
    
    const scene = this.el.sceneEl;
    const collisionObjects = [];
    
    // Collecter TOUS les objets 3D pour raycast (scene mesh réel inclus)
    scene.object3D.traverse((object) => {
      if (object.isMesh && object.visible) {
        // Vérifier que l'objet n'est pas une cible ou un élément HUD
        let isTarget = false;
        let isHUD = false;
        
        // Remonter la hiérarchie pour vérifier les attributs
        let parent = object;
        while (parent) {
          if (parent.el) {
            if (parent.el.hasAttribute('target-behavior') || parent.el.hasAttribute('flying-target')) {
              isTarget = true;
              break;
            }
            if (parent.el.hasAttribute('hud-element') || parent.el.classList.contains('clickable')) {
              isHUD = true;
              break;
            }
          }
          parent = parent.parent;
        }
        
        if (!isTarget && !isHUD) {
          collisionObjects.push(object);
        }
      }
    });
    
    console.log(`🔍 Raycast: ${collisionObjects.length} objets de collision détectés`);
    
    // Raycast dans chaque direction
    let testCount = 0;
    for (const test of testDirections) {
      raycaster.set(spawnPosition, test.dir);
      const hits = raycaster.intersectObjects(collisionObjects, false);
      
      if (hits.length > 0) {
        const distance = hits[0].distance;
        // Marge de sécurité de 15cm
        const safeDistance = Math.max(0.05, distance - 0.15);
        
        if (test.axis === 'X') {
          maxAmplitudeX = Math.min(maxAmplitudeX, safeDistance);
        } else {
          maxAmplitudeY = Math.min(maxAmplitudeY, safeDistance);
        }
        testCount++;
        console.log(`  Direction ${test.axis}: collision à ${distance.toFixed(2)}m, safe=${safeDistance.toFixed(2)}m`);
      }
    }
    
    // S'assurer qu'il y a un minimum de mouvement
    const finalAmplitudeX = Math.max(maxAmplitudeX, 0.05); // 5cm minimum
    const finalAmplitudeY = Math.max(maxAmplitudeY, 0.05); // 5cm minimum
    
    console.log(`💪 Amplitudes finales: X=${finalAmplitudeX.toFixed(3)}m, Y=${finalAmplitudeY.toFixed(3)}m (${testCount} collisions détectées)`);
    
    return { x: finalAmplitudeX, y: finalAmplitudeY };
  },

  spawnRandomTarget: function () {
    const target = document.createElement("a-entity");
    const targetId = `target-${Date.now()}`;

    let spawnData = null;
    let spawnSource = "none";

    // Essayer d'abord le hit-test (surfaces réelles)
    if (this.sceneMeshHandler && this.sceneMeshHandler.isHitTestActive()) {
      const detected = this.sceneMeshHandler.getDetectedSurface();
      console.log("🔍 Hit-test détecté:", detected ? "OUI" : "NON", detected);
      if (detected) {
        spawnData = this.calculateSpawnFromHitTest(detected);
        if (spawnData) {
          spawnSource = "hit-test (surfaces réelles)";
          console.log("✅ Spawn depuis hit-test");
        }
      }
    } else {
      console.log("⚠️ Hit-test non actif, fallback vers surface-detector");
    }

    // Fallback vers surface-detector
    if (!spawnData && this.surfaceDetector) {
      spawnData = this.surfaceDetector.getRandomSpawnPoint();
      if (spawnData) {
        spawnSource = "surface-detector (fallback)";
        console.log("⚠️ Spawn depuis surface-detector (fallback)");
      }
    }

    if (!spawnData) {
      console.log("❌ Aucune donnée de spawn disponible");
      this.debugLog("Spawn: no data");
      return;
    }

    if (spawnData.surfaceType !== "vertical") {
      this.debugLog("Spawn: non-vertical surface ignored");
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
    if (distance < 1.5 || distance > 12) {
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
    const maxAngle = this.firstTargetSpawned ? 90 : 45;
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
      if (distanceToPrevious < 0.3) {
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

    const minDistance = 1.0;
    for (const existing of this.activeTargets) {
      if (!existing || !existing.object3D) continue;
      if (existing.object3D.position.distanceTo(pos) < minDistance) return;
    }

    // 📏 Taille INVERSEMENT proportionnelle à la distance pour le réalisme
    // Distance min=1.5m => scale max=0.70, Distance max=12m => scale min=0.30
    const maxScale = 0.70;
    const minScale = 0.30;
    const maxDistance = 12;
    const minDistanceSpawn = 1.5;
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
    // Cacher la sphère fallback par défaut
    fallbackSphere.setAttribute("visible", false);

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

    // TOUTES les cibles sont mobiles avec mouvement sinusoïdal
    // Calculer l'amplitude de mouvement sécurisée pour éviter les collisions
    const amplitudes = this.calculateAvailableMovementSpace(pos, spawnData.normal);
    
    console.log(`✈️ Ajout mouvement sinusoïdal: amplitudeX=${amplitudes.x.toFixed(3)}m, amplitudeY=${amplitudes.y.toFixed(3)}m`);
    
    // Mouvement dans un plan sagittal (X/Y) pour rester face à la caméra
    target.setAttribute("flying-target", {
      mode: "sagittal",
      amplitudeX: amplitudes.x,
      amplitudeY: amplitudes.y,
      amplitudeZ: 0.0,
      speed: 0.8 + Math.random() * 0.6, // Vitesse entre 0.8 et 1.4
      enabled: true,
    });

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
    this.activeTargets = this.activeTargets.filter((t) => t.parentNode);

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
