import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Project, Settlement } from "../types/cospend";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, Users, Receipt, RefreshCw, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface DashboardScreenProps {
  link: CospendLink;
}

export function DashboardScreen({ link }: DashboardScreenProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);
      const [projectData, settlementData] = await Promise.all([
        api.getProject(),
        api.getSettlement(),
      ]);

      setProject(projectData);
      setSettlement(settlementData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-20 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
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
  const totalSpent = project?.total_spent || 0;
  const totalBills = project?.nb_bills || 0;
  const balances = settlement?.balances || project?.balance || {};

  const getMemberName = (id: number) =>
    activeMembers.find((m) => m.id === id)?.name || `Member ${id}`;

  return (
    <div className="min-h-screen p-4 space-y-5 pb-28 bg-gradient-to-b from-blue-50 to-slate-50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-blue-600 font-semibold">CoPay</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {project?.name || "Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Shared expenses overview
          </p>
        </div>

        <Button variant="outline" size="icon" onClick={loadData}>
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <Card className="rounded-3xl border-0 shadow-lg bg-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Total spent</p>
              <div className="text-4xl font-bold">
                {currencySymbol}
                {totalSpent.toFixed(2)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-3xl shadow-sm border-0">
          <CardContent className="p-5">
            <Receipt className="h-6 w-6 text-blue-600 mb-3" />
            <p className="text-sm text-muted-foreground">Bills</p>
            <p className="text-2xl font-bold">{totalBills}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm border-0">
          <CardContent className="p-5">
            <Users className="h-6 w-6 text-emerald-600 mb-3" />
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-2xl font-bold">{activeMembers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-sm border-0">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-xl font-bold">Balances</h2>

          {activeMembers.map((member) => {
            const balance = Number(balances[member.id] || 0);
            const positive = balance >= 0;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{
                      backgroundColor: `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`,
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <span className="font-medium">{member.name}</span>
                </div>

                <span
                  className={`font-bold ${
                    positive ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {positive ? "+" : ""}
                  {currencySymbol}
                  {balance.toFixed(2)}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-sm border-0">
        <CardContent className="p-5 space-y-4">
          <h2 className="text-xl font-bold">Who owes who</h2>

          {settlement?.transactions?.length ? (
            settlement.transactions.map((tx, index) => (
              <div
                key={index}
                className="rounded-2xl bg-orange-50 border border-orange-100 p-4"
              >
                <p className="font-medium">
                  {getMemberName(tx.from)} pays {getMemberName(tx.to)}
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {currencySymbol}
                  {tx.amount.toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">Everything is settled 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}