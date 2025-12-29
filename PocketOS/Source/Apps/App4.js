import Button from '../Views/Button.js';
import App from '../Core/App.js';
import AppInfo from '../Views/AppInfo.js';
import HexTilesGameBoard from '../Views/App4/HexTilesGameBoard.js';
import HexTilesModel from '../Models/HexTilesModel.js';

export default class App4 extends App {
	constructor() {
		super();
		this.appDockHeight = 120;
		// Ensure model and board use the same gridRadius from the start
		const initialGridRadius = 5;
		this.model = new HexTilesModel({ gridRadius: initialGridRadius });
		this.isDebug = false; // Set to true for debug overlay
		this.board = new HexTilesGameBoard(this.model, this.isDebug);
	}

	setup() {
		this.board.isDebug = this.isDebug;
		const appInfo = this.engine.state.apps.find(app => app.id === 4);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}

		// Model and board are now constructed in the constructor
		this.resetButton = new Button({
			x: 0, y: 0, width: 60, height: 40,
			label: 'Reset',
			bgColor: '#565758',
			hoverColor: '#6a6a6c',
			onClick: () => { this.model.reset(); }
		});
	}

	draw() {
		if (this.enabled === false) return;
		if (this.board) this.board.draw();
		if (this.resetButton) {
			this.resetButton.x = (width - this.resetButton.width) / 2;
			this.resetButton.y = height - this.resetButton.height - 200;
			this.resetButton.draw();
		}
	}

	mousePressed() {
		if (mouseY < this.appDockHeight) return false;
		if (this.resetButton && this.resetButton.checkClick(mouseX, mouseY)) return true;
		if (this.board && this.board.handleClick(mouseX, mouseY)) return true;
		return false;
	}

	touchStarted() {
		return this.mousePressed();
	}
}
