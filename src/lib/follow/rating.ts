export function testimonialRating(answers: Record<string, string> | null | undefined): number | null {
  const n = Number(answers?.rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return null;
  return n;
}
