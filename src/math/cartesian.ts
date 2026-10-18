import { MathEvaluator, MathFunctionState } from './evaluator';

/**
 * Interactive 2D Canvas Cartesian Plane Graph.
 * Visualizes +X, -X, +Y, -Y axes, grid lines, and real-time f(x) curve shape.
 */

export class CartesianGraph {
  public readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(container: HTMLElement, width: number = 280, height: number = 180) {
    this.width = width;
    this.height = height;

    this.canvas = document.createElement('canvas');
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.canvas.style.borderRadius = '6px';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '8px 0';
    this.canvas.style.background = '#090b0e';
    this.canvas.style.border = '1px solid rgba(255, 255, 255, 0.1)';

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context for Cartesian Graph');
    this.ctx = ctx;

    container.appendChild(this.canvas);
  }

  public draw(state: MathFunctionState): void {
    const dpr = window.devicePixelRatio || 1;
    const ctx = this.ctx;
    const w = this.width * dpr;
    const h = this.height * dpr;

    ctx.clearRect(0, 0, w, h);

    const originX = w * 0.5;
    const originY = h * 0.5;
    const scaleX = (w * 0.45); // -1 to 1 fits within 90% width
    const scaleY = (h * 0.4);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    // Minor vertical grid at -0.5 and +0.5
    ctx.moveTo(originX - scaleX * 0.5, 0);
    ctx.lineTo(originX - scaleX * 0.5, h);
    ctx.moveTo(originX + scaleX * 0.5, 0);
    ctx.lineTo(originX + scaleX * 0.5, h);
    // Minor horizontal grid at -0.5 and +0.5
    ctx.moveTo(0, originY - scaleY * 0.5);
    ctx.lineTo(w, originY - scaleY * 0.5);
    ctx.moveTo(0, originY + scaleY * 0.5);
    ctx.lineTo(w, originY + scaleY * 0.5);
    ctx.stroke();

    // Primary Axes (+X, -X, +Y, -Y)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    // X Axis
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    // Y Axis
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, h);
    ctx.stroke();

    // Labels: +X, -X, +Y, -Y
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = `${9 * dpr}px monospace`;
    ctx.fillText('+X', w - 16 * dpr, originY - 4 * dpr);
    ctx.fillText('-X', 4 * dpr, originY - 4 * dpr);
    ctx.fillText('+Y', originX + 4 * dpr, 12 * dpr);
    ctx.fillText('-Y', originX + 4 * dpr, h - 4 * dpr);

    // Plot Curve f(x)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();

    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const normX = (i / steps) * 2 - 1; // [-1, 1]
      const valY = MathEvaluator.evaluate(normX, state);

      const px = originX + normX * scaleX;
      // Invert Y coordinate for standard Cartesian display (+Y goes up)
      const py = originY - valY * scaleY;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  public destroy(): void {
    this.canvas.remove();
  }
}
