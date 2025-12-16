import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import WebSudoku from '../Views/WebSudoku.js';

// App2 entry point: wires Sudoku model with the WebSudoku view inside PocketOS
export default class App2 extends System {
	constructor() {
		super();
		this.view = null;
		this._canvasEventsDisabled = false;
	}

	setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 2);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}

		// Initialize Web UI for Sudoku
		this.view = new WebSudoku();
		this.view.mount();
	}

	draw() {
		if (!this.view) return;
		const enable = !!this.enabled;
		this.view.setEnabled(enable);

		// Toggle canvas interactivity so events do not leak to p5 when active
		if (enable !== this._canvasEventsDisabled) {
			const canvases = Array.from(document.getElementsByTagName('canvas'));
			for (const c of canvases) {
				c.style.pointerEvents = enable ? 'none' : '';
				c.style.zIndex = enable ? '0' : '';
			}
			this._canvasEventsDisabled = enable;
		}
	}

	cleanup() {
		if (this.view) {
			this.view.cleanup();
			this.view = null;
		}
	}
}
