import System from '../Systems/System.js';

export default class Engine extends System {
	state = {};
	systems = [];
	apps = [];

	constructor() {
		super();
		// Expose System methods globally for event handling
		Object.getOwnPropertyNames(System.prototype).forEach(m => window[m] = (...args) => this[m](...args) );
		// Setup is special: it's async and must await all system initialization
		window.setup = async () => { await this.setup(); };
	}

	register(system) {
		system.engine = this;
		this.systems.push(system);
		return this;
	}

	unregister(system) {
		system.engine = null;
		const index = this.systems.indexOf(system);
		if (index > -1) this.systems.splice(index, 1);
		return this;
	}

	async setup() {
		// Sequentially await each system's setup to ensure proper initialization order
		for (const s of this.systems) {
			if (s.setup) await s.setup();
		}
	}

	draw() { this.systems.forEach(s => s.draw && s.draw()); }
	windowResized() { this.systems.forEach(s => s.windowResized && s.windowResized()); }
	mousePressed() { return this.systems.some(s => s.enabled && s.mousePressed() === true); }
	mouseReleased() { return this.systems.some(s => s.enabled && s.mouseReleased() === true); }
	mouseDragged() { return this.systems.some(s => s.enabled && s.mouseDragged() === true); }
	touchStarted(event) { return this.systems.some(s => s.enabled && s.touchStarted(event) === true); }
	touchMoved(event) { return this.systems.some(s => s.enabled && s.touchMoved(event) === true); }
	touchEnded(event) { return this.systems.some(s => s.enabled && s.touchEnded(event) === true); }
	mouseWheel(event) { return this.systems.some(s => s.enabled && s.mouseWheel(event) === true); }
}
