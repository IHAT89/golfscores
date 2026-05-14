export function calculateDifferential(grossScore: number, courseRating: number, slopeRating: number): number {
  return ((grossScore - courseRating) * 113) / slopeRating;
}

export function calculateHandicapIndex(differentials: number[]): number {
  if (differentials.length === 0) return 0;
  
  // USGA simplified: average of the best X rounds depending on count
  const sorted = [...differentials].sort((a, b) => a - b);
  let countToTake = 0;
  
  if (differentials.length < 3) countToTake = 1;
  else if (differentials.length < 6) countToTake = 1;
  else if (differentials.length < 9) countToTake = 2;
  else if (differentials.length < 12) countToTake = 3;
  else if (differentials.length < 15) countToTake = 4;
  else if (differentials.length < 17) countToTake = 5;
  else if (differentials.length < 19) countToTake = 6;
  else if (differentials.length === 19) countToTake = 7;
  else countToTake = 8; // Best 8 of 20
  
  const topDiffs = sorted.slice(0, Math.min(countToTake, differentials.length));
  const sum = topDiffs.reduce((a, b) => a + b, 0);
  return Number((sum / topDiffs.length).toFixed(1));
}

export function calculateCourseHandicap(handicapIndex: number, slopeRating: number, courseRating: number, par: number = 72): number {
  // (Handicap Index x (Slope Rating / 113)) + (Course Rating - Par)
  return Math.round((handicapIndex * (slopeRating / 113)) + (courseRating - par));
}