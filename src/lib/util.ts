import { z } from "astro:content";

export const dateDetailLevelValidator = z.union([
  z.literal("year"),
  z.literal("month"),
  z.literal("day"),
]);

export type DataDetailLevel = z.infer<typeof dateDetailLevelValidator>;

function toS(digits: number, n: number): string {
  const s = z.number().int().parse(n).toString();
  const count0 = digits - s.length;
  if (count0 < 0) {
    return s;
  } else {
    return `${Array.from({ length: count0 }, () => "0").join("")}${s}`;
  }
}

export function renderDate(level: DataDetailLevel, date: Date): string {
  switch (level) {
    case "day":
      return `${toS(4, date.getFullYear())}-${toS(2, date.getMonth() + 1)}-${toS(2, date.getDay() + 1)}`;
    case "month":
      return `${toS(4, date.getFullYear())}-${toS(2, date.getMonth() + 1)}`;
    case "year":
      return toS(4, date.getFullYear());
  }
}
