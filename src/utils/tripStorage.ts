export function loadTripScopedValue<T>(
  storageKey: string,
  tripId: string,
  fallbackValue: T,
): T {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return fallbackValue;

    const parsed = JSON.parse(stored) as Record<string, T>;
    return parsed[tripId] ?? fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function persistTripScopedValue<T>(
  storageKey: string,
  tripId: string,
  value: T,
) {
  try {
    const stored = window.localStorage.getItem(storageKey);
    const parsed = stored ? (JSON.parse(stored) as Record<string, T>) : {};
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ ...parsed, [tripId]: value }),
    );
  } catch {
    window.localStorage.setItem(storageKey, JSON.stringify({ [tripId]: value }));
  }
}
