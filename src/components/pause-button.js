/**
 * Composant pause-button pour A-Frame
 * Bouton de pause visible en HUD pendant le jeu
 * Positionné en haut à droite de la vue
 */

AFRAME.registerComponent("pause-button", {
  init: function () {
    this.isVisible = false;
    this.createPauseButton();
    this.el.setAttribute("visible", false);

    // Afficher le bouton au démarrage du jeu
    this.el.sceneEl.addEventListener("start-game", () => {
      this.show();
    });

    // Masquer le bouton à la fin du jeu
    this.el.sceneEl.addEventListener("game-ended", () => {
      this.hide();
    });

    // Masquer le bouton lors de la pause
    this.el.sceneEl.addEventListener("game-paused", () => {
      this.hide();
    });

    // Afficher le bouton à la reprise
    this.el.sceneEl.addEventListener("game-resumed", () => {
      this.show();
    });

    console.log("⏸️ Bouton Pause initialisé");
  },

  createPauseButton: function () {
    const container = this.el;

    // Marquer comme élément HUD pour exclure de la détection de collision des flèches
    container.setAttribute("hud-element", true);

    // Positionnement relatif à la caméra (sera ajouté comme enfant de la caméra)
    container.setAttribute("position", "0.5 0.4 -0.8");

    // Conteneur du bouton
    const button = document.createElement("a-entity");
    button.setAttribute("position", "0 0 0");

    // Fond du bouton (cercle)
    const bg = document.createElement("a-cylinder");
    bg.setAttribute("color", "#ff6b6b");
    bg.setAttribute("radius", "0.08");
    bg.setAttribute("height", "0.01");
    bg.setAttribute("position", "0 0 0");
    bg.classList.add("clickable");

    // Icône pause
    const icon = document.createElement("a-text");
    icon.setAttribute("value", "⏸");
    icon.setAttribute("color", "#ffffff");
    icon.setAttribute("position", "0 0 0.008");
    icon.setAttribute("align", "center");
    icon.setAttribute("baseline", "center");
    icon.setAttribute("width", "0.2");

    button.appendChild(bg);
    button.appendChild(icon);

    // Interactions
    bg.addEventListener("mouseenter", () => {
      bg.setAttribute("color", "#ff8566");
      bg.setAttribute("scale", "1.15 1.15 1");
    });

    bg.addEventListener("mouseleave", () => {
      bg.setAttribute("color", "#ff6b6b");
      bg.setAttribute("scale", "1 1 1");
    });

    bg.addEventListener("click", () => {
      this.pauseGame();
    });

    container.appendChild(button);

    // Ajouter le bouton comme enfant de la caméra au démarrage du jeu
    // pour qu'il suive toujours le FOV du joueur
    this.el.sceneEl.addEventListener("start-game", () => {
      const camera = this.el.sceneEl.camera;
      if (camera && camera.el && !container.parentNode) {
        // Attendre le prochain frame pour s'assurer que la caméra est prête
        setTimeout(() => {
          const rig = this.el.sceneEl.querySelector("#rig");
          if (rig && container.parentNode === this.el.sceneEl) {
            rig.appendChild(container);
          }
        }, 100);
      }
    });
  },

  show: function () {
    if (this.isVisible) return;
    this.isVisible = true;
    this.el.setAttribute("visible", true);
  },

  hide: function () {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.el.setAttribute("visible", false);
  },

  pauseGame: function () {
    console.log("⏸️ Clic sur le bouton Pause");
    this.el.sceneEl.emit("pause-game");
  },
});
