export const getCusipFromUsIsin = (isin: string) => {
  const normalizedIsin = isin.trim().toUpperCase();

  return /^US[A-Z0-9]{10}$/.test(normalizedIsin)
    ? normalizedIsin.slice(2, 11)
    : undefined;
};
