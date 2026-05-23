import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type {
  CospendLink,
  Project,
  Settlement,
  Bill,
} from "../types/cospend";

import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, Users, Receipt, RefreshCw, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
  const [bills, setBills] = useState<Bill[]>([]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);
      const [projectData, settlementData, billsData] = await Promise.all([
        api.getProject(),
        api.getSettlement(),
        api.getBills(),
      ]);

      setProject(projectData);
      setSettlement(settlementData);
      setBills(billsData);
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
      <div className="space-y-4 px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <Skeleton className="h-24 rounded-3xl bg-white/80" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-3xl bg-white/80" />
          <Skeleton className="h-28 rounded-3xl bg-white/80" />
        </div>
        <Skeleton className="h-40 rounded-3xl bg-white/80" />
        <Skeleton className="h-44 rounded-3xl bg-white/80" />
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
  const sortedBills = [...bills].sort(
  (a, b) => b.timestamp - a.timestamp
);

const recentBills = sortedBills.slice(0, 5);

const biggestBill =
  sortedBills.length > 0
    ? sortedBills.reduce((max, b) =>
        b.amount > max.amount ? b : max
      )
    : null;

const averageExpense =
  bills.length > 0
    ? totalSpent / bills.length
    : 0;

const spendingByMonth = bills.reduce((acc, bill) => {
  const date = new Date(bill.timestamp * 1000);

  const key = date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  acc[key] = (acc[key] || 0) + bill.amount;

  return acc;
}, {} as Record<string, number>);

const topMonth = Object.entries(spendingByMonth).sort(
  (a, b) => Number(b[1]) - Number(a[1])
)[0];

  const billsStart = project?.date_begin || null;
  const billsEnd = project?.date_end || null;

  const timeRange =
    billsStart && billsEnd
      ? `${billsStart} → ${billsEnd}`
      : "All time";

  const getMemberName = (id: number) =>
    activeMembers.find((m) => m.id === id)?.name || `Member ${id}`;

  return (
    <div className="min-h-dvh space-y-5 px-4 pt-5 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600">Prokect</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {project?.name || "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500">
            Shared expenses overview
          </p>
        </div>

        <Button variant="outline" size="icon" onClick={loadData} className="h-11 w-11 rounded-2xl border-slate-200 bg-white/90 shadow-sm">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

<Card className="rounded-3xl border-0 shadow-lg overflow-hidden">
  <CardContent className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
        <Wallet className="h-6 w-6 text-white" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-white/80">
          Total spent
        </p>

        <div className="text-4xl font-bold tracking-tight text-white">
          {currencySymbol}
          {totalSpent.toFixed(2)}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/80">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
            <Receipt className="h-3.5 w-3.5" />
            {totalBills} bills
          </span>

          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
            <Users className="h-3.5 w-3.5" />
            {activeMembers.length} people
          </span>
        </div>
      </div>
    </div>
  </CardContent>
</Card>

<Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
  <CardContent className="space-y-4 p-5">
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold tracking-tight text-slate-900">
        Spending Insights
      </h2>

      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
        Analytics
      </span>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Average expense
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {currencySymbol}
          {averageExpense.toFixed(2)}
        </p>
      </div>

      <div className="rounded-3xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Biggest bill
        </p>

        <p className="mt-1 text-2xl font-bold text-slate-900">
          {currencySymbol}
          {biggestBill?.amount?.toFixed(2) || "0"}
        </p>
      </div>
    </div>

    {topMonth && (
      <div className="rounded-3xl bg-blue-50 p-4">
        <p className="text-sm text-blue-600">
          Highest spending month
        </p>

        <p className="mt-1 text-xl font-bold text-blue-900">
          {topMonth[0]}
        </p>

        <p className="text-blue-700">
          {currencySymbol}
          {Number(topMonth[1]).toFixed(2)}
        </p>
      </div>
    )}

    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
        Recent Activity
      </h3>

      {recentBills.map((bill) => (
        <div
          key={bill.id}
          className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
        >
          <div>
            <p className="font-medium text-slate-900">
              {bill.what}
            </p>

            <p className="text-xs text-slate-500">
              {new Date(bill.timestamp * 1000).toLocaleDateString()}
            </p>
          </div>

          <span className="font-bold text-slate-900">
            {currencySymbol}
            {bill.amount.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Receipt className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500">Bills</p>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{totalBills}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
          <CardContent className="p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-500">Members</p>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{activeMembers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Balances</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Net position</span>
          </div>

          {activeMembers.map((member) => {
            const balance = Number(balances[member.id] || 0);
            const positive = balance >= 0;

            return (
              <div key={member.id} className="flex items-center justify-between rounded-3xl bg-slate-50/90 p-4 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                    style={{
                      backgroundColor: `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`,
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <span className="block font-medium text-slate-900">{member.name}</span>
                    <span className="text-xs text-slate-500">Share balance</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`flex items-center justify-end gap-1 font-bold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
                    {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    {positive ? "+" : ""}{currencySymbol}{balance.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-500">{positive ? "is owed" : "owes"}</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Settlement</h2>

          {settlement?.transactions?.length ? (
            settlement.transactions.map((tx, index) => (
              <div
                key={index}
                className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4"
              >
                <p className="font-medium text-slate-900">
                  {getMemberName(tx.from)} pays {getMemberName(tx.to)}
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-700">
                  {currencySymbol}
                  {tx.amount.toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-700">
              Everything is settled up.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}