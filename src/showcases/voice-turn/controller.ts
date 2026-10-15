/** Coordinate only the saved native media in this exhibit. Never start playback. */
export function mountRecordedVoiceTurn(section: HTMLElement) {
  const media = [...section.querySelectorAll<HTMLMediaElement>('audio, video')];
  for (const current of media) current.addEventListener('play', () => {
    for (const other of media) if (other !== current && !other.paused) other.pause();
  });
  const film = section.querySelector<HTMLVideoElement>('video');
  section.querySelector<HTMLDetailsElement>('[data-voice-film]')?.addEventListener('toggle', event => {
    if (!(event.currentTarget as HTMLDetailsElement).open && film && !film.paused) film.pause();
  });
  window.addEventListener('pagehide', () => {
    for (const current of media) if (!current.paused) current.pause();
  });
}
