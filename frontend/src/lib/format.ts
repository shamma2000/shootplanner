export const formatLkr = (value: number | string) =>
  `Rs. ${Number(value).toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
