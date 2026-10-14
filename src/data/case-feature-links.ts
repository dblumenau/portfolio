import { memoryCaseFeatureSlugs } from './memory-case-studies';

export const caseFeatureSlugs: Record<string, string[]> = {
  ...memoryCaseFeatureSlugs,
  panelforge: ['branching-workbench', 'reference-to-chat', 'workspace-hierarchy'],
  'connected-agents': ['disconnect-recovery', 'steer-without-interrupt', 'visible-agent-activity', 'shared-engine-surface', 'voice-conversation-loop'],
  'connected-tools': ['native-tool-boundary-profiles', 'gateway-tool-profiles', 'focus-aware-question'],
};
