import Button from '../Views/Button.js';
import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import HexTilesGameBoard from '../Views/HexTilesGameBoard.js';
import HexTilesModel from '../Models/HexTiles.js';

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

		this.model = new HexTilesModel();
		this.board = new HexTilesGameBoard(this.model);
		this.resetButton = new Button({
			x: 0, y: 0, width: 60, height: 40,
			label: 'Reset',
			bgColor: '#565758',
			hoverColor: '#6a6a6c',
			onClick: () => {
				this.model.reset();
				this.board.buildBoard();
			}
		});
	}

	draw() {
		if (this.enabled === false) return;

		// Fit or refit when inputs change (canvas, grid radius, padding)
		if (this.board && typeof width !== 'undefined') {
			const marginX = 40; // padding around the board
			const marginY = -80; // padding from top (to center better with dock and controls)
			const playableWidth = width - marginX * 2;
			const playableHeight = height - this.appDockHeight;
			const G = this.board.gridRadius;
			const paddingRatio = this.board.paddingRatio;

			// Let's draw one big hexagon behind the board for fun
			const bgColor = '#333';
			const bgRadius = 0.9 * this.board.radius * (1 + paddingRatio) * (3 * G + 2) / Math.sqrt(3);
			const bgX = width / 2;
			const bgY = marginY + (this.appDockHeight + playableHeight / 2);
			// draw a upward pointing hex centered behind the board, there is no hexagon function so use polygon
			strokeWeight(50);
			strokeJoin(ROUND);
			stroke(bgColor);
			fill(bgColor);
			beginShape();
			for (let i = 0; i < 6; i++) {
				// remember this is not the flat top hexagon, so start at 30 degrees
				const angle = PI / 3 * i + PI / 6;
				const x = bgX + bgRadius * cos(angle);
				const y = bgY + bgRadius * sin(angle);
				vertex(x, y);
			}
			endShape(CLOSE);

			// Create a cache key to avoid redundant calculations
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
				const originY = marginY + (this.appDockHeight + playableHeight / 2);
				this.board.setLayout({ originX, originY, radius });
				this._fitCache = key;
				this.boardReady = true;
			}
		}

		if (this.board) {
			this.board.draw();
		}

		if (this.resetButton) {
			this.resetButton.x = (width - this.resetButton.width) / 2;
			this.resetButton.y = height - this.resetButton.height - 160;
			this.resetButton.draw();
		}
	}

	mousePressed() {
		if (mouseY < this.appDockHeight) return false;
		if (this.resetButton && this.resetButton.checkClick(mouseX, mouseY)) return true;
		// Board tile click
		if (this.board && this.board.handleClick(mouseX, mouseY)) return true;
		return false;
	}

	touchStarted() {
		return this.mousePressed();
	}
}
