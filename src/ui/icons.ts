export const iconPaths = {
  'arrow-up-right': ['M6 18 18 6M6 6h12v12'],
  'arrow-down-left': ['M18 6 6 18M6 6v12h12'],
  'arrow-right': ['M4 12h16M13 5l7 7-7 7'],
  'arrow-left': ['M20 12H4M11 5l-7 7 7 7'],
  'arrow-down': ['M12 4v16M5 13l7 7 7-7'],
  'arrow-up': ['M12 20V4M5 11l7-7 7 7'],
  'arrow-both': ['M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4'],
  'turn-down-right': ['M5 4v11h14M14 10l5 5-5 5'],
  'undo': ['M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12'],
  'rotate': ['M4 10a8 8 0 1 1 1 9M4 4v6h6'],
  'close': ['M6 6l12 12M6 18 18 6'],
  'plus': ['M12 4v16M4 12h16'],
  'minus': ['M4 12h16'],
  'asterisk': ['M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9'],
  'play': ['m8 5 11 7-11 7V5Z'],
  'pause': ['M8 5v14M16 5v14'],
  'check': ['m5 12 4 4L19 6'],
  'dot': ['M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0'],
  'cursor': ['M10 4h4v16h-4V4Z'],
  'archive': ['M4 4h16v16H4V4ZM8 8h8v8H8V8Z'],
  'corner-box': ['M4 4q8 4 16 0q-4 8 0 16q-8-4-16 0q4-8 0-16Z'],
  'image': ['M3 4h18v16H3V4ZM3 15l6-6 7 7 3-3 2 2M15 8h.01'],
} as const;

export type IconName = keyof typeof iconPaths;

export function createIcon(name: IconName): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'ui-icon');
  svg.setAttribute('width', '1em');
  svg.setAttribute('height', '1em');
  svg.setAttribute('fill', name === 'dot' || name === 'cursor' ? 'currentColor' : 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const d of iconPaths[name]) {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export function setIconLabel(element: HTMLElement, label: string, name: IconName) {
  element.replaceChildren(document.createTextNode(label + ' '), createIcon(name));
}
