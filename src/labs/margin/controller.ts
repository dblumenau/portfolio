import { cases, scenarioFor, checksFor, decisionLabel, explanation, seconds, eventLabel, reviewAt, noteAt } from './model';
import { setIconLabel, createIcon } from '../../ui/icons';

export function initMarginLab() {
  const root = document.querySelector<HTMLElement>('[data-margin-lab]');
  if (!root || root.dataset.enhanced === 'true') return;
  const get = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  let caseId: string = cases[0].id;
  let checkIndex = 0;
  const next = get<HTMLButtonElement>('[data-next]');
  const previous = get<HTMLButtonElement>('[data-previous]');
  function set(selector: string, text: string) { get(selector).textContent = text; }
  function render() {
    const scenario = scenarioFor(caseId);
    const meta = cases.find(item => item.id === caseId)!;
    const checks = checksFor(scenario);
    checkIndex = Math.max(0, Math.min(checkIndex, checks.length - 1));
    const { event, index } = checks[checkIndex];
    root!.dataset.case = caseId;
    root!.dataset.check = String(checkIndex);
    root!.dataset.outcome = event.result;
    set('[data-case-title]', meta.label);
    set('[data-case-intro]', meta.intro);
    set('[data-takeaway]', meta.takeaway);
    set('[data-book-time]', seconds(event.time));
    set('[data-check-kind]', event.action === 'present' ? 'Note presentation check' : 'Review check');
    set('[data-check-count]', `${checkIndex + 1} / ${checks.length}`);
    set('[data-result-title]', decisionLabel(event));
    set('[data-result-copy]', explanation(event));
    set('[data-active]', seconds(event.unreviewedActiveSeconds));
    set('[data-strokes]', String(event.unreviewedStrokes));
    set('[data-idle]', seconds(event.idleSeconds));
    const review = reviewAt(scenario, index);
    const note = noteAt(scenario, index);
    set('[data-review-permission]', review ? review.result === 'review' ? `Permitted at ${seconds(review.time)}` : review.result === 'unchanged' ? 'No new work' : `Wait at ${seconds(review.time)}` : 'Not checked');
    set('[data-note-permission]', note ? note.result === 'present' ? `Permitted at ${seconds(note.time)}` : `Hold at ${seconds(note.time)}` : 'Not checked');
    const noteState = note?.result === 'present' ? 'permitted' : note?.result === 'hold' ? 'held' : 'unchecked';
    get('[data-margin-state]').dataset.state = noteState;
    set('[data-note-title]', noteState === 'permitted' ? 'A note may appear' : noteState === 'held' ? 'Keep the margin quiet' : 'The margin waits');
    set('[data-note-copy]', noteState === 'permitted' ? 'Placement illustration. No AI answer was generated.' : noteState === 'held' ? 'Ready feedback is held at this check.' : 'No note presentation check yet.');
    get('.ml-margin-mark').replaceChildren(createIcon(noteState === 'permitted' ? 'check' : 'pause'));
    const written = scenario.events.slice(0, index + 1).filter(e => e.action === 'write' || e.action === 'write-range').length > 0;
    const maxWork = Math.max(0, ...scenario.events.slice(0, index + 1).map(e => e.unreviewedStrokes));
    const visibleLines = written ? Math.max(1, Math.min(6, Math.ceil(maxWork / 55))) : 0;
    root!.querySelectorAll<SVGPathElement>('[data-ink-line]').forEach((line, i) => { line.style.opacity = i < visibleLines ? '1' : '0'; });
    get('[data-pen]').style.opacity = written ? '1' : '0';
    root!.dataset.pen = written && (event.reason === 'writing' || event.reason === 'user writing' || event.reason.includes('waiting for pen')) ? 'active' : 'settled';
    previous.setAttribute('aria-disabled', String(checkIndex === 0));
    const complete = checkIndex === checks.length - 1;
    next.setAttribute('aria-disabled', String(complete));
    setIconLabel(next, complete ? 'Case complete' : 'Next recorded check', complete ? 'check' : 'arrow-right');
    set('[data-next-context]', complete ? 'Choose another case, or inspect the exact events below.' : `Next check: ${seconds(checks[checkIndex + 1].event.time)} into the case.`);
    set('[data-timeline-duration]', `${seconds(checks.at(-1)!.event.time)} elapsed`);
    const timeline = get('[data-timeline]');
    timeline.replaceChildren(...checks.map(({ event }, i) => {
      const li = document.createElement('li');
      const button = document.createElement('button'); button.dataset.checkChoice = String(i);
      if (i === checkIndex) button.setAttribute('aria-current', 'step');
      const time = document.createElement('span'); time.textContent = seconds(event.time);
      const label = document.createElement('strong'); label.textContent = eventLabel(event);
      button.append(time, label); li.append(button); return li;
    }));
    root!.querySelectorAll<HTMLButtonElement>('[data-case-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.caseChoice === caseId)));
    set('[data-events-caption]', scenario.title);
    get('[data-events]').replaceChildren(...scenario.events.map(e => {
      const tr = document.createElement('tr');
      for (const value of [seconds(e.time), e.action, e.result, e.reason]) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
      return tr;
    }));
  }
  function save() {
    const url = new URL(location.href); url.searchParams.set('case', caseId); url.searchParams.set('check', String(checkIndex));
    history.pushState(null, '', url);
  }
  function revealCase() {
    if (!window.matchMedia('(max-width: 600px)').matches) return;
    const introduction = get('.ml-case-copy');
    const actionBottom = next.getBoundingClientRect().bottom;
    const fitsWithIntroduction = actionBottom - introduction.getBoundingClientRect().top <= window.innerHeight - 36;
    const target = fitsWithIntroduction ? introduction : get('.ml-decision');
    window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - 18, behavior: 'instant' });
  }
  function readURL() {
    const params = new URLSearchParams(location.search);
    const meta = cases.find(item => item.id === params.get('case')) ?? cases[0];
    caseId = meta.id;
    const index = Number(params.get('check') ?? meta.start);
    checkIndex = Number.isInteger(index) && index >= 0 ? index : meta.start;
    render();
  }
  root.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    if (button.dataset.caseChoice) { caseId = button.dataset.caseChoice; checkIndex = cases.find(item => item.id === caseId)!.start; render(); save(); revealCase(); }
    else if (button === next || button === previous) { checkIndex += button === next ? 1 : -1; render(); save(); }
    else if (button.dataset.checkChoice !== undefined) {
      checkIndex = Number(button.dataset.checkChoice); render(); save();
      get<HTMLButtonElement>(`[data-check-choice="${checkIndex}"]`).focus({ preventScroll: true });
    }
  });
  window.addEventListener('popstate', readURL);
  readURL();
  root.dataset.enhanced = 'true';
}
