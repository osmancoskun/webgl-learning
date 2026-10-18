import { Pane } from 'tweakpane';
import { EffectManager } from '../framework/manager';
import { CartesianGraph } from '../math/cartesian';
import { MathPresetKey } from '../math/evaluator';

/**
 * Main UI Dashboard: integrates Tweakpane, effect selection, and the interactive Cartesian Math Graph.
 */

export class AppUi {
  public readonly pane: Pane;
  private readonly manager: EffectManager;
  private readonly cartesianGraph: CartesianGraph;

  constructor(manager: EffectManager) {
    this.manager = manager;

    this.pane = new Pane({
      title: 'WebGL2 Learning Lab',
      expanded: true
    });

    // Effect Switcher
    const effects = manager.getEffects();
    const options: Record<string, string> = {};
    for (const eff of effects) {
      options[eff.title] = eff.id;
    }

    const state = {
      selectedEffect: effects[0]?.id ?? ''
    };

    const generalFolder = this.pane.addFolder({ title: 'Scene & Preset' });
    generalFolder.addBinding(state, 'selectedEffect', {
      options,
      label: 'Effect'
    }).on('change', (ev) => {
      manager.switchEffect(ev.value);
    });

    // Cartesian Math Shaping Plane Folder
    const mathFolder = this.pane.addFolder({
      title: 'Cartesian Math Shaping (f(x) -> LUT)',
      expanded: true
    });

    // Container for Cartesian Graph canvas
    const graphContainer = document.createElement('div');
    graphContainer.style.display = 'flex';
    graphContainer.style.flexDirection = 'column';
    graphContainer.style.alignItems = 'center';
    mathFolder.element.appendChild(graphContainer);

    this.cartesianGraph = new CartesianGraph(graphContainer, 250, 160);
    this.cartesianGraph.draw(manager.mathState);

    const presetOptions: Record<string, MathPresetKey> = {
      'Linear f(x)=x': 'linear',
      'Smoothstep': 'smoothstep',
      'Sine Wave': 'sine',
      'Damped Wave': 'damped-wave',
      'Exponential (pow)': 'exponential',
      'Gaussian Bell': 'gaussian',
      'Custom Expression': 'custom'
    };

    mathFolder.addBinding(manager.mathState, 'preset', {
      options: presetOptions,
      label: 'Function'
    }).on('change', () => {
      this.updateMath();
    });

    mathFolder.addBinding(manager.mathState, 'frequency', {
      min: 0.1,
      max: 10.0,
      step: 0.1,
      label: 'Frequency'
    }).on('change', () => this.updateMath());

    mathFolder.addBinding(manager.mathState, 'amplitude', {
      min: 0.1,
      max: 2.0,
      step: 0.05,
      label: 'Amplitude'
    }).on('change', () => this.updateMath());

    mathFolder.addBinding(manager.mathState, 'decay', {
      min: 0.1,
      max: 5.0,
      step: 0.1,
      label: 'Damping'
    }).on('change', () => this.updateMath());

    mathFolder.addBinding(manager.mathState, 'customExpr', {
      label: 'Formula'
    }).on('change', () => this.updateMath());
  }

  private updateMath(): void {
    this.cartesianGraph.draw(this.manager.mathState);
    this.manager.mathLut.update(this.manager.mathState);
  }
}
