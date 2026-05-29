import { useEffect, useState } from "react";
import { createTranslator } from "../lib/i18n";
import {
  storage,
  type SavedProject,
} from "../lib/storage";

import { Button } from "./ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

import {
  LogOut,
  FolderOpen,
  ChevronRight,
  Smartphone,
  Plus,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { LanguageSelector } from "./LanguageSelector";

interface SettingsScreenProps {
  onLogout: () => void;
}

export function SettingsScreen({
  onLogout,
}: SettingsScreenProps) {
  const t = createTranslator(storage.getLanguage());
  const [projects, setProjects] = useState<
    SavedProject[]
  >([]);

  useEffect(() => {
    setProjects(storage.getProjects());
  }, []);

  const currentLink = storage.getLink();

  const currentProject = projects.find(
    (project) =>
      project.link.token === currentLink?.token
  );

  const handleLogout = () => {
    storage.clearLink();
    onLogout();
  };

  const handleSwitchProject = (
    project: SavedProject
  ) => {
    storage.switchProject(project);
    window.location.reload();
  };

  const handleRemoveProject = (
    projectId: string
  ) => {
    storage.removeProject(projectId);

    const updated = storage.getProjects();
    setProjects(updated);
  };

  const handleAddProject = () => {
    storage.clearLink();
    onLogout();
  };

  return (
    <div className="space-y-6 px-4 pt-5 pb-28">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-blue-600">
          {t("preferences")}
        </p>

        <h1 className="text-3xl font-bold tracking-tight">
          {t("settings")}
        </h1>

        <p className="text-sm text-slate-500">
          {t("manageProjectsConnections")}
        </p>
      </div>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t("language")}</CardTitle>
        </CardHeader>

        <CardContent>
          <LanguageSelector onLanguageChange={() => window.location.reload()} />
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t("currentProject")}</CardTitle>

          <CardDescription>{t("connectedLocally")}</CardDescription>
        </CardHeader>

        <CardContent>
          {currentProject ? (
            <div className="flex items-center justify-between rounded-3xl border border-blue-100 bg-blue-50 p-4">
              <div className="min-w-0">
                <p className="truncate font-semibold text-blue-950">
                  {currentProject.name}
                </p>

                <p className="mt-1 truncate text-xs text-blue-700/70">
                  {currentProject.link.host}
                </p>
              </div>

              <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                  {t("active")}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
                {t("noActiveProject")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
            <CardTitle>{t("savedProjects")}</CardTitle>

            <CardDescription>{t("quicklySwitchBetweenGroups")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {projects.length > 0 ? (
            projects.map((project) => {
              const isCurrent =
                project.link.token ===
                currentLink?.token;

              return (
                <div
                  key={project.id}
                  className={`rounded-3xl border p-4 transition-all ${
                    isCurrent
                      ? "border-blue-100 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-slate-500" />

                        <p className="truncate font-semibold text-slate-900">
                          {project.name}
                        </p>
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {project.link.host}
                      </p>
                    </div>

                    {!isCurrent && (
                      <Button
                        size="sm"
                        className="rounded-2xl"
                        onClick={() =>
                          handleSwitchProject(
                            project
                          )
                        }
                      >
                        {t("open")}

                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {!isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 h-9 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600"
                      onClick={() =>
                        handleRemoveProject(
                          project.id
                        )
                      }
                    >
                      {t("removeProject")}
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl bg-slate-50 p-5 text-center">
              <p className="font-medium text-slate-700">{t("noSavedProjects")}</p>

              <p className="mt-1 text-sm text-slate-500">
                {t("addAnotherProjectToSaveItHere")}
              </p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl border-dashed"
            onClick={handleAddProject}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("addAnotherProject")}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t("connection")}</CardTitle>

          <CardDescription>{t("removeCurrentActiveConnection")}</CardDescription>
        </CardHeader>

        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-12 w-full rounded-2xl"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("disconnectCurrentProject")}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>{t("disconnectProjectTitle")}</AlertDialogTitle>

                <AlertDialogDescription>{t("disconnectProjectDescription")}</AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-2xl">
                  {t("cancel")}
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleLogout}
                  className="rounded-2xl"
                >
                  {t("disconnect")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>{t("about")}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />

            <span>
              {t("mobileExpenseManager")}
            </span>
          </div>

          <p>{t("aboutDescription")}</p>
        </CardContent>
      </Card>
    </div>
  );
}