export default class Hexagon {
	constructor({ x = 0, y = 0, radius = 30, fill = '#4da3ff', cornerRadiusRatio = 0 } = {}) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		this.fill = fill;
		this.cornerRadiusRatio = cornerRadiusRatio;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
	}

	setStyle({ fill }) {
		if (fill !== undefined) this.fill = fill;
	}

	getVertices() {
		// Canonical flat-top hexagon: top/bottom edges horizontal
		// Vertices at 0°, 60°, 120°, 180°, 240°, 300°
		const verts = [];
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 180) * (0 + 60 * i);
			verts.push({
				x: this.x + this.radius * Math.cos(angle),
				y: this.y + this.radius * Math.sin(angle),
			});
		}
		return verts;
	}

	getRoundedPathPoints(segmentsPerCorner = 6) {
		// Properly round corners by blending arcs at each vertex, not looping around the outside
		const verts = this.getVertices();
		const r = Math.max(0, Math.min(0.49, this.cornerRadiusRatio)) * this.radius;
		if (r <= 0) return verts;
		const points = [];
		for (let i = 0; i < 6; i++) {
			const curr = verts[i];
			const prev = verts[(i + 5) % 6];
			const next = verts[(i + 1) % 6];

			// Find the two edge directions (from curr to prev/next)
			const toPrev = { x: prev.x - curr.x, y: prev.y - curr.y };
			const toNext = { x: next.x - curr.x, y: next.y - curr.y };
			const lenPrev = Math.hypot(toPrev.x, toPrev.y);
			const lenNext = Math.hypot(toNext.x, toNext.y);
			// Clamp r so it doesn't exceed half the edge length
			const rEff = Math.max(0, Math.min(r, lenPrev * 0.5 - 0.01, lenNext * 0.5 - 0.01));
			// Start and end points of the arc on each edge (move out from curr toward prev/next)
			const start = {
				x: curr.x + toPrev.x / lenPrev * rEff,
				y: curr.y + toPrev.y / lenPrev * rEff
			};
			const end = {
				x: curr.x + toNext.x / lenNext * rEff,
				y: curr.y + toNext.y / lenNext * rEff
			};
			// Arc center: intersection of two offset lines (bisector)
			// For a regular polygon, this is the vertex offset inward by rEff / tan(π/6)
			const anglePrev = Math.atan2(toPrev.y, toPrev.x);
			const angleNext = Math.atan2(toNext.y, toNext.x);
			// Compute the inward bisector direction
			let bisectAngle = anglePrev + ((angleNext - anglePrev + Math.PI * 3) % (Math.PI * 2) - Math.PI) / 2;
			const bisectLen = rEff / Math.tan(Math.PI / 6);
			const center = {
				x: curr.x + Math.cos(bisectAngle) * bisectLen,
				y: curr.y + Math.sin(bisectAngle) * bisectLen
			};
			// Angles for arc
			let a1 = Math.atan2(start.y - center.y, start.x - center.x);
			let a2 = Math.atan2(end.y - center.y, end.x - center.x);
			// Always sweep the EXTERIOR arc (positive, ~+120°) for correct winding
			let delta = a2 - a1;
			if (delta < 0) delta += Math.PI * 2;
			// Add the arc points
			for (let s = 0; s <= segmentsPerCorner; s++) {
				const t = s / segmentsPerCorner;
				const ang = a1 + delta * t;
				points.push({ x: center.x + rEff * Math.cos(ang), y: center.y + rEff * Math.sin(ang) });
			}
		}
		return points;
	}

	draw(p) {
		const ctx = p || window;
		ctx.push();
		ctx.fill(this.fill);
		ctx.noStroke();
		ctx.beginShape();
		const pts = this.cornerRadiusRatio > 0 ? this.getRoundedPathPoints(6) : this.getVertices();
		pts.forEach(v => ctx.vertex(v.x, v.y));
		ctx.endShape(ctx.CLOSE);
		ctx.pop();
	}
}
