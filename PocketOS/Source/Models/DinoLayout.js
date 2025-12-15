// Layout definitions and helpers for stacked Dino Tiles boards
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

	// Layer 3 (offset 2.0, 1.0) 3x1 centered over Layer 2
	addRect(3, 2.0, 1.0, 3, 1);     // +3  => 76

	// Layer 4 (top pair with center gap over Layer 3): positions at 2.0 and 4.0, centered on Layer 3 y
	slots.push({ id: `t${idCounter++}`, gx: 2.5, gy: 1.5, layer: 4 });
	slots.push({ id: `t${idCounter++}`, gx: 4.5, gy: 1.5, layer: 4 });   // +2  => 78

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
