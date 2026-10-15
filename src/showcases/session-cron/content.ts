import receipt from '../../../public/media/session-cron/receipt.json';

export { receipt };
export const timeline = [
  { title: 'One schedule armed', process: 'Process A', description: 'The original CLI created one non-recurring session cron.' },
  { title: 'Original CLI closed', process: 'Process A exited', description: 'Its process was gone before the session resumed.' },
  { title: 'Same session resumed', process: 'Process B', description: 'A different CLI resumed it without another query.' },
  { title: 'Answer arrived', process: 'Autonomous response', description: 'The scheduled response matched the fixed text requested.' },
] as const;

const descriptions = {
  eligible: { situation: 'Future one-shot', result: 'Eligible to restore' },
  missed: { situation: 'One-shot whose fire time passed', result: 'Dropped' },
  recurring_equal_expiry: { situation: 'Recurring job at seven days old', result: 'Expired' },
} as const;
export const syntheticCases = receipt.synthetic_classifier.selected_cases.map(row => ({
  ...descriptions[row.case as keyof typeof descriptions],
  restorable: row.restorable_count > 0,
}));
