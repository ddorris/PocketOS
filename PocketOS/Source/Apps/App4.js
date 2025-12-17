import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import HexTilesGameBoard from '../Views/HexTilesGameBoard.js';

export default class App4 extends System {
	constructor() {
		super();
		this.appDockHeight = 120;
		this.board = null;
		this._fitCache = null;
	}
	
	setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 4);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}

		this.board = new HexTilesGameBoard();
	}
	
	draw() {
		if (this.enabled === false) return;
		
		// Fit or refit when inputs change (canvas, grid radius, padding)
		if (this.board && typeof width !== 'undefined') {
			const margin = 40; // padding around the board
			const playableWidth = width - margin * 2;
			const playableHeight = height - this.appDockHeight - margin * 2;
			const G = this.board.gridRadius;
			const paddingRatio = this.board.paddingRatio;
			const key = `${playableWidth}x${playableHeight}|G${G}|k${paddingRatio.toFixed(4)}|rounded:${this.board.useRounded ? 1 : 0}`;
			if (!this._fitCache || this._fitCache !== key) {
				const sqrt3 = Math.sqrt(3);
				const spacingMultiplier = 1 + paddingRatio;
				// If rounded hexes are enabled, we render without strokes
				const strokeRatio = this.board.useRounded ? 0 : (paddingRatio * 0.25); // matches board stroke scaling
				const widthCoeff = 3 * G * spacingMultiplier + 2 + strokeRatio;
				const heightCoeff = sqrt3 * (2 * G * spacingMultiplier + 1) + strokeRatio;
				const maxRadiusForWidth = playableWidth / widthCoeff;
				const maxRadiusForHeight = playableHeight / heightCoeff;
				const radius = Math.max(1, Math.min(maxRadiusForWidth, maxRadiusForHeight));
				const originX = width / 2;
				const originY = this.appDockHeight + margin + playableHeight / 2;
				this.board.setLayout({ originX, originY, radius });
				this._fitCache = key;
				this.boardReady = true;
			}
		}

		if (this.board) {
			this.board.draw();
		}
	}
}
