const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export function formatCurrencyFromCents(amountCents: number): string {
  return currencyFormatter.format(amountCents / 100);
}

export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return "TBD";
  const value = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(value.getTime())) return "TBD";
  return dateFormatter.format(value);
}
