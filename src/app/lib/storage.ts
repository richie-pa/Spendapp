import type { CospendLink } from "../types/cospend";

const STORAGE_KEY = "cospend_link";

export const storage = {
  saveLink(link: CospendLink): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(link));
  },

  getLink(): CospendLink | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  clearLink(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
