import App from '../Core/App.js';
import AppInfo from '../Views/AppInfo.js';
import MatchTilesDock from '../Views/App3/MatchTilesDock.js';
import MatchTilesBoard from '../Views/App3/MatchTilesBoard.js';
import Button from '../Views/Button.js';
import SpriteSheetSystem from '../Systems/SpriteSheetSystem.js';
import MatchTilesModel from '../Models/MatchTilesModel.js';

export default class App3 extends App {
	constructor() {
		super();
		this.model = new MatchTilesModel();
		this.matchTilesBoard = null;
		this.matchTilesDock = new MatchTilesDock();
		this.resetButton = null;
		this.themeButton = null;
		this.isDebug = false;
		this.appDockHeight = 120;
		this.setResetButtonBounds = () => {
			if (!this.resetButton) return;
			const btnWidth = this.resetButton.width;
			const btnHeight = this.resetButton.height;
			const x = (typeof width !== 'undefined' ? width : 0) - 80;
			const y = this.matchTilesDock.dockY + (this.matchTilesDock.dockHeight - btnHeight) / 2;
			this.resetButton.setBounds(x, y, btnWidth, btnHeight);
		};
		this.setThemeButtonBounds = () => {
			if (!this.themeButton) return;
			const btnWidth = this.themeButton.width;
			const btnHeight = this.themeButton.height;
			const x = (typeof width !== 'undefined' ? width : 0) - 80;
			const y = this.matchTilesDock.dockY + (this.matchTilesDock.dockHeight - btnHeight) / 2 - 80;
			this.themeButton.setBounds(x, y, btnWidth, btnHeight);
		};
	}

	async setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 3);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}

		const spriteSheetSystem = this.engine.systems.find(s => s instanceof SpriteSheetSystem);
		if (!spriteSheetSystem) return;

		// Initialize MatchTilesDock
		this.matchTilesDock.setSpriteSheetSystem(spriteSheetSystem);
		const sheetMeta = this.engine.state.spriteSheets?.['mahjong'];
		if (sheetMeta) {
			this.matchTilesDock.slotWidth = sheetMeta.dw;
			this.matchTilesDock.slotHeight = sheetMeta.dh;
			this.matchTilesDock.tileSpacing = sheetMeta.dw + 1;
		}

		// Initialize MatchTilesBoard
		this.matchTilesBoard = new MatchTilesBoard(this.model, spriteSheetSystem, 'mahjong');
		this.matchTilesBoard.spriteSheetSystem = spriteSheetSystem; // Inject for access to engine/state
		this.matchTilesBoard.isDebug = this.isDebug;

		// Create reset button once
		this.resetButton = new Button({
			id: 'reset',
			label: 'Reset',
			x: 0,
			y: 0,
			width: 60,
			height: 40,
			bgColor: '#565758',
			hoverColor: '#6a6a6c',
			textColor: '#ffffff',
			strokeColor: '#6a6a6c',
			onClick: () => {
				this.matchTilesDock.reset();
				this.matchTilesBoard?.initialize();
				this.matchTilesDock.updateLayout(typeof width !== 'undefined' ? width : 0, typeof height !== 'undefined' ? height : 0);
				this.setResetButtonBounds();
			}
		});

		// Reset/setup game state
		this.resetButton?.onClick();

		// Create theme button once
		this.themeButton = new Button({
			id: 'theme',
			label: 'Theme',
			x: 0,
			y: 0,
			width: 60,
			height: 40,
			bgColor: '#565758',
			hoverColor: '#6a6a6c',
			textColor: '#ffffff',
			strokeColor: '#6a6a6c',
			onClick: () => {
				this.matchTilesBoard?.changeTheme();
				this.setThemeButtonBounds();
				this.resetButton?.onClick();
			}
		});

		this.setResetButtonBounds();
		this.setThemeButtonBounds();
	}

	draw() {
		if (this.enabled === false) return;

		// Background
		noStroke();
		fill("#000000");
		rect(0, this.appDockHeight, width, height - this.appDockHeight);

		// Render game elements
		this.matchTilesBoard?.draw();
		this.matchTilesDock.draw(this.matchTilesBoard?.spriteSheetSystem);
		this.matchTilesDock.updateGameState(this.model.isGameWon());
		this.resetButton?.draw();
		this.themeButton?.draw();
	}

	windowResized() {
		this.matchTilesDock.updateLayout(typeof width !== 'undefined' ? width : 0, typeof height !== 'undefined' ? height : 0);
		this.setResetButtonBounds();
		this.setThemeButtonBounds();
	}

	mousePressed() {
		if (mouseY < this.appDockHeight) return false;

		// Check reset button and theme button clicks
		if (this.resetButton && this.resetButton.checkClick(mouseX, mouseY)) return true;
		if (this.themeButton && this.themeButton.checkClick(mouseX, mouseY)) return true;

		// Don't allow tile clicks if game is over
		if (this.matchTilesDock.isGameOver()) return false;

		// Find tile at pixel
		const candidate = this.matchTilesBoard?.findTopmostTileAtPixel(mouseX, mouseY);
		if (candidate && this.model.isSelectable(candidate)) {
			// Add to dock
			const dockTile = {
				sheetKey: this.matchTilesBoard.sheetKey,
				tileIndex: candidate.tileIndex
			};
			if (this.matchTilesDock.addTile(dockTile)) {
				this.model.selectTile(candidate);
			}
			return true;
		}
		return false;
	}

	touchStarted() {
		return this.mousePressed();
	}
}
