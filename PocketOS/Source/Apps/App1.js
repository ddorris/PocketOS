import App from '../Core/App.js';
import SolitaireModel from '../Models/SolitaireModel.js';
import SolitaireGame from '../Views/App1/SolitaireGame.js';
import SpriteSheetSystem from '../Systems/SpriteSheetSystem.js';

export default class App1 extends App {
	constructor() {
		super();
		this.model = new SolitaireModel();
		this.game = null;
		this.isDebug = false; // Set to true to see card labels for debugging
		this.appDockHeight = 120;
	}

	setup() {
		// Inject SpriteSheetSystem
		const spriteSheetSystem = this.engine.systems.find(s => s instanceof SpriteSheetSystem);
		if (!spriteSheetSystem) return;
		
		// Initialize model
		this.model.initializeGame();
		
		// Create game view
		this.game = new SolitaireGame({
			model: this.model,
			spriteSheetSystem: spriteSheetSystem,
			isEnabled: () => this.enabled,
			isDebug: this.isDebug,
			appDockHeight: this.appDockHeight
		});
	}

	draw() {
		if (this.enabled === false) return;
		if (this.game) {
			this.game.draw();
		}
	}
	
	mousePressed() {
		if (this.enabled === false) return false;
		if (this.game) {
			return this.game.mousePressed(mouseX, mouseY);
		}
		return false;
	}
	
	mouseDragged() {
		if (this.enabled === false) return false;
		if (this.game) {
			return this.game.mouseDragged(mouseX, mouseY);
		}
		return false;
	}
	
	mouseReleased() {
		if (this.enabled === false) return false;
		if (this.game) {
			return this.game.mouseReleased(mouseX, mouseY);
		}
		return false;
	}
	
	touchStarted() {
		return this.mousePressed();
	}
	
	touchMoved() {
		return this.mouseDragged();
	}
	
	touchEnded() {
		return this.mouseReleased();
	}
}
