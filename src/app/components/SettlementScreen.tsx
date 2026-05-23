import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Settlement, Statistics, Project } from "../types/cospend";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface SettlementScreenProps {
  link: CospendLink;
}

export function SettlementScreen({ link }: SettlementScreenProps) {
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [project, setProject] = useState<Project | null>(null);
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
      const [settlementData, statsData, projectData] = await Promise.all([
        api.getSettlement(),
        api.getStatistics(),
        api.getProject(),
      ]);

      setSettlement(settlementData);
      setStats(statsData);
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settlement");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <Skeleton className="h-10 w-56 rounded-2xl bg-white/80" />
        <Skeleton className="h-64 rounded-3xl bg-white/80" />
        <Skeleton className="h-64 rounded-3xl bg-white/80" />
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

  const currencySymbol = project?.currencyname || "€";

  return (
    <div className="space-y-6 px-4 pt-5 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600">Overview</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settlement</h1>
          <p className="text-sm text-slate-500">Simplified debt settlement plan</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData} disabled={loading} className="h-11 w-11 rounded-2xl border-slate-200 bg-white/90 shadow-sm">
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {settlement?.transactions && settlement.transactions.length > 0 ? (
        <Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Payment plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {settlement.transactions.map((tx, idx) => {
              const fromMember = project?.members?.find((m) => m.id === tx.from);
              const toMember = project?.members?.find((m) => m.id === tx.to);
              const fromColor = fromMember
                ? `rgb(${fromMember.color.r}, ${fromMember.color.g}, ${fromMember.color.b})`
                : "#666";
              const toColor = toMember
                ? `rgb(${toMember.color.r}, ${toMember.color.g}, ${toMember.color.b})`
                : "#666";

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: fromColor }}
                    >
                      {fromMember?.name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {fromMember?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-slate-500">pays</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-bold text-blue-600">
                      {currencySymbol}
                      {tx.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="min-w-0 text-right">
                      <p className="truncate font-semibold text-slate-900">
                        {toMember?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-slate-500">receives</p>
                    </div>
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: toColor }}
                    >
                      {toMember?.name.charAt(0).toUpperCase() || "?"}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Alert className="rounded-3xl border-0 bg-emerald-50 text-emerald-700 shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All settled up! No pending payments.
          </AlertDescription>
        </Alert>
      )}

      {stats?.balances && (
        <Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Individual balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.balances)
              .sort((a, b) => parseFloat(b[1].toString()) - parseFloat(a[1].toString()))
              .map(([memberId, balance]) => {
                const member = project?.members?.find(
                  (m) => m.id === parseInt(memberId)
                );
                if (!member) return null;

                const isPositive = balance > 0;
                const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;

                return (
                  <div
                    key={memberId}
                    className="flex items-center justify-between rounded-3xl bg-slate-50/80 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{member.name}</span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          isPositive ? "text-emerald-600" : balance < 0 ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {currencySymbol}
                        {balance.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {isPositive ? "is owed" : balance < 0 ? "owes" : "settled"}
                      </div>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
