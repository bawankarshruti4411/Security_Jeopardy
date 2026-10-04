/**
 * Normalizes answer text for robust, fair comparison:
 * - Trims whitespace
 * - Converts to uppercase
 * - Collapses repeated whitespace
 * - Standardizes common punctuation (e.g. hyphens to spaces or identical)
 */
export function normalizeAnswer(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

export function isAnswerCorrect(
  submitted: string,
  officialAnswer: string,
  acceptedVariants: string[] = []
): boolean {
  const cleanSubmitted = normalizeAnswer(submitted);
  if (!cleanSubmitted) return false;

  const validOptions = [officialAnswer, ...acceptedVariants].map(normalizeAnswer);

  // Exact match with any accepted option
  if (validOptions.includes(cleanSubmitted)) {
    return true;
  }

  // Also check normalized without hyphens (e.g. MAN-IN-THE-MIDDLE vs MAN IN THE MIDDLE)
  const dehyphenated = cleanSubmitted.replace(/-/g, ' ');
  const validDehyphenated = validOptions.map((opt) => opt.replace(/-/g, ' '));
  if (validDehyphenated.includes(dehyphenated)) {
    return true;
  }

  return false;
}
