import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Member } from "../types/cospend";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface MembersScreenProps {
  link: CospendLink;
}

export function MembersScreen({ link }: MembersScreenProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);
      const data = await api.getMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.activated);
  const inactiveMembers = members.filter((m) => !m.activated);

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            {activeMembers.length} active, {inactiveMembers.length} inactive
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadMembers}
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {activeMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Active Members</h2>
          {activeMembers.map((member) => {
            const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;
            return (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {member.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>ID: {member.id}</span>
                        <span>•</span>
                        <span>Weight: {member.weight}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {inactiveMembers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Inactive Members</h2>
          {inactiveMembers.map((member) => {
            const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;
            return (
              <Card key={member.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {member.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>ID: {member.id}</span>
                        <span>•</span>
                        <span>Weight: {member.weight}</span>
                      </div>
                    </div>
                    <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Member management requires authenticated Nextcloud access
        </AlertDescription>
      </Alert>
    </div>
  );
}
