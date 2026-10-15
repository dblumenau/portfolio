import { createElement as h, useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { iconPaths, type IconName } from '../../ui/icons';
import { Waveform } from './vendor/components/Waveform.js';
import { TimedView, findActiveIndex } from './vendor/components/views.js';
import fixture from './fixture.json';

type Mode = 'karaoke' | 'guide' | 'subtitle';
const words = fixture.aligned;
const duration = fixture.chapter.audio_seconds;
const format = (seconds: number) => `${seconds.toFixed(2)}s`;
const modes: { value: Mode; label: string }[] = [{ value: 'karaoke', label: 'Follow the word' }, { value: 'guide', label: 'Reading guide' }, { value: 'subtitle', label: 'Plain subtitles' }];
function Icon({ name }: { name: IconName }) {
  return h('svg', { className: 'ui-icon', viewBox: '0 0 24 24', width: '1em', height: '1em', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false }, ...iconPaths[name].map((d, index) => h('path', { key: index, d })));
}
function sentenceAt(t: number) {
  const index = findActiveIndex(words, t);
  let first = index, last = index;
  while (first > 0 && !/[.?!]$/.test(words[first - 1].word)) first--;
  while (last < words.length - 1 && !/[.?!]$/.test(words[last].word)) last++;
  return { start: words[first].start, end: words[last].end };
}

export function ListeningPlayer() {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [mode, setMode] = useState<Mode>('karaoke');
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const connectAudio = useCallback((element: HTMLAudioElement | null) => { setAudio(element); }, []);
  useEffect(() => {
    if (!audio) return;
    const onTime = () => setTime(audio.currentTime);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onPause);
    return () => { audio.pause(); audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('play', onPlay); audio.removeEventListener('pause', onPause); audio.removeEventListener('ended', onPause); };
  }, [audio]);
  useEffect(() => { if (audio) audio.playbackRate = speed; }, [audio, speed]);
  const play = () => { if (!audio) return; setError(''); void audio.play().catch(() => setError('Playback could not start. Try Play again.')); };
  const toggle = () => { if (!audio) return; if (audio.paused) play(); else audio.pause(); };
  const seek = (value: number) => { if (audio) audio.currentTime = Math.max(0, Math.min(audio.duration || duration, value)); };
  const skipSentence = (direction: 1 | -1) => {
    if (!audio) return;
    const boundaries = [0, ...words.flatMap((word, index) => /[.?!]$/.test(word.word) && words[index + 1] ? [words[index + 1].start] : [])];
    const next = direction === 1 ? boundaries.find(point => point > audio.currentTime + .1) : boundaries.filter(point => point < audio.currentTime - .5).at(-1) ?? 0;
    if (next != null) seek(next);
  };
  // The retained Waveform has an internal region and no controlled-region API.
  // This declared keyboard adapter sends an untrusted synthetic mouse sequence
  // through its actual handlers. Ordinary mouse/touch remain native gestures.
  const repeatSentence = () => {
    if (!audio) return;
    const waveform = root.current?.querySelector<HTMLElement>('.waveform');
    if (!waveform) return;
    const region = sentenceAt(audio.currentTime), box = waveform.getBoundingClientRect();
    const x = (t: number) => box.left + box.width * t / (audio.duration || duration), y = box.top + box.height / 2;
    const send = (type: string, t: number) => waveform.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 1771, pointerType: 'mouse', clientX: x(t), clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
    flushSync(() => { send('pointerdown', region.start); send('pointermove', region.end); send('pointerup', region.end); });
    const enableLoop = root.current?.querySelector<HTMLButtonElement>('button[title="Enable looping"]');
    if (enableLoop) flushSync(() => enableLoop.click());
    seek(region.start); play();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement || event.target instanceof HTMLSelectElement) return;
    if (event.code === 'Space') { event.preventDefault(); toggle(); }
    else if (event.key === 'ArrowRight') { event.preventDefault(); event.shiftKey ? seek((audio?.currentTime ?? 0) + 10) : skipSentence(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); event.shiftKey ? seek((audio?.currentTime ?? 0) - 10) : skipSentence(-1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setSpeed(value => Math.min(2, +(value + .1).toFixed(1))); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setSpeed(value => Math.max(.8, +(value - .1).toFixed(1))); }
  };
  return h('div', { className: 'll-player', ref: root, onKeyDown, tabIndex: 0, role: 'group', 'aria-label': 'Danish listening player', 'data-listening-player': '', 'data-playing': String(playing) },
    h('div', { className: 'll-player-heading' }, h('strong', { lang: 'da' }, 'Papirbåden ved havnen'), h('span', null, 'Original story · AI-generated Cedar voice')),
    h('div', { className: 'll-current', lang: 'da', 'data-listening-text': '' }, h(TimedView, { audio, words, mode })),
    h('audio', { ref: connectAudio, src: '/media/listening/sample.wav', preload: 'metadata', style: { display: 'none' }, 'data-listening-audio': '', onError: () => setError('The sample could not load. The story transcript and recordings are available below.') }),
    h(Waveform, { peaks: fixture.peaks.data, audio, height: 84 }),
    h('div', { className: 'll-transport' },
      h('button', { type: 'button', onClick: () => skipSentence(-1), 'aria-label': 'Previous sentence', title: 'Previous sentence' }, h(Icon, { name: 'arrow-left' })),
      h('button', { type: 'button', className: 'll-play', onClick: toggle, 'aria-label': playing ? 'Pause story' : 'Play story' }, h(Icon, { name: playing ? 'pause' : 'play' }), playing ? 'Pause' : 'Play story'),
      h('button', { type: 'button', onClick: () => skipSentence(1), 'aria-label': 'Next sentence', title: 'Next sentence' }, h(Icon, { name: 'arrow-right' })),
      h('button', { type: 'button', className: 'll-repeat', onClick: repeatSentence }, h(Icon, { name: 'rotate' }), 'Repeat this sentence'),
      h('output', { className: 'll-time', 'aria-label': 'Playback position', 'data-listening-time': '' }, `${format(time)} / ${format(duration)}`)),
    h('div', { className: 'll-settings' },
      h('label', { className: 'll-seek' }, h('span', null, 'Find your place'), h('input', { type: 'range', min: 0, max: duration, step: .01, value: time, 'aria-label': 'Story position', onInput: event => seek(Number(event.currentTarget.value)) })),
      h('label', null, h('span', null, 'Playback speed'), h('input', { type: 'range', min: .8, max: 2, step: .1, value: speed, 'aria-label': 'Playback speed', onChange: event => setSpeed(Number(event.currentTarget.value)) }), h('output', null, `${speed.toFixed(1)}×`)),
      h('label', null, h('span', null, 'Read along'), h('select', { value: mode, 'aria-label': 'Reading view', onChange: (event: ChangeEvent<HTMLSelectElement>) => setMode(event.currentTarget.value as Mode) }, ...modes.map(option => h('option', { key: option.value, value: option.value }, option.label))))),
    h('p', { className: 'll-help' }, 'Click or tap the waveform to seek. Drag to mark a loop; on touch, hold briefly first. Clear removes the region. The sentence button also works from the keyboard.'),
    h('details', { className: 'll-shortcuts' }, h('summary', null, 'Keyboard controls'), h('p', null, 'Focus the player: Space plays or pauses; left and right move by sentence; Shift plus left or right skips ten seconds; up and down change speed. Tab reaches the position, zoom, view and loop controls.')),
    error && h('p', { className: 'll-error', role: 'alert' }, error));
}
