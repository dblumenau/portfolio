import receipt from '../../../public/media/model-policy/receipt.json';

export const modelPolicyRecord = {
  receipt,
  request: receipt.request,
  unchanged: receipt.comparison.noDefaultRole,
  override: receipt.comparison.defaultRoleOverride,
  unknown: receipt.secondary,
};
