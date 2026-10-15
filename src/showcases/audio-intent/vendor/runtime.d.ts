interface QueuePlayer {
  isPlaying: { value: boolean };
  isSynthesizing: { value: boolean };
  queueOrderedChunk(url: string, format: string, index: number, final?: boolean): void;
  setSynthesizing(value: boolean): void;
  stop(): void;
  destroy(): void;
}
interface ObservedHowl {
  on(event: 'loaderror' | 'playerror' | 'play' | 'end', callback: () => void): this;
  off(event: 'loaderror' | 'playerror' | 'play' | 'end', callback: () => void): this;
}
export function armAudio(): void;
export function isAudioArmed(): boolean;
export function useWebAudioPlayer(options?: { onFirstPlay?: () => void }): QueuePlayer;
export const Howler: { noAudio: boolean; _howls?: ObservedHowl[] };
