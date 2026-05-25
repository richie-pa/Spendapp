import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Project, Settlement, Bill } from "../types/cospend";

import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  AlertCircle,
  Users,
  Receipt,
  RefreshCw,
  Wallet,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface DashboardScreenProps {
  link: CospendLink;
}

type Period = "day" | "week" | "month";

export function DashboardScreen({ link }: DashboardScreenProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<Period>("day");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);

      const [projectData, settlementData, billsData] = await Promise.all([
        api.getProject(),
        api.getSettlement(),
        api.getBills(false),
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

  const activeMembers = project?.members?.filter((m) => m.activated) || [];
  const currencySymbol = project?.currencyname || "€";
  const balances = settlement?.balances || project?.balance || {};

  const getCategoryName = (bill: Bill) => {
    const raw = bill as any;

    return (
      raw.category_name ||
      raw.categoryName ||
      project?.categories?.find(
        (cat) =>
          cat.id === raw.categoryid ||
          cat.id === raw.category_id ||
          cat.id === raw.categoryId ||
          cat.id === raw.category
      )?.name ||
      ""
    );
  };

  const isPaidBackBill = (bill: Bill) => {
    const categoryName = getCategoryName(bill).toLowerCase();

    return (
      categoryName.includes("paid back") ||
      bill.what?.toLowerCase().includes("paid back")
    );
  };

  const expenseBills = bills.filter((bill) => !isPaidBackBill(bill));



  const now = new Date();

  const isInSelectedPeriod = (bill: Bill) => {
    const date = new Date(bill.timestamp * 1000);

    if (period === "day") {
      return date.toDateString() === now.toDateString();
    }

    if (period === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      return date >= startOfWeek && date <= now;
    }

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const periodBills = expenseBills.filter(isInSelectedPeriod);

  const totalSpent = expenseBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const periodSpent = periodBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const averageExpense =
    periodBills.length > 0 ? periodSpent / periodBills.length : 0;

  const biggestBill =
    periodBills.length > 0
      ? periodBills.reduce((max, bill) =>
          Number(bill.amount) > Number(max.amount) ? bill : max
        )
      : null;

  const recentBills = [...bills]
    .filter((bill) => !bill.deleted)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const getMemberName = (id: unknown) => {
    const memberId = Number(id);

    if (!Number.isFinite(memberId)) {
      return "Unknown";
    }

    return activeMembers.find((m) => m.id === memberId)?.name || "Unknown";
  };

  const getPaidForName = (bill: Bill) => {
    const raw = bill as any;

    const id =
      raw.payed_for ||
      raw.payedFor ||
      raw.ower_id ||
      raw.owerId ||
      raw.ower;

    if (id) {
      const firstId = String(id).split(",")[0].trim();
      return getMemberName(firstId);
    }

    return "someone";
  };

  return (
    <div className="min-h-dvh space-y-5 px-4 pt-5 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600">Project</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {project?.name || "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500">
            Expenses overview, excluding paid backs
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={loadData}
          className="h-11 w-11 rounded-2xl border-slate-200 bg-white/90 shadow-sm"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <Card className="overflow-hidden rounded-3xl border-0 shadow-lg">
        <CardContent className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
              <Wallet className="h-6 w-6 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/80">Total spent</p>

              <div className="text-4xl font-bold tracking-tight text-white">
                {currencySymbol}
                {totalSpent.toFixed(2)}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/80">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                  <Receipt className="h-3.5 w-3.5" />
                  {expenseBills.length} expenses
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

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {(["day", "week", "month"] as Period[]).map((item) => (
          <Button
            key={item}
            type="button"
            variant={period === item ? "default" : "ghost"}
            className="rounded-xl capitalize"
            onClick={() => setPeriod(item)}
          >
            {item}
          </Button>
        ))}
      </div>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm backdrop-blur">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {period === "day"
                ? "Today"
                : period === "week"
                  ? "This week"
                  : "This month"}
            </h2>

            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
              Analytics
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Spent</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {currencySymbol}
                {periodSpent.toFixed(2)}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Movements</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {periodBills.length}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Average</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {currencySymbol}
                {averageExpense.toFixed(2)}
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Biggest</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {currencySymbol}
                {Number(biggestBill?.amount || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {biggestBill && (
            <div className="rounded-3xl bg-blue-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm font-medium">Biggest movement</p>
              </div>

              <p className="mt-1 font-bold text-blue-950">
                {biggestBill.what || "Untitled"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-xl font-bold text-slate-900">Balances</h2>

          {activeMembers.map((member) => {
            const balance = Number((balances as any)[member.id] || 0);
            const positive = balance >= 0;

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-white"
                    style={{
                      backgroundColor: `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`,
                    }}
                  >
                    {member.name.charAt(0)}
                  </div>

                  <span className="font-medium text-slate-900">
                    {member.name}
                  </span>
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

<Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
  <CardContent className="space-y-4 p-5">
    <div className="flex items-center gap-2">
      <CalendarDays className="h-5 w-5 text-blue-600" />

      <h2 className="text-xl font-bold text-slate-900">
        Recent activity
      </h2>
    </div>

    <div className="space-y-3">
      {recentBills.length > 0 ? (
        recentBills.map((bill) => {
          const isPaidBack = isPaidBackBill(bill);

          const payer = getMemberName(
            (bill as any).payer_id ||
              (bill as any).payerId ||
              (bill as any).payer
          );

          return (
            <div
              key={bill.id}
              className={`flex items-center justify-between rounded-2xl p-3 ${
                isPaidBack ? "bg-emerald-50" : "bg-slate-50"
              }`}
            >
              <div>
                <p
                  className={`font-medium ${
                    isPaidBack ? "text-emerald-800" : "text-slate-900"
                  }`}
                >
                  {isPaidBack
                    ? `${payer} paid back ${getPaidForName(bill)}`
                    : bill.what || "Untitled"}
                </p>

                <p
                  className={`text-xs ${
                    isPaidBack ? "text-emerald-700/70" : "text-slate-500"
                  }`}
                >
                  {isPaidBack ? "Paid Back" : `Paid by ${payer}`} ·{" "}
                  {new Date(bill.timestamp * 1000).toLocaleDateString()}
                </p>
              </div>

              <span
                className={`font-bold ${
                  isPaidBack ? "text-emerald-700" : "text-slate-900"
                }`}
              >
                {currencySymbol}
                {Number(bill.amount || 0).toFixed(2)}
              </span>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-slate-500">
          No activity yet.
        </p>
      )}
    </div>
  </CardContent>
</Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <h2 className="text-xl font-bold text-slate-900">Who owes who</h2>

          {settlement?.transactions?.length ? (
            settlement.transactions.map((tx, index) => (
              <div
                key={index}
                className="rounded-2xl border border-orange-100 bg-orange-50 p-4"
              >
                <p className="font-medium text-orange-950">
                  {getMemberName(tx.from)} pays {getMemberName(tx.to)}
                </p>

                <p className="text-2xl font-bold text-orange-600">
                  {currencySymbol}
                  {Number(tx.amount || 0).toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-slate-500">Everything is settled 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}