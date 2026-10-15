export const workspaceMedia = '/media/workspace-hierarchy';

export const workspaceCaptures = [
  {
    id: 'before', label: 'Before', file: 'before.png', width: 1280, height: 800,
    title: 'Studio holds Pocket Gardens.',
    caption: 'Window Garden and Courtyard are scenes inside the project. Afternoon light is a panel in Window Garden, with the uploaded still life assigned to it.',
    alt: 'Actual PanelForge gallery before the move. Studio contains Pocket Gardens, its two scenes and the Afternoon light panel. The uploaded plant illustration appears beside the tree. The image identifier is masked.',
  },
  {
    id: 'after', label: 'After reload', file: 'after.png', width: 1280, height: 800,
    title: 'Archive holds the same project.',
    caption: 'The reloaded gallery shows Pocket Gardens beneath Archive. The same two scenes, panel and uploaded image remain visible together.',
    alt: 'Actual PanelForge gallery after the move and page reload. Archive contains Pocket Gardens, Courtyard, Window Garden and the Afternoon light panel, with the same plant illustration. The image identifier is masked.',
  },
  {
    id: 'phone', label: 'Phone tree', file: 'phone-after.png', width: 390, height: 844,
    title: 'The saved hierarchy at phone width.',
    caption: 'A separate after-move phone capture shows Archive, Pocket Gardens, both scenes and the panel. The move itself was recorded on desktop.',
    alt: 'Actual after-move phone view of the PanelForge tree. Archive contains Pocket Gardens, the Courtyard and Window Garden scenes, and the Afternoon light panel.',
  },
] as const;
