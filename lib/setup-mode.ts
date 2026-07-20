export type SetupMode = 'default' | 'demo' | 'admin';

export const getSetupMode = (modeValue?: string): SetupMode => {
  if (modeValue === 'demo' || modeValue === 'admin') {
    return modeValue;
  }

  return 'default';
};
