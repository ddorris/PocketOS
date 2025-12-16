import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import DinoDock from '../Views/DinoDock.js';
import DinoBoard from '../Views/DinoBoard.js';
import Button from '../Views/Button.js';
import SpriteSheetSystem from '../Systems/SpriteSheetSystem.js';
import DinoTiles from '../Models/DinoTiles.js';

export default class App3 extends System {
	constructor() {
		super();
		this.model = new DinoTiles();
		this.dinoBoard = null;
		this.dinoDock = new DinoDock();
		this.resetButton = null;
		this.isDebug = false;
		this.appDockHeight = 120;
		this.setResetButtonBounds = () => {
			if (!this.resetButton) return;
			const btnWidth = this.resetButton.width;
			const btnHeight = this.resetButton.height;
			const x = (typeof width !== 'undefined' ? width : 0) - 80;
			const y = this.dinoDock.dockY + (this.dinoDock.dockHeight - btnHeight) / 2;
			this.resetButton.setBounds(x, y, btnWidth, btnHeight);
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

		// Initialize DinoDock
		this.dinoDock.setSpriteSheetSystem(spriteSheetSystem);
		const sheetMeta = this.engine.state.spriteSheets?.['dinotiles'];
		if (sheetMeta) {
			this.dinoDock.slotWidth = sheetMeta.dw;
			this.dinoDock.slotHeight = sheetMeta.dh;
			this.dinoDock.tileSpacing = sheetMeta.dw + 1;
		}

		// Initialize DinoBoard
		this.dinoBoard = new DinoBoard(this.model, spriteSheetSystem, 'dinotiles');
		this.dinoBoard.spriteSheetSystem = spriteSheetSystem; // Inject for access to engine/state
		this.dinoBoard.isDebug = this.isDebug;

		// Create reset button once
		this.resetButton = new Button({
			id: 'reset',
			label: 'Reset',
			x: 0,
			y: 0,
			width: 60,
			height: 40,
			bgColor: '#efd0a4',
			hoverColor: '#f5dcb7',
			textColor: '#866035',
			strokeColor: '#866035',
			onClick: () => {
				this.dinoDock.reset();
				this.dinoBoard?.initialize();
				this.dinoDock.updateLayout(typeof width !== 'undefined' ? width : 0, typeof height !== 'undefined' ? height : 0);
				this.setResetButtonBounds();
			}
		});

		// Reset/setup game state
		this.resetButton?.onClick();
	}

	draw() {
		if (this.enabled === false) return;

		// Background
		noStroke();
		fill(0xEF, 0xD0, 0xA4);
		rect(0, this.appDockHeight, width, height - this.appDockHeight);

		// Render game elements
		this.dinoBoard?.draw();
		this.dinoDock.draw(this.dinoBoard?.spriteSheetSystem);
		this.dinoDock.updateGameState(this.model.isGameWon());
		this.resetButton?.draw();
	}

	windowResized() {
		this.dinoDock.updateLayout(typeof width !== 'undefined' ? width : 0, typeof height !== 'undefined' ? height : 0);
		this.setResetButtonBounds();
	}

	mousePressed() {
		if (mouseY < this.appDockHeight) return false;

		// Check reset button
		if (this.resetButton && this.resetButton.checkClick(mouseX, mouseY)) return true;

		// Don't allow tile clicks if game is over
		if (this.dinoDock.isGameOver()) return false;

		// Find tile at pixel
		const candidate = this.dinoBoard?.findTopmostTileAtPixel(mouseX, mouseY);
		if (candidate && this.model.isSelectable(candidate)) {
			// Add to dock
			const dockTile = { 
				sheetKey: 'dinotiles', 
				tileIndex: candidate.tileIndex 
			};
			if (this.dinoDock.addTile(dockTile)) {
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
