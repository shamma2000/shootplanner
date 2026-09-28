export type RecordFilter = { search: string; year: string; month: string };
export const emptyRecordFilter: RecordFilter = { search: "", year: "", month: "" };

export function matchesRecordFilter(filter: RecordFilter, text: string, date: string) {
  return (
    text.toLowerCase().includes(filter.search.trim().toLowerCase()) &&
    (!filter.year || date.slice(0, 4) === filter.year) &&
    (!filter.month || date.slice(5, 7) === filter.month)
  );
}
