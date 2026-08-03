export type SetupMode = 'default' | 'demo';

export const getSetupMode = (modeValue?: string): SetupMode => {
  if (modeValue === 'demo') {
    return 'demo';
  }

  return 'default';
};
