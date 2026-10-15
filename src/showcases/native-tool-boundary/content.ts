import receipt from '../../../public/media/native-tool-boundary/receipt.json';

// Values are selected from the two completed runtime receipts. The page never
// issues a tool call or recalculates permission outcomes in the browser.
export const protectedRun = receipt.protectedRun;
export const separateControl = receipt.separateControl;
export { receipt };
