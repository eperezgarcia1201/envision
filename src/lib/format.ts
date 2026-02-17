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

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
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

export function formatTime(input: Date | string | null | undefined): string {
  if (!input) return "TBD";
  const value = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(value.getTime())) return "TBD";
  return timeFormatter.format(value);
}

export function formatDateTime(input: Date | string | null | undefined): string {
  if (!input) return "TBD";
  const value = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(value.getTime())) return "TBD";
  return dateTimeFormatter.format(value);
}
