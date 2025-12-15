import System from '../Systems/System.js';
import AppInfo from '../Views/AppInfo.js';

export default class App2 extends System {
	constructor() {
		super();
	}
	
	setup() {
		const appInfo = this.engine.state.apps.find(app => app.id === 2);
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
