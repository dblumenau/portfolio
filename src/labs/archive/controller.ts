import { execution, stages, commandOutput } from './model';

export function initArchiveLab(root: HTMLElement) {
  if (root.dataset.ready === 'true') return;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const stage = get('[data-archive-stage]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-recorded-step]')];
  const replayControls = get<HTMLFieldSetElement>('[data-replay-controls]');
  const checkControls = get<HTMLFieldSetElement>('[data-check-controls]');
  const verify = get<HTMLButtonElement>('[data-verify]');
  const change = get<HTMLButtonElement>('[data-change]');
  const check = get('[data-check-state]');
  const status = get('[data-local-status]');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-file-check]')];
  let originals: ArrayBuffer[] | null = null;
  let edited = false;
  let busy = false;

  buttons.forEach((button, index) => button.addEventListener('click', () => {
    const selected = stages[index];
    stage.dataset.archiveStage = selected.key;
    buttons.forEach((candidate, i) => candidate.setAttribute('aria-pressed', String(index === i)));
    get('[data-index-file]').textContent = selected.file;
    get('[data-index-assets]').textContent = selected.assets;
    get('[data-index-resources]').textContent = selected.resources;
    get('[data-index-integrity]').textContent = selected.integrity;
    get('[data-index-note]').textContent = selected.note;
    get('[data-stage-status]').textContent = `${selected.title}. ${selected.note}`;
    get('[data-output-label]').textContent = index === 1 ? 'Recorded file-removal receipt' : 'Actual command output';
    get('[data-command-output]').textContent = index === 1
      ? JSON.stringify(execution.indexRemoval, null, 2)
      : `${commandOutput(selected.command)}\n\n${commandOutput(index === 0 ? '06-verify' : '10-final-verify')}`;
  }));
  replayControls.disabled = false;

  if (!globalThis.crypto?.subtle) {
    status.textContent = 'This browser cannot calculate SHA-256 here. The recorded hashes, original downloads and complete CLI evidence remain readable below.';
    check.dataset.checkState = 'unsupported';
    root.dataset.ready = 'true';
    return;
  }
  checkControls.disabled = false;
  status.textContent = 'Ready to fetch 3 synthetic PNGs, about 12 KB in total. Their hashes are calculated here; no files are uploaded.';

  async function hash(buffer: ArrayBuffer) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  function setBusy(value: boolean) {
    busy = value;
    check.setAttribute('aria-busy', String(value));
    verify.setAttribute('aria-disabled', String(value));
    change.setAttribute('aria-disabled', String(value));
  }
  async function compare(copies: ArrayBuffer[]) {
    const digests = await Promise.all(copies.map(hash));
    let matches = 0;
    cards.forEach((card, i) => {
      const matching = digests[i] === execution.fixtures[i].sha256 && copies[i].byteLength === execution.fixtures[i].bytes;
      if (matching) matches++;
      card.dataset.result = matching ? 'match' : 'mismatch';
      card.querySelector('[data-local-hash]')!.textContent = digests[i];
      card.querySelector('[data-file-result]')!.textContent = matching ? 'Match' : edited ? 'Mismatch · memory copy' : 'Mismatch · fetched file';
    });
    check.dataset.checkState = matches === 3 ? 'verified' : 'mismatch';
    return matches;
  }
  verify.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    change.disabled = true;
    originals = null;
    edited = false;
    change.textContent = 'Change one copied byte';
    check.dataset.checkState = 'checking';
    status.textContent = 'Fetching the three synthetic originals and calculating their SHA-256 hashes in this browser…';
    cards.forEach(card => {
      delete card.dataset.result;
      card.querySelector('[data-file-result]')!.textContent = 'Checking…';
      card.querySelector('[data-local-hash]')!.textContent = 'Calculating';
    });
    try {
      const loaded = await Promise.all(execution.fixtures.map(async fixture => {
        const response = await fetch(fixture.src);
        if (!response.ok) throw new Error('A synthetic original could not be fetched.');
        return response.arrayBuffer();
      }));
      const matches = await compare(loaded);
      if (matches !== 3) {
        status.textContent = `${matches} of 3 hosted files match the recorded originals. A fetched file differs in size or SHA-256; the copied-byte illustration is unavailable.`;
        return;
      }
      originals = loaded;
      change.disabled = false;
      get('[data-verify-label]').textContent = 'Verify originals again';
      status.textContent = '3 of 3 hosted originals match the recorded sizes and SHA-256 hashes. Try changing one copied byte to see the comparison catch it.';
    } catch {
      check.dataset.checkState = 'error';
      cards.forEach(card => {
        delete card.dataset.result;
        card.querySelector('[data-file-result]')!.textContent = 'Could not check';
        card.querySelector('[data-local-hash]')!.textContent = 'Unavailable';
      });
      status.textContent = 'The local check could not finish. Try verifying again, or inspect the recorded hashes and download links. This does not change the completed CLI proof.';
    } finally {
      setBusy(false);
    }
  });
  change.addEventListener('click', async () => {
    if (busy || !originals) return;
    setBusy(true);
    try {
      edited = !edited;
      const copies = originals.map(original => original.slice(0));
      if (edited) new Uint8Array(copies[0])[0] ^= 1;
      await compare(copies);
      change.textContent = edited ? 'Restore the copied bytes' : 'Change one copied byte';
      status.textContent = edited
        ? 'One byte in the Chromatic grid memory copy changed. Its SHA-256 no longer matches; the other two still match. The hosted PNGs and downloaded originals are unchanged.'
        : '3 of 3 unmodified copies match again. Only temporary memory changed; the hosted PNGs and downloaded originals stayed unchanged.';
    } catch {
      check.dataset.checkState = 'error';
      status.textContent = 'This browser could not complete the copied-byte comparison. Verify the hosted originals again to reset the local check.';
    } finally {
      setBusy(false);
    }
  });
  root.dataset.ready = 'true';
}

document.querySelectorAll<HTMLElement>('[data-archive-lab]').forEach(initArchiveLab);
