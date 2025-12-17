import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import SudokuGame from '../Views/SudokuGame.js';

// App2 entry point: runs the p5-based SudokuGame inside PocketOS
export default class App2 extends System {
	constructor() {
		super();
		this.game = null; // p5 SudokuGame
	}

	setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 2);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}

		this.game = new SudokuGame({ isEnabled: () => this.enabled });
	}

	draw() {
		const enable = !!this.enabled;
		if (enable && this.game) {
			this.game.draw();
		}
	}

	mousePressed() {
		if (!this.enabled || !this.game) return false;
		return this.game.mousePressed(mouseX, mouseY);
	}

	touchStarted() { return this.mousePressed(); }

	cleanup() {
		if (this.game) { this.game.cleanup(); this.game = null; }
	}
}
