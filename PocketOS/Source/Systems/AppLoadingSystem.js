import System from '../Core/System.js';

export default class AppLoadingSystem extends System {
	async setup() {
		try {
			const apps = await this.load('./PocketOS/Source/Data/InstalledApps.json');
			this.engine.state.apps = apps;
			// Load and register all apps sequentially
			for (const app of apps) {
				const module = await import(`../../${app.entry}`);
				const entryPoint = new module.default();
				entryPoint.enabled = false;
				this.engine.apps.push(entryPoint);
				this.engine.register(entryPoint);
			}
		} catch (error) {
			console.error('Failed to load apps:', error);
		}
	}

	async load(url) {
		try {
			const response = await fetch(url);
			return await response.json();
		} catch (error) {
			throw error;
		}
	}
}