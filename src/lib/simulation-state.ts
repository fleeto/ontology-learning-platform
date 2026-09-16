/** A run is bound to one parameter snapshot; approvals belong to one stage. */
export interface SimulationState {
  step: number;
  playing: boolean;
  started: boolean;
  approved: boolean;
}
export const initialSimulationState: SimulationState = {
  step: 0, playing: false, started: false, approved: false,
};
export type SimulationEvent =
  | { type: 'reset' }
  | { type: 'pause' }
  | { type: 'approve'; requiresApproval: boolean }
  | { type: 'play' | 'next'; requiresApproval: boolean; lastStep: number };
export function simulationReducer(state: SimulationState, event: SimulationEvent): SimulationState {
  if (event.type === 'reset') return { ...initialSimulationState };
  if (event.type === 'pause') return { ...state, playing: false };
  if (event.type === 'approve') return event.requiresApproval
    ? { ...state, approved: true, started: true } : state;
  if ((event.requiresApproval && !state.approved) || state.step >= event.lastStep) return state;
  if (event.type === 'play') return { ...state, playing: !state.playing, started: true };
  return { ...state, step: state.step + 1, approved: false, started: true };
}
