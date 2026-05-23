import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Project, Statistics, Settlement, Member } from "../types/cospend";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, Users, Receipt, TrendingUp, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface DashboardScreenProps {
  link: CospendLink;
}

export function DashboardScreen({ link }: DashboardScreenProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);
      const [projectData, statsData, settlementData] = await Promise.all([
        api.getProject(),
        api.getStatistics(),
        api.getSettlement(),
      ]);

      setProject(projectData);
      setStats(statsData);
      setSettlement(settlementData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
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

  const activeMembers = project?.members?.filter((m) => m.activated) || [];
  const currencySymbol = project?.currencyname || "€";

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">{project?.name || "Dashboard"}</h1>
          <p className="text-muted-foreground">Overview of your shared expenses</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencySymbol}
              {(stats?.totalSpent || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBills || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      {stats?.balances && (
        <Card>
          <CardHeader>
            <CardTitle>Member Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.balances).map(([memberId, balance]) => {
                const member = project?.members?.find(
                  (m) => m.id === parseInt(memberId)
                );
                if (!member) return null;

                const isPositive = balance > 0;
                const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;

                return (
                  <div key={memberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <span
                      className={`font-bold ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {currencySymbol}
                      {balance.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {settlement?.transactions && settlement.transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settlement.transactions.map((tx, idx) => {
                const fromMember = project?.members?.find((m) => m.id === tx.from);
                const toMember = project?.members?.find((m) => m.id === tx.to);

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fromMember?.name}</span>
                      <span className="text-muted-foreground">pays</span>
                      <span className="font-medium">{toMember?.name}</span>
                    </div>
                    <span className="font-bold text-primary">
                      {currencySymbol}
                      {tx.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
