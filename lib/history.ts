export interface SavedResult {
  title: string;
  content: string;
  savedAt: string;
}

export function getLastResult(toolKey: string): SavedResult | null {
  if (typeof window === "undefined") return null;
  try {
    const data = localStorage.getItem(`result_${toolKey}`);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveLastResult(
  toolKey: string,
  title: string,
  content: string
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `result_${toolKey}`,
    JSON.stringify({ title, content, savedAt: new Date().toISOString() })
  );
}

export function deleteLastResult(toolKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`result_${toolKey}`);
}
