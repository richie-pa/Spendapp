import type { CospendLink } from "../types/cospend";

const CURRENT_LINK_KEY = "cospend_link";
const PROJECTS_KEY = "cospend_projects";
const LANGUAGE_KEY = "splitcloud_language";

export type AppLanguage = "en" | "de";

export interface SavedProject {
  id: string;
  name: string;
  link: CospendLink;
}

export const storage = {
  getLanguage(): AppLanguage {
    const raw = localStorage.getItem(LANGUAGE_KEY);

    if (raw === "de") {
      return "de";
    }

    return "en";
  },

  setLanguage(language: AppLanguage) {
    localStorage.setItem(LANGUAGE_KEY, language);
  },

  getLink(): CospendLink | null {
    const raw = localStorage.getItem(CURRENT_LINK_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  saveCurrentMember(memberId: number) {
    localStorage.setItem("splitcloud_current_member", String(memberId));
  },

  getCurrentMember() {
    const value = localStorage.getItem("splitcloud_current_member");
    return value ? Number(value) : null;
  },

  saveLink(link: CospendLink) {
    localStorage.setItem(CURRENT_LINK_KEY, JSON.stringify(link));
  },

  clearLink() {
    localStorage.removeItem(CURRENT_LINK_KEY);
  },

  getProjects(): SavedProject[] {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveProject(project: SavedProject) {
    const projects = this.getProjects();
    const exists = projects.some((p) => p.id === project.id);

    const next = exists
      ? projects.map((p) => (p.id === project.id ? project : p))
      : [...projects, project];

    localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
  },

  removeProject(id: string) {
    const next = this.getProjects().filter((p) => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(next));
  },

  switchProject(project: SavedProject) {
    this.saveLink(project.link);
  },
};

