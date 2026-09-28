import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyRecordFilter, type RecordFilter } from "@/features/workspace/record-filter";

export function RecordFilters({
  dates,
  onFilter,
  label,
}: {
  dates: string[];
  onFilter: (filter: RecordFilter) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(emptyRecordFilter);
  const years = [
    ...new Set([String(new Date().getFullYear()), ...dates.map((date) => date.slice(0, 4))]),
  ]
    .sort()
    .reverse();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onFilter(draft);
  };
  return (
    <form onSubmit={submit} className="record-filters" aria-label={`${label} filters`}>
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          className="bg-background pl-9"
          aria-label={`Search ${label.toLowerCase()}`}
          placeholder="Search client or phone..."
          value={draft.search}
          onChange={(event) => setDraft({ ...draft, search: event.target.value })}
        />
      </div>
      <select
        className="workspace-select"
        aria-label={`${label} year`}
        value={draft.year}
        onChange={(event) => setDraft({ ...draft, year: event.target.value })}
      >
        <option value="">All Years</option>
        {years.map((year) => (
          <option key={year}>{year}</option>
        ))}
      </select>
      <select
        className="workspace-select"
        aria-label={`${label} month`}
        value={draft.month}
        onChange={(event) => setDraft({ ...draft, month: event.target.value })}
      >
        <option value="">All Months</option>
        {Array.from({ length: 12 }, (_, index) => (
          <option key={index} value={String(index + 1).padStart(2, "0")}>
            {new Date(2026, index, 1).toLocaleString("en", { month: "long" })}
          </option>
        ))}
      </select>
      <Button type="submit">Filter</Button>
    </form>
  );
}
