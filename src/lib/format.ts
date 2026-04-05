const jaDateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const enDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "long",
});

export function formatDateTimeJa(date: Date): string {
  return jaDateTimeFormatter.format(date);
}

export function formatDateEn(date: Date): string {
  return enDateFormatter.format(date);
}

export function formatYearMonth(date: Date): string {
  return `${date.getUTCFullYear()}/${date.getUTCMonth() + 1}`;
}
