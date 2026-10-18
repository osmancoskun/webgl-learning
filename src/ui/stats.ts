/**
 * Performance Monitor with rolling FPS and Frame-time (ms) tracking.
 */

export class PerformanceStats {
  private readonly fpsEl: HTMLElement | null;
  private readonly timeEl: HTMLElement | null;
  private readonly resEl: HTMLElement | null;

  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private frameTimeMs: number = 16.6;

  constructor() {
    this.fpsEl = document.getElementById('stat-fps');
    this.timeEl = document.getElementById('stat-time');
    this.resEl = document.getElementById('stat-res');
  }

  public update(width: number, height: number, dpr: number): void {
    const now = performance.now();
    this.frameCount++;

    const delta = now - this.lastTime;
    if (delta >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / delta);
      this.frameTimeMs = parseFloat((delta / this.frameCount).toFixed(2));
      this.frameCount = 0;
      this.lastTime = now;

      if (this.fpsEl) this.fpsEl.textContent = `${this.fps}`;
      if (this.timeEl) this.timeEl.textContent = `${this.frameTimeMs} ms`;
      if (this.resEl) this.resEl.textContent = `${width}x${height} (${dpr}x DPR)`;
    }
  }

  public getFps(): number {
    return this.fps;
  }

  public getFrameTime(): number {
    return this.frameTimeMs;
  }
}
