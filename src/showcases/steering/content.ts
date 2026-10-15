import receipt from '../../../public/media/steering/receipt.json';

export const recordedSteering = {
  receipt,
  original: receipt.instructions.originalSelectedExcerpt,
  correction: receipt.instructions.changed,
  result: receipt.tool.result,
  answer: receipt.answer,
  time: (event: string) => `${receipt.sequence.find(item => item.event === event)!.seconds.toFixed(2)} s`,
};
