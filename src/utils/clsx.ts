type ClassValue = string | false | null | undefined;

/** Joins truthy class names. */
export default function clsx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
