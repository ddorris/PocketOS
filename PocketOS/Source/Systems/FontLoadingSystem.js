import System from '../Core/System.js';

export default class FontLoadingSystem extends System {
	async preload() {
		const apps = this.engine.state.apps || [];
		this.engine.state.fonts = {}; // Store loaded font objects keyed by name
		
		for (const app of apps) {
			const fonts = app.bundle?.fonts || [];
			for (const fontDef of fonts) {
				const font = loadFont(fontDef.url);
				this.engine.state.fonts[fontDef.name] = font;
			}
		}
	}
}
