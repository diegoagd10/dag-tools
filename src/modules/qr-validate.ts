const MAX_QR_BYTES = 2048;

export function trimContent(input: string): string {
  return input.trim();
}

export function isEmptyAfterTrim(input: string): boolean {
  return trimContent(input).length === 0;
}

export function isOverByteLimit(content: string, limit: number = MAX_QR_BYTES): boolean {
  return new TextEncoder().encode(content).length > limit;
}

export type ValidResult = { valid: true; content: string };
export type InvalidResult = { valid: false; error: "empty" | "too-long" };
export type ValidateResult = ValidResult | InvalidResult;

export function validateQrContent(input: string): ValidateResult {
  const trimmed = trimContent(input);

  if (trimmed.length === 0) {
    return { valid: false, error: "empty" };
  }

  if (isOverByteLimit(trimmed)) {
    return { valid: false, error: "too-long" };
  }

  return { valid: true, content: trimmed };
}
