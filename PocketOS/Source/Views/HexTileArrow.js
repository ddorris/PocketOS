export default class HexTileArrow {
  constructor({ stroke = '#ffffff', strokeWeight = 3 } = {}) {
    this.stroke = stroke;
    this.strokeWeight = strokeWeight;
  }

  setStyle({ stroke, strokeWeight }) {
    if (stroke !== undefined) this.stroke = stroke;
    if (strokeWeight !== undefined) this.strokeWeight = strokeWeight;
  }

  // Draw an arrow composed of 3 lines, oriented by angleDeg around (x, y)
  // Geometry is defined for an "up" arrow then rotated.
  draw(p, { x, y, radius, angleDeg = 270 }) {
    const ctx = p || window;
    const angle = (Math.PI / 180) * angleDeg;

    // Centered arrow geometry: spans from tail to tip with better balance
    const tipY = radius * 0.3;      // tip extends toward edge
    const tailY = radius * -0.3;    // tail extends back (centered)
    const headOffset = radius * 0.25; // longer arrowhead spread

    const rotatePoint = (px, py) => {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      return {
        x: x + px * cosA - py * sinA,
        y: y + px * sinA + py * cosA,
      };
    };

    const tip = rotatePoint(0, tipY);
    const tail = rotatePoint(0, tailY);
    const leftHead = rotatePoint(-headOffset, tipY - headOffset);
    const rightHead = rotatePoint(headOffset, tipY - headOffset);

    ctx.push();
    ctx.stroke(this.stroke);
    ctx.strokeWeight(this.strokeWeight);
    if (ctx.strokeCap) ctx.strokeCap(ctx.ROUND);

    // stem
    ctx.line(tip.x, tip.y, tail.x, tail.y);
    // arrow head
    ctx.line(tip.x, tip.y, leftHead.x, leftHead.y);
    ctx.line(tip.x, tip.y, rightHead.x, rightHead.y);

    ctx.pop();
  }
}
