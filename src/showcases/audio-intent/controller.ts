import { armAudio, isAudioArmed, Howler, useWebAudioPlayer } from './vendor/runtime.js';

/** A bounded queue demonstration. The retained player owns actual playback. */
export function mountAudioIntent(section: HTMLElement): void {
  if (section.dataset.audioMounted) return;
  section.dataset.audioMounted = 'true';
  const find = <T extends HTMLElement>(selector: string) => section.querySelector<T>(selector)!;
  const incoming = find<HTMLButtonElement>('[data-audio-incoming]');
  const listen = find<HTMLButtonElement>('[data-audio-listen]');
  const stopButton = find<HTMLButtonElement>('[data-audio-stop]');
  const reload = find<HTMLButtonElement>('[data-audio-reload]');
  const delivery = find<HTMLSelectElement>('[data-audio-delivery]');
  const badge = find('[data-audio-badge]');
  const message = find('[data-audio-message]');
  const arrival = find('[data-audio-arrival]');
  const reply = find('[data-audio-reply]');
  const player = useWebAudioPlayer();
  let epoch = 0;
  let active = false;
  let started = false;
  let hadError = false;
  let outerTimers = new Set<ReturnType<typeof setTimeout>>();
  let observer: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  const bindings: Array<() => void> = [];
  const seen = new WeakSet<object>();
  const arrived: number[] = [];
  const tone = (index: number) => `/media/audio-intent/tone-${index}.wav`;

  function show(text: string): void {
    if (message.textContent !== text) message.textContent = text;
  }
  function render(): void {
    const armed = isAudioArmed();
    section.dataset.audioArmed = String(armed);
    section.dataset.audioPlaying = String(player.isPlaying.value);
    section.dataset.audioSynthesizing = String(player.isSynthesizing.value);
    section.dataset.audioActive = String(active);
    section.dataset.audioError = String(hadError);
    badge.textContent = armed ? 'Page enabled' : 'Audio off';
    incoming.disabled = armed;
    listen.disabled = active;
    stopButton.disabled = !active;
    delivery.disabled = active;
    reload.hidden = !armed;
  }
  function clearOuterWork(): void {
    for (const timer of outerTimers) clearTimeout(timer);
    outerTimers.clear();
    clearInterval(observer); observer = undefined;
    clearTimeout(deadline); deadline = undefined;
    for (const unbind of bindings.splice(0)) unbind();
  }
  function stop(reason = 'Stopped. This page stays enabled.'): void {
    epoch++;
    active = false;
    clearOuterWork();
    player.stop();
    render();
    show(isAudioArmed() ? reason : 'Audio is off. Receive a sample reply or choose Listen.');
  }
  function observeAfterAdvance(run: number): void {
    const timer = setTimeout(() => {
      outerTimers.delete(timer);
      if (run === epoch && active) observeHowls(run);
    }, 0);
    outerTimers.add(timer);
  }
  function observeHowls(run: number): void {
    // Actual Howler event subscriptions. No player or browser API is replaced.
    for (const howl of Howler._howls ?? []) {
      if (seen.has(howl)) continue;
      seen.add(howl);
      const onPlay = () => {
        if (run !== epoch || !active) return;
        started = true;
        if (!hadError) show('Playback started. The queue keeps the pieces in order.');
      };
      const onError = () => {
        if (run !== epoch || !active) return;
        hadError = true;
        show('A sample could not play. Remaining pieces may continue.');
        render();
        observeAfterAdvance(run);
      };
      // Howler dispatches listeners in reverse registration order. Defer until
      // the retained player's end handler has created the next lazy Howl.
      const onEnd = () => { if (run === epoch && active) observeAfterAdvance(run); };
      howl.on('play', onPlay).on('loaderror', onError).on('playerror', onError).on('end', onEnd);
      bindings.push(() => { howl.off('play', onPlay).off('loaderror', onError).off('playerror', onError).off('end', onEnd); });
    }
  }
  function check(run: number): void {
    if (run !== epoch || !active) return;
    observeHowls(run);
    render();
    if (!outerTimers.size && !player.isPlaying.value && !player.isSynthesizing.value) {
      active = false;
      clearOuterWork();
      render();
      show(hadError ? 'Queue finished with a playback error.' : started ? 'Queue finished. This page stays enabled.' : 'Queue finished without confirmed playback. Check your output or try Listen again.');
    }
  }
  function schedule(run: number, index: number, delay: number): void {
    const timer = setTimeout(() => {
      outerTimers.delete(timer);
      if (run !== epoch || !active) return;
      player.queueOrderedChunk(tone(index), 'wav', index, index === 2);
      arrived.push(index + 1);
      arrival.textContent = `Received: ${arrived.join(' → ')}. Playback order: 1 → 2 → 3.`;
      observeHowls(run);
      if (!started && player.isSynthesizing.value && !player.isPlaying.value) show('Final piece received. Waiting for the earlier pieces.');
      check(run);
    }, delay);
    outerTimers.add(timer);
  }

  if (Howler.noAudio || typeof window.Audio !== 'function' || typeof window.AudioContext !== 'function') {
    section.dataset.audioReady = 'unsupported';
    show('This browser cannot run these audio controls. The sample-file links below still work with supported playback software.');
    return;
  }

  incoming.addEventListener('click', () => {
    if (isAudioArmed()) return;
    player.setSynthesizing(true);
    for (const index of [2, 0, 1]) player.queueOrderedChunk(tone(index), 'wav', index, index === 2);
    reply.hidden = false;
    render();
    show('Sample reply received. Audio stayed off; its audio events were dropped.');
    const controls = find('.audio-sample-controls');
    const bounds = controls.getBoundingClientRect();
    if (window.matchMedia('(max-width: 760px)').matches && (bounds.bottom > window.innerHeight || bounds.top < 0)) {
      controls.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
  listen.addEventListener('click', () => {
    if (active || document.hidden) return;
    // The prepared module is already loaded. Activation occurs in this gesture,
    // before any delivery timer, promise or await.
    armAudio();
    stop();
    const run = ++epoch;
    active = true;
    started = false;
    hadError = false;
    arrived.length = 0;
    arrival.textContent = 'Waiting for sample pieces.';
    show('Page enabled. Preparing the sample queue.');
    player.setSynthesizing(true);
    const order = delivery.value === 'reordered' ? [2, 0, 1] : [0, 1, 2];
    order.forEach((index, position) => schedule(run, index, position * 260));
    observer = setInterval(() => check(run), 60);
    deadline = setTimeout(() => stop('Playback did not finish within 15 seconds. Stopped; you can try Listen again.'), 15_000);
    render();
  });
  stopButton.addEventListener('click', () => stop());
  reload.addEventListener('click', () => window.location.reload());
  window.addEventListener('pagehide', () => { stop('Page left. Playback stopped.'); player.destroy(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop('Page hidden. Playback stopped.'); });
  document.addEventListener('astro:before-swap', () => { stop('Page left. Playback stopped.'); player.destroy(); });
  section.dataset.audioReady = 'true';
  render();
  show('Audio is off. Receive a sample reply or choose Listen.');
}
