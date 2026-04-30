// Layout definitions and helpers for stacked Match Tiles boards
export function buildTurtleLayout() {
	// Symmetric turtle-style stack with visible offsets between layers; total 78 slots (divisible by 3)
	const slots = [];
	let idCounter = 0;
	const addRect = (layer, startX, startY, cols, rows) => {
		for (let ry = 0; ry < rows; ry++) {
			for (let rx = 0; rx < cols; rx++) {
				slots.push({ id: `t${idCounter++}`, gx: startX + rx, gy: startY + ry, layer });
			}
		}
	};
	// Base layer (8x4) with top/bottom padding rows
	addRect(0, 0, 0, 8, 4);   // 32
	addRect(0, 2, -1, 4, 1);  // +4 => 36
	addRect(0, 2, 4, 4, 1);   // +4 => 40
	// Layer 1 (offset 0.5, 0.5) 7x3
	addRect(1, 0.5, 0.5, 7, 3);   // +21 => 61
	// Layer 2 (offset 1, 1) 6x2
	addRect(2, 1, 1, 6, 2);       // +12 => 73
	// Layer 3 (offset 2.5, 1.5) 3x1 centered over Layer 2 with half-tile reveal
	addRect(3, 2.5, 1.5, 3, 1);     // +3  => 76
	// Layer 4 (top pair, half-tile horizontal offset to cover Layer 3)
	addRect(4, 3.0, 1.5, 2, 1);   // +2 => 78
	return { name: 'turtle', slots };
}

export function buildMiniLayout() {
	// 15-tile mini: 5 triplets
	const coords = [
		{ gx: 0, gy: 0, layer: 0 }, { gx: 1, gy: 0, layer: 0 }, { gx: 2, gy: 0, layer: 0 },
		{ gx: 0, gy: 1, layer: 0 }, { gx: 1, gy: 1, layer: 0 }, { gx: 2, gy: 1, layer: 0 },
		{ gx: 0, gy: 2, layer: 0 }, { gx: 1, gy: 2, layer: 0 }, { gx: 2, gy: 2, layer: 0 },
		{ gx: 0.5, gy: 0.5, layer: 1 }, { gx: 1.5, gy: 0.5, layer: 1 },
		{ gx: 0.5, gy: 1.5, layer: 1 }, { gx: 1.5, gy: 1.5, layer: 1 },
		{ gx: 1, gy: 1, layer: 2 },
		{ gx: 1, gy: 1, layer: 3 }
	];
	return {
		name: 'mini',
		slots: coords.map((c, i) => ({ id: `m${i}`, ...c }))
	};
}


export function buildDebugLayout() {
	// For debugging we just want to see all of the cards in a simple grid with no overlaps, so we can verify the sprite sheet mapping and hit testing
	const slots = [];
	let idCounter = 0;
	const cols = 9;
	const rows = 10;
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			slots.push({ id: `d${idCounter++}`, gx: x, gy: y, layer: 0 });
		}
	}
	return { name: 'debug', slots };
}