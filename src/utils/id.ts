export const createId = (prefix = 'id') => {
  const cryptoValue = globalThis.crypto?.randomUUID?.();
  if (cryptoValue) {
    return `${prefix}_${cryptoValue}`;
  }

  const randomPart = Math.random().toString(36).slice(2, 12);
  const timePart = Date.now().toString(36);

  return `${prefix}_${timePart}_${randomPart}`;
};
