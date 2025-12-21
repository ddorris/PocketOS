import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';
import SolitaireModel from '../Models/SolitaireModel.js';

export default class App1 extends System {
	constructor() {
		super();
		this.model = new SolitaireModel();
	}

	setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 1);
		if (appInfo && appInfo.icon) {
			const icon = loadImage(appInfo.icon);
			this.appInfo = new AppInfo({ info: appInfo, icon });
		}
	}

	draw() {
		if (this.enabled === false) return;
		if (this.appInfo) {
			this.appInfo.display(width / 2, height / 2 - 60);
		}
	}
}
