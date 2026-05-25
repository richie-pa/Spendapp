import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import { storage } from "../lib/storage";
import type { CospendLink, Member } from "../types/cospend";

import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, UserCheck, Users } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface MembersScreenProps {
  link: CospendLink;
}

export function MembersScreen({ link }: MembersScreenProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(
    storage.getCurrentMember()
  );

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);
      const project = await api.getProject();

      setMembers(project.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const activeMembers = members.filter((member) => member.activated);
  const inactiveMembers = members.filter((member) => !member.activated);

  if (loading) {
    return (
      <div className="space-y-4 px-4 pt-5 pb-28">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="rounded-3xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderMemberCard = (member: Member, inactive = false) => {
    const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;
    const isCurrent = currentMemberId === member.id;

    return (
      <Card
        key={member.id}
        className={`rounded-3xl border shadow-sm transition-all ${
          inactive
            ? "border-slate-200 bg-slate-50 opacity-60"
            : isCurrent
              ? "border-blue-200 bg-blue-50 shadow-blue-100"
              : "border-slate-200 bg-white"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-lg font-semibold text-slate-900">
                  {member.name}
                </h3>

                {isCurrent && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                    Me
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span>ID: {member.id}</span>
                <span>•</span>
                <span>Weight: {member.weight}</span>
              </div>
            </div>

            {!inactive && (
              <Button
                type="button"
                size="sm"
                variant={isCurrent ? "default" : "outline"}
                className="shrink-0 rounded-2xl"
                onClick={() => {
                  storage.saveCurrentMember(member.id);
                  setCurrentMemberId(member.id);
                }}
              >
                {isCurrent ? "Selected" : "Select"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-dvh space-y-6 overflow-y-auto bg-slate-50 px-4 pt-5 pb-28">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-blue-600">People</p>

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Members
        </h1>

        <p className="text-sm text-slate-500">
          Select who you are on this device
        </p>
      </div>

      <Card className="rounded-3xl border-0 bg-white shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <UserCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">Current identity</p>

            <p className="text-sm text-slate-500">
              {currentMemberId
                ? activeMembers.find((m) => m.id === currentMemberId)?.name ||
                  "Selected member"
                : "No member selected yet"}
            </p>
          </div>
        </CardContent>
      </Card>

      {activeMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Active members
            </h2>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {activeMembers.length}
            </span>
          </div>

          {activeMembers.map((member) => renderMemberCard(member))}
        </div>
      )}

      {inactiveMembers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />

            <h2 className="text-xl font-bold text-slate-500">
              Inactive members
            </h2>
          </div>

          {inactiveMembers.map((member) => renderMemberCard(member, true))}
        </div>
      )}
    </div>
  );
}