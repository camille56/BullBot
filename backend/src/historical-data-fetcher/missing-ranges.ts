export function filterMissingDates(requestedDates: string[], coveredDates: Set<string>): string[] {
  return requestedDates.filter((date) => !coveredDates.has(date));
}
