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
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
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

  const currencySymbol = project?.currencyname || "€";

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Settlement</h1>
          <p className="text-muted-foreground">Simplified debt settlement plan</p>
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

      {settlement?.transactions && settlement.transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  className="flex items-center gap-3 p-4 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: fromColor }}
                    >
                      {fromMember?.name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {fromMember?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">pays</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <span className="font-bold text-primary text-lg">
                      {currencySymbol}
                      {tx.amount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="min-w-0 text-right">
                      <p className="font-semibold truncate">
                        {toMember?.name || "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">receives</p>
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All settled up! No pending payments.
          </AlertDescription>
        </Alert>
      )}

      {stats?.balances && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Balances</CardTitle>
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
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold">{member.name}</span>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-lg font-bold ${
                          isPositive ? "text-green-600" : balance < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {currencySymbol}
                        {balance.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
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
