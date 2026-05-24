export interface SnsContent {
  id: string;
  topic: string;
  xContent: string;
  facebookContent: string;
  wantedlyContent: string;
  createdAt: string;
  status: "draft" | "posted";
}

const STORAGE_KEY = "sns_library";

export function getSnsLibrary(): SnsContent[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveSnsContent(
  content: Omit<SnsContent, "id" | "createdAt" | "status">
): SnsContent {
  const library = getSnsLibrary();
  const newItem: SnsContent = {
    ...content,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    status: "draft",
  };
  library.unshift(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  return newItem;
}

export function updateSnsStatus(id: string, status: SnsContent["status"]): void {
  const library = getSnsLibrary();
  const index = library.findIndex((item) => item.id === id);
  if (index !== -1) {
    library[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
  }
}

export function deleteSnsContent(id: string): void {
  const library = getSnsLibrary();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(library.filter((item) => item.id !== id))
  );
}
