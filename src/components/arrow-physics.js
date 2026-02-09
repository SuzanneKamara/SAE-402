/**
 * Composant arrow-physics avec simulation de gravité
 * La flèche suit une trajectoire parabolique réaliste
 * La puissance dépend de la distance de tirage de la corde
 */

AFRAME.registerComponent("arrow-physics", {
  schema: {
    speed: { type: "number", default: 45 },
    gravity: { type: "number", default: 0.005 }, // Gravité réduite pour des trajectoires plus droites
    mass: { type: "number", default: 0.001 }, // Masse de la flèche en kg
    dragCoefficient: { type: "number", default: 0.0005 }, // Résistance de l'air réduite
  },

  init: function () {
    this.hasCollided = false;
    this.lifetime = 0;
    this.maxLifetime = 8000; // 8 secondes max

    // Vecteurs pour la physique
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();

    // CORRECTION : Utiliser getWorldQuaternion pour l'orientation globale
    const worldQuaternion = new THREE.Quaternion();
    this.el.object3D.getWorldQuaternion(worldQuaternion);

    // Direction initiale de la flèche
    // L'axe forward en Three.js est (0, 0, -1)
    const initialDirection = new THREE.Vector3(0, 0, -1);
    initialDirection.applyQuaternion(worldQuaternion);
    initialDirection.normalize();

    // Initialiser la vélocité avec la vitesse et la direction
    this.velocity.copy(initialDirection).multiplyScalar(this.data.speed);

    // Log pour debug
    console.log("➡️ Flèche créée avec vélocité initiale:", {
      x: this.velocity.x.toFixed(2),
      y: this.velocity.y.toFixed(2),
      z: this.velocity.z.toFixed(2),
      vitesse: this.data.speed.toFixed(1),
    });

    // Raycaster pour détecter les collisions
    this.raycaster = new THREE.Raycaster();

    // Récupérer tous les objets de collision
    this.collisionObjects = [];
    this.updateCollisionObjects();
  },

  updateCollisionObjects: function () {
    const scene = this.el.sceneEl;

    // Cibles uniquement
    const targets = scene.querySelectorAll("[target-behavior]");
    targets.forEach((target) => {
      if (target.object3D) {
        this.collisionObjects.push({
          object: target.object3D,
          entity: target,
          type: "target",
        });
      }
    });

    // Meshes de la scène (planes, sols, environnement, etc.)
    const sceneMeshes = scene.querySelectorAll("[geometry]");
    sceneMeshes.forEach((mesh) => {
      // Vérifier si cet élément ou un de ses parents a l'attribut hud-element
      let isHudElement = false;
      let current = mesh;
      while (current && current !== scene) {
        if (current.hasAttribute && current.hasAttribute("hud-element")) {
          isHudElement = true;
          break;
        }
        current = current.parentNode;
      }
      
      // Exclure: la flèche elle-même, les cibles, et les éléments du HUD
      if (
        mesh.object3D &&
        mesh !== this.el &&
        !mesh.hasAttribute("target-behavior") &&
        !isHudElement
      ) {
        this.collisionObjects.push({
          object: mesh.object3D,
          entity: mesh,
          type: "environment",
        });
      }
    });

    console.log(
      `🎯 ${this.collisionObjects.length} objets de collision détectés`,
    );
  },

tick: function (time, deltaTime) {
  if (this.hasCollided) return;

  // dt en secondes
  const dt = deltaTime / 1000;

  // Mettre à jour la durée de vie
  this.lifetime += deltaTime;
  if (this.lifetime > this.maxLifetime) {
    this.removeArrow();
    return;
  }

  // 1. Accélération due à la gravité (accélération, pas force)
  const gravityAcc = new THREE.Vector3(0, -this.data.gravity, 0);

  // 2. Calculer la résistance de l'air (force), puis la convertir en accélération
  const velocityMagnitude = this.velocity.length();
  let dragAcc = new THREE.Vector3(0, 0, 0);
  if (velocityMagnitude > 0.0001) {
    const dragForce = this.velocity.clone()
      .normalize()
      .multiplyScalar(-this.data.dragCoefficient * velocityMagnitude * velocityMagnitude);
    dragAcc = dragForce.divideScalar(this.data.mass);
  }

  // 3. Somme des accélérations = Gravité + Drag/mass
  this.acceleration.copy(gravityAcc).add(dragAcc);

  // 4. Mise à jour de la vélocité: v = v + a * dt
  this.velocity.add(this.acceleration.clone().multiplyScalar(dt));

  // 5. Calculer le déplacement: s = v * dt
  const displacement = this.velocity.clone().multiplyScalar(dt);

  // 6. Orienter la flèche dans la direction de sa vélocité (pour qu'elle pointe vers où elle va)
  if (velocityMagnitude > 0.1) {
    const targetDirection = this.velocity.clone().normalize();
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), targetDirection);
    this.el.object3D.quaternion.copy(targetQuaternion);
  }

  // Raycast dans la direction du mouvement
  const currentPos = this.el.object3D.position.clone();
  const rayDistance = displacement.length();

  // IMPORTANT: Vérifier si on touche un bouton de menu EN PREMIER
  const worldPos = new THREE.Vector3();
  this.el.object3D.getWorldPosition(worldPos);

  // Vérifier le menu de démarrage
  const startMenuEl = this.el.sceneEl.querySelector("[vr-menu]");
  if (startMenuEl && startMenuEl.components["vr-menu"]) {
    if (startMenuEl.components["vr-menu"].checkArrowHit(worldPos)) {
      console.log("🎯 Menu démarrage touché !");
      this.hasCollided = true;
      this.removeArrow();
      return;
    }
  }

  // Vérifier le menu de fin
  const endMenuEl = this.el.sceneEl.querySelector("[end-menu]");
  if (endMenuEl && endMenuEl.components["end-menu"]) {
    if (endMenuEl.components["end-menu"].checkArrowHit(worldPos)) {
      console.log("🔄 Menu fin touché !");
      this.hasCollided = true;
      this.removeArrow();
      return;
    }
  }

  // Préparer le raycaster à partir de la position courante dans la direction du déplacement
  const rayDir = displacement.lengthSq() > 0 ? displacement.clone().normalize() : this.velocity.clone().normalize();
  this.raycaster.set(currentPos, rayDir);
  this.raycaster.far = Math.max(rayDistance * 1.2, 0.001);

  // Détecter les intersections
  const allObjects = this.collisionObjects.map((obj) => obj.object);
  const intersects = this.raycaster.intersectObjects(allObjects, true);

  if (intersects.length > 0 && intersects[0].distance <= rayDistance) {
    // Collision détectée !
    this.handleCollision(intersects[0]);
  } else {
    // Pas de collision, appliquer le déplacement
    this.el.object3D.position.add(displacement);
  }
},

  handleCollision: function (intersection) {
    if (this.hasCollided) return;
    this.hasCollided = true;

    const impactPoint = intersection.point.clone();

    // Trouver l'entité touchée
    let hitEntity = null;
    let hitType = "environment";

    for (let collisionObj of this.collisionObjects) {
      let current = intersection.object;
      while (current) {
        if (current === collisionObj.object) {
          hitEntity = collisionObj.entity;
          hitType = collisionObj.type;
          break;
        }
        current = current.parent;
      }
      if (hitEntity) break;
    }

    console.log(`💥 Collision: ${hitType}`);

    // Si c'est une cible, appeler son composant
    if (hitType === "target" && hitEntity.components["target-behavior"]) {
      hitEntity.components["target-behavior"].onArrowHit(this.el, impactPoint);
    }

    // Ajuster position pour que la flèche dépasse de la surface
    if (intersection.face && intersection.face.normal) {
      const normalWorld = intersection.face.normal.clone();
      normalWorld.transformDirection(intersection.object.matrixWorld);
      impactPoint.add(normalWorld.multiplyScalar(0.1));
    }

    if (hitType === "target" && hitEntity) {
      this.attachArrowToTarget(hitEntity, impactPoint);
    } else {
      // Planter la flèche à la position d'impact
      this.el.object3D.position.copy(impactPoint);
    }

    // Retirer la flèche après 5 secondes
    setTimeout(() => {
      this.animateRemoval();
    }, 5000);
  },

  animateRemoval: function () {
    if (!this.el || !this.el.parentNode) return;

    let elapsed = 0;
    const duration = 500;
    const startScale = this.el.getAttribute("scale") || { x: 1, y: 1, z: 1 };

    const animate = () => {
      elapsed += 16;
      const progress = Math.min(elapsed / duration, 1);
      const scale = startScale.x * (1 - progress);
      this.el.setAttribute("scale", `${scale} ${scale} ${scale}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.removeArrow();
      }
    };

    animate();
  },

  attachArrowToTarget: function (targetEl, worldImpactPoint) {
    const worldQuat = this.el.object3D.getWorldQuaternion(new THREE.Quaternion());
    const targetWorldQuat = targetEl.object3D.getWorldQuaternion(
      new THREE.Quaternion(),
    );
    targetWorldQuat.invert();

    const localImpact = targetEl.object3D.worldToLocal(
      worldImpactPoint.clone(),
    );
    const localQuat = targetWorldQuat.multiply(worldQuat);

    targetEl.appendChild(this.el);
    this.el.object3D.position.copy(localImpact);
    this.el.object3D.quaternion.copy(localQuat);
  },

  removeArrow: function () {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
  },
});
