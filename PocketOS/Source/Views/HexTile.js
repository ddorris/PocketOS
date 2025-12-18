
import Hexagon from './Hexagon.js';
import HexTileArrow from './HexTileArrow.js';
import { DIR_ANGLES, DIR_COLORS } from '../Models/HexTiles.js';

export default class HexTile {
	constructor({ x = 0, y = 0, radius = 30, fill = '#4da3ff', arrowDir = 'up', cornerRadiusRatio = 0 } = {}) {
		this.hex = new Hexagon({ x, y, radius, fill, cornerRadiusRatio });
		this.arrowDir = arrowDir;
		// Apply face color by direction (from model)
		const face = DIR_COLORS[this.arrowDir] || this.hex.fill;
		this.hex.setStyle({ fill: face });
		this.arrow = new HexTileArrow({ stroke: '#ffffff', strokeWeight: Math.max(1, Math.round(radius * 0.1)) });
	}

	setPosition(x, y) {
		this.hex.setPosition(x, y);
	}

	setStyle(style) {
		this.hex.setStyle(style);
	}

	setArrow(dir) {
		if (DIR_ANGLES[dir]) {
			this.arrowDir = dir;
			const face = DIR_COLORS[dir];
			if (face) this.hex.setStyle({ fill: face });
		}
	}

	draw(p) {
		this.hex.draw(p);
		this.arrow.draw(p, { x: this.hex.x, y: this.hex.y, radius: this.hex.radius, angleDeg: DIR_ANGLES[this.arrowDir] ?? 270 });
	}
}
