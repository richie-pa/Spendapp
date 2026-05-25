import { useEffect, useState } from "react";
import { storage, type SavedProject } from "../lib/storage";

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

interface SettingsScreenProps {
  onLogout: () => void;
}

export function SettingsScreen({
  onLogout,
}: SettingsScreenProps) {
  const [projects, setProjects] = useState<SavedProject[]>([]);

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

  return (
    <div className="space-y-6 px-4 pt-5 pb-28">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-blue-600">
          Preferences
        </p>

        <h1 className="text-3xl font-bold tracking-tight">
          Settings
        </h1>

        <p className="text-sm text-slate-500">
          Manage your Splitcloud projects and connection
        </p>
      </div>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>
            Current project
          </CardTitle>

          <CardDescription>
            Connected locally on this device
          </CardDescription>
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
                Active
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No active project
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>
            Saved projects
          </CardTitle>

          <CardDescription>
            Quickly switch between shared groups
          </CardDescription>
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
                          handleSwitchProject(project)
                        }
                      >
                        Open
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
                        handleRemoveProject(project.id)
                      }
                    >
                      Remove project
                    </Button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl bg-slate-50 p-5 text-center">
              <p className="font-medium text-slate-700">
                No saved projects
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Connect another project to save it here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>
            Connection
          </CardTitle>

          <CardDescription>
            Remove the current active connection
          </CardDescription>
        </CardHeader>

        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-12 w-full rounded-2xl"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect current project
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Disconnect project?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  This removes the current active
                  connection from this device.
                  Saved projects stay available for
                  quick switching.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-2xl">
                  Cancel
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleLogout}
                  className="rounded-2xl"
                >
                  Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>
            About
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />

            <span>
              Splitcloud mobile expense manager
            </span>
          </div>

          <p>
            Built for shared trips, homes, couples,
            friends and groups using the Cospend
            public API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}