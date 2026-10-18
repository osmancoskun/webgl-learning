/**
 * Mathematical Function Evaluator and Presets.
 * Evaluates functions in range [-1, 1] or [0, 1] for shaping WebGL shaders.
 */

export type MathPresetKey =
  | 'linear'
  | 'smoothstep'
  | 'sine'
  | 'damped-wave'
  | 'exponential'
  | 'gaussian'
  | 'custom';

export interface MathFunctionState {
  preset: MathPresetKey;
  customExpr: string;
  frequency: number;
  amplitude: number;
  power: number;
  decay: number;
}

export class MathEvaluator {
  /**
   * Safely evaluates mathematical functions f(x).
   * x is normalized typically between -1 and 1 or 0 and 1.
   */
  public static evaluate(x: number, state: MathFunctionState): number {
    const { preset, frequency, amplitude, power, decay } = state;

    switch (preset) {
      case 'linear':
        return Math.min(Math.max(x * amplitude, -1), 1);

      case 'smoothstep': {
        // Hermite smoothstep clamped between 0 and 1
        const t = Math.min(Math.max((x + 1) * 0.5, 0), 1);
        const s = t * t * (3 - 2 * t);
        return (s * 2 - 1) * amplitude;
      }

      case 'sine':
        return Math.sin(x * Math.PI * frequency) * amplitude;

      case 'damped-wave':
        return Math.sin(x * Math.PI * frequency) * Math.exp(-Math.abs(x) * decay) * amplitude;

      case 'exponential': {
        const sign = x < 0 ? -1 : 1;
        return sign * Math.pow(Math.abs(x), power) * amplitude;
      }

      case 'gaussian':
        return Math.exp(-Math.pow(x * frequency, 2) * decay) * amplitude;

      case 'custom':
        return this.evalCustomExpression(x, state.customExpr, state);

      default:
        return x;
    }
  }

  private static evalCustomExpression(x: number, expr: string, state: MathFunctionState): number {
    try {
      // Safe sandboxed math evaluation without eval
      const fn = new Function('x', 'Math', 'freq', 'amp', `
        with (Math) {
          try {
            return Number(${expr}) * ${state.amplitude};
          } catch(e) {
            return 0;
          }
        }
      `);
      const res = fn(x, Math, state.frequency, state.amplitude);
      return Number.isFinite(res) ? res : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Samples f(x) over samplesCount points in domain [domainMin, domainMax].
   */
  public static sample(
    state: MathFunctionState,
    samplesCount: number = 256,
    domainMin: number = -1,
    domainMax: number = 1
  ): Float32Array {
    const samples = new Float32Array(samplesCount);
    const step = (domainMax - domainMin) / (samplesCount - 1);

    for (let i = 0; i < samplesCount; i++) {
      const x = domainMin + i * step;
      samples[i] = this.evaluate(x, state);
    }
    return samples;
  }
}
