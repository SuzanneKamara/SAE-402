/**
 * Composant pause-menu pour A-Frame
 * Affiche un menu de pause avec options : Reprendre / Redémarrer / Quitter
 * Style médiéval cohérent avec vr-menu et end-menu
 */

AFRAME.registerComponent("pause-menu", {
  init: function () {
    this.isVisible = false;

    // Créer le panneau de pause
    this.createPausePanel();

    // Masquer au démarrage
    this.el.setAttribute("visible", false);

    // Écouter les événements de pause
    this.el.sceneEl.addEventListener("game-paused", () => {
      this.showMenu();
    });

    this.el.sceneEl.addEventListener("game-resumed", () => {
      this.hideMenu();
    });

    console.log("⏸️ Menu de pause initialisé");
  },

  createPausePanel: function () {
    const menu = this.el;

    // Marquer comme élément HUD pour exclure de la détection de collision des flèches
    menu.setAttribute("hud-element", true);

    // Positionner le menu devant le joueur
    menu.setAttribute("position", "0 1.5 -2");
    menu.setAttribute("rotation", "0 0 0");

    // Couleurs médiévales
    const COLORS = {
      darkWood: "#2d1b0e",
      lightWood: "#4a3728",
      gold: "#d4af37",
      parchment: "#f4e4bc",
      darkRed: "#8b0000",
      orange: "#ff8c00",
    };

    // Bordure dorée extérieure
    const borderOuter = document.createElement("a-entity");
    borderOuter.setAttribute("geometry", {
      primitive: "plane",
      width: 1.4,
      height: 1.5,
    });
    borderOuter.setAttribute("material", {
      color: COLORS.gold,
      opacity: 1,
      shader: "flat",
    });
    borderOuter.setAttribute("position", "0 0 -0.002");
    menu.appendChild(borderOuter);

    // Panneau de bois
    const panel = document.createElement("a-entity");
    panel.setAttribute("geometry", {
      primitive: "plane",
      width: 1.34,
      height: 1.44,
    });
    panel.setAttribute("material", {
      color: COLORS.darkWood,
      opacity: 0.98,
      shader: "flat",
    });
    panel.setAttribute("position", "0 0 -0.001");
    menu.appendChild(panel);

    // Parchemin central
    const parchment = document.createElement("a-entity");
    parchment.setAttribute("geometry", {
      primitive: "plane",
      width: 1.2,
      height: 1.3,
    });
    parchment.setAttribute("material", {
      color: COLORS.parchment,
      opacity: 0.15,
      shader: "flat",
    });
    parchment.setAttribute("position", "0 0 0");
    menu.appendChild(parchment);

    // Titre "PAUSE"
    const title = document.createElement("a-text");
    title.setAttribute("value", "⏸️ PAUSE ⏸️");
    title.setAttribute("position", "0 0.52 0.01");
    title.setAttribute("align", "center");
    title.setAttribute("color", COLORS.gold);
    title.setAttribute("width", "2");
    menu.appendChild(title);

    // Ligne décorative
    const separator = document.createElement("a-entity");
    separator.setAttribute("geometry", {
      primitive: "plane",
      width: 1.0,
      height: 0.015,
    });
    separator.setAttribute("material", {
      color: COLORS.gold,
      opacity: 0.7,
      shader: "flat",
    });
    separator.setAttribute("position", "0 0.4 0.01");
    menu.appendChild(separator);

    // Texte d'information
    const infoText = document.createElement("a-text");
    infoText.setAttribute("value", "Partie en pause");
    infoText.setAttribute("position", "0 0.25 0.01");
    infoText.setAttribute("align", "center");
    infoText.setAttribute("color", COLORS.parchment);
    infoText.setAttribute("width", "1.6");
    menu.appendChild(infoText);

    // === BOUTON REPRENDRE ===
    this.createButton({
      parent: menu,
      text: "▶️ Reprendre",
      position: "0 0.05 0.01",
      color: COLORS.gold,
      hoverColor: COLORS.orange,
      onClick: () => {
        this.resumeGame();
      },
    });

    // === BOUTON REDÉMARRER ===
    this.createButton({
      parent: menu,
      text: "🔄 Redemarrer",
      position: "0 -0.2 0.01",
      color: COLORS.lightWood,
      hoverColor: COLORS.gold,
      onClick: () => {
        this.restartGame();
      },
    });

    // === BOUTON QUITTER ===
    this.createButton({
      parent: menu,
      text: "🚪 Menu Principal",
      position: "0 -0.45 0.01",
      color: COLORS.darkRed,
      hoverColor: "#ff0000",
      onClick: () => {
        this.quitToMenu();
      },
    });
  },

  createButton: function ({ parent, text, position, color, hoverColor, onClick }) {
    const button = document.createElement("a-entity");
    button.setAttribute("position", position);

    // Fond du bouton
    const bg = document.createElement("a-entity");
    bg.setAttribute("geometry", {
      primitive: "plane",
      width: 0.9,
      height: 0.18,
    });
    bg.setAttribute("material", {
      color: color,
      opacity: 0.9,
      shader: "flat",
    });
    bg.classList.add("clickable");
    button.appendChild(bg);

    // Texte du bouton
    const label = document.createElement("a-text");
    label.setAttribute("value", text);
    label.setAttribute("align", "center");
    label.setAttribute("position", "0 0 0.01");
    label.setAttribute("color", "#ffffff");
    label.setAttribute("width", "1.6");
    button.appendChild(label);

    // Interaction hover
    bg.addEventListener("mouseenter", () => {
      bg.setAttribute("material", "color", hoverColor);
      bg.setAttribute("material", "opacity", 1);
      bg.setAttribute("scale", "1.05 1.05 1");
    });

    bg.addEventListener("mouseleave", () => {
      bg.setAttribute("material", "color", color);
      bg.setAttribute("material", "opacity", 0.9);
      bg.setAttribute("scale", "1 1 1");
    });

    // Interaction clic
    bg.addEventListener("click", onClick);

    parent.appendChild(button);
    return button;
  },

  showMenu: function () {
    if (this.isVisible) return;
    this.isVisible = true;
    this.el.setAttribute("visible", true);

    // Positionner devant la caméra
    const camera = this.el.sceneEl.camera;
    if (camera) {
      const cameraPos = camera.getWorldPosition(new THREE.Vector3());
      const cameraDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      cameraDir.multiplyScalar(2);
      
      const menuPos = new THREE.Vector3()
        .addVectors(cameraPos, cameraDir)
        .setY(cameraPos.y);

      this.el.setAttribute("position", menuPos);
      
      // Orienter vers la caméra
      this.el.object3D.lookAt(cameraPos);
    }

    console.log("⏸️ Menu de pause affiché");
  },

  hideMenu: function () {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.el.setAttribute("visible", false);
    console.log("▶️ Menu de pause masqué");
  },

  resumeGame: function () {
    this.el.sceneEl.emit("resume-game");
    console.log("▶️ Reprise du jeu");
  },

  restartGame: function () {
    this.hideMenu();
    this.el.sceneEl.emit("restart-game");
    console.log("🔄 Redémarrage du jeu");
  },

  quitToMenu: function () {
    this.hideMenu();
    this.el.sceneEl.emit("quit-to-menu");
    console.log("🚪 Retour au menu principal");
  },
});
