export function revokePreviousUrl<T extends { url: string }>(
  prev: T | null,
  nextUrl?: string,
) {
  if (prev && prev.url !== nextUrl) {
    URL.revokeObjectURL(prev.url);
  }
}
