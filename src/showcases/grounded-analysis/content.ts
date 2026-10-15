export const analysisMedia = '/media/grounded-analysis';
export const analysisCaptures = [
  { id: 'entity', label: 'Entity profile', file: 'entity.png', width: 1440, height: 1000,
    title: 'Before opening the source.',
    caption: 'The actual entity profile groups the saved relationships and links to their conversation. It does not verify their meaning.',
    alt: 'Actual PanelForge entity profile for fictional Harbor Notebook, showing connections to IndexedDB, Markdown and Mira Vale, with a source conversation button.' },
  { id: 'source', label: 'Source conversation', file: 'source.png', width: 1080, height: 1000,
    title: 'Read the original qualification.',
    caption: 'The second user turn says “for this project.” The desktop source view is cropped and message metadata is masked; the conversation wording is unchanged.',
    alt: 'Actual imported fictional conversation. The second user message keeps IndexedDB as the primary store and prefers manual file exports over cloud sync for this project. Message metadata is masked.' },
  { id: 'phone', label: 'Phone source', file: 'phone-source.png', width: 390, height: 844,
    title: 'The same source at phone width.',
    caption: 'The actual phone flow opened this conversation through the entity’s event button. The bottom conversation-list button was covered by the mobile navigation.',
    alt: 'Actual phone source view showing Mira Vale’s authored fictional request for Harbor Notebook, including offline tablet storage in IndexedDB and portable Markdown export.' },
] as const;
