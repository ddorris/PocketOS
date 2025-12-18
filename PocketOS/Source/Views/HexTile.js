import Hexagon from './Hexagon.js';
import HexTileArrow from './HexTileArrow.js';
import { HEX_DIRECTIONS } from '../Models/HexTiles.js';

export default class HexTile {
	constructor({ x = 0, y = 0, radius = 30, fill = '#4da3ff', arrowDir = 'up', cornerRadiusRatio = 0 } = {}) {
		this.hex = new Hexagon({ x, y, radius, fill, cornerRadiusRatio });
		this.arrowDir = arrowDir;
		// Lookup color from HEX_DIRECTIONS
		const dirObj = HEX_DIRECTIONS.find(d => d.name === this.arrowDir);
		const face = dirObj ? dirObj.color : this.hex.fill;
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
		const dirObj = HEX_DIRECTIONS.find(d => d.name === dir);
		if (dirObj) {
			this.arrowDir = dir;
			this.hex.setStyle({ fill: dirObj.color });
		}
	}

	draw() {
		this.hex.draw();
		const dirObj = HEX_DIRECTIONS.find(d => d.name === this.arrowDir);
		const angle = dirObj ? dirObj.angle : 270;
		this.arrow.draw({ x: this.hex.x, y: this.hex.y, radius: this.hex.radius, angleDeg: angle });
	}
}
