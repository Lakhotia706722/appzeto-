/**
 * LexoRank-inspired floating-point position utilities for task ordering.
 * Initial positions: 1000, 2000, 3000...
 * Insert between two tasks: midpoint = (before + after) / 2
 * Rebalance when any gap < 1 (floating-point exhaustion)
 */

const INITIAL_GAP = 1000;
const MIN_GAP = 1;

/**
 * Returns the midpoint position for inserting between two tasks.
 * @param {number|null} beforePos - Position of task before insertion point (null = beginning)
 * @param {number|null} afterPos  - Position of task after insertion point (null = end)
 * @returns {number}
 */
const getInsertPosition = (beforePos, afterPos) => {
  if (beforePos === null && afterPos === null) return INITIAL_GAP;
  if (beforePos === null) return afterPos - INITIAL_GAP;
  if (afterPos === null) return beforePos + INITIAL_GAP;
  return (beforePos + afterPos) / 2;
};

/**
 * Returns a position that places the task at the end of the list.
 * @param {number|null} lastPos - Current last task's position (null if column empty)
 * @returns {number}
 */
const getAppendPosition = (lastPos) => {
  if (lastPos === null || lastPos === undefined) return INITIAL_GAP;
  return lastPos + INITIAL_GAP;
};

/**
 * Returns true if any adjacent pair of tasks has a gap smaller than MIN_GAP.
 * @param {Array<{position: number}>} tasks - Sorted by position ascending
 * @returns {boolean}
 */
const needsRebalance = (tasks) => {
  if (tasks.length < 2) return false;
  const sorted = [...tasks].sort((a, b) => a.position - b.position);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].position - sorted[i - 1].position < MIN_GAP) return true;
  }
  return false;
};

/**
 * Redistributes tasks with evenly spaced positions (1000, 2000, 3000...).
 * @param {Array<{position: number}>} tasks - Array of task objects
 * @returns {Array<{position: number}>} New array with updated positions
 */
const rebalance = (tasks) => {
  const sorted = [...tasks].sort((a, b) => a.position - b.position);
  return sorted.map((task, idx) => ({
    ...task,
    position: (idx + 1) * INITIAL_GAP,
  }));
};

module.exports = { getInsertPosition, getAppendPosition, needsRebalance, rebalance };
