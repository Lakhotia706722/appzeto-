const INITIAL_GAP = 1000;

export const getInsertPosition = (beforePos, afterPos) => {
  if (beforePos === null && afterPos === null) return INITIAL_GAP;
  if (beforePos === null) return afterPos - INITIAL_GAP;
  if (afterPos === null) return beforePos + INITIAL_GAP;
  return (beforePos + afterPos) / 2;
};
