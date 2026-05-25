import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Settlement, Project, Bill } from "../types/cospend";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Scale,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface SettlementScreenProps {
  link: CospendLink;
}

export function SettlementScreen({ link }: SettlementScreenProps) {
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
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

      const [settlementData, projectData, billsData] = await Promise.all([
        api.getSettlement(),
        api.getProject(),
        api.getBills(false),
      ]);

      setSettlement(settlementData);
      setProject(projectData);
      setBills(billsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settlement");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 px-4 pt-5 pb-[calc(9rem+env(safe-area-inset-bottom))]">
        <Skeleton className="h-12 rounded-2xl bg-white/80" />
        <Skeleton className="h-48 rounded-3xl bg-white/80" />
        <Skeleton className="h-64 rounded-3xl bg-white/80" />
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

  const getMemberName = (id: unknown) => {
    const memberId = Number(id);

    if (!Number.isFinite(memberId)) {
      return "Unknown";
    }

    return activeMembers.find((m) => m.id === memberId)?.name || "Unknown";
  };

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

  const getPayerId = (bill: Bill) => {
    const raw = bill as any;
    return Number(raw.payer_id || raw.payerId || raw.payer);
  };

  const getPaidForIds = (bill: Bill) => {
    const raw = bill as any;

    const rawIds =
      raw.payed_for ||
      raw.payedFor ||
      raw.payed_for_ids ||
      raw.payedForIds ||
      raw.ower_ids ||
      raw.owers ||
      "";

    if (Array.isArray(rawIds)) {
      return rawIds
        .map((item) => {
          if (typeof item === "object") {
            return Number(item.id);
          }

          return Number(item);
        })
        .filter(Boolean);
    }

    return String(rawIds)
      .split(",")
      .map((id) => Number(id.trim()))
      .filter(Boolean);
  };

  const expenseBills = bills;

  const getMemberPaid = (memberId: number) => {
    return expenseBills
      .filter((bill) => getPayerId(bill) === memberId)
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  };

  const getMemberSpent = (memberId: number) => {
    return expenseBills.reduce((sum, bill) => {
      const ids = getPaidForIds(bill);

      if (!ids.includes(memberId) || ids.length === 0) {
        return sum;
      }

      return sum + Number(bill.amount || 0) / ids.length;
    }, 0);
  };

  const memberSummaries = activeMembers.map((member) => {
    const paid = getMemberPaid(member.id);
    const spent = getMemberSpent(member.id);
    const balance = paid - spent;

    return {
      member,
      paid,
      spent,
      balance,
    };
  });

  const totalExpenses = expenseBills.reduce(
    (sum, bill) => sum + Number(bill.amount || 0),
    0
  );

  const unsettledAmount =
    settlement?.transactions?.reduce(
      (sum, tx: any) => sum + Number(tx.amount || 0),
      0
    ) || 0;

  const mostAdvanced = [...memberSummaries].sort(
    (a, b) => b.balance - a.balance
  )[0];

  const mostOwing = [...memberSummaries].sort(
    (a, b) => a.balance - b.balance
  )[0];

  return (
    <div className="space-y-6 px-4 pt-5 pb-[calc(10rem+env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-600">Overview</p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Settlement
          </h1>

          <p className="text-sm text-slate-500">
            Simple numbers for who paid, spent, and still owes
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={loadData}
          disabled={loading}
          className="h-11 w-11 rounded-2xl border-slate-200 bg-white/90 shadow-sm"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>



      {memberSummaries.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-3xl border-0 bg-emerald-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Wallet className="h-4 w-4" />
                <p className="text-sm font-medium">Most advanced</p>
              </div>

              <p className="mt-2 truncate text-lg font-bold text-emerald-950">
                {mostAdvanced?.member.name || "—"}
              </p>

              <p className="text-sm font-semibold text-emerald-700">
                +{currencySymbol}
                {Math.max(mostAdvanced?.balance || 0, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-red-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <TrendingUp className="h-4 w-4" />
                <p className="text-sm font-medium">Most owing</p>
              </div>

              <p className="mt-2 truncate text-lg font-bold text-red-950">
                {mostOwing?.member.name || "—"}
              </p>

              <p className="text-sm font-semibold text-red-600">
                {currencySymbol}
                {Math.min(mostOwing?.balance || 0, 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Per person</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {memberSummaries.map(({ member, paid, spent, balance }) => {
            const isPositive = balance >= 0;

            return (
              <div
                key={member.id}
                className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold text-white"
                      style={{
                        backgroundColor: `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`,
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {member.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        Paid {currencySymbol}
                        {paid.toFixed(2)} · Spent {currencySymbol}
                        {spent.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        isPositive ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {currencySymbol}
                      {balance.toFixed(2)}
                    </p>

                    <p className="text-xs text-slate-500">
                      {isPositive ? "gets back" : "owes"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white p-2 text-center">
                    <p className="text-[11px] text-slate-500">Paid</p>
                    <p className="font-semibold text-slate-900">
                      {currencySymbol}
                      {paid.toFixed(0)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-2 text-center">
                    <p className="text-[11px] text-slate-500">Spent</p>
                    <p className="font-semibold text-slate-900">
                      {currencySymbol}
                      {spent.toFixed(0)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white p-2 text-center">
                    <p className="text-[11px] text-slate-500">Balance</p>
                    <p
                      className={`font-semibold ${
                        isPositive ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {currencySymbol}
                      {balance.toFixed(0)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Who owes who</CardTitle>
        </CardHeader>

        <CardContent>
          {settlement?.transactions && settlement.transactions.length > 0 ? (
            <div className="space-y-3">
              {settlement.transactions.map((tx: any, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-3xl border border-orange-100 bg-orange-50 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="truncate font-semibold text-orange-950">
                      {getMemberName(tx.from)}
                    </span>

                    <ArrowRight className="h-4 w-4 shrink-0 text-orange-500" />

                    <span className="truncate font-semibold text-orange-950">
                      {getMemberName(tx.to)}
                    </span>
                  </div>

                  <span className="shrink-0 text-lg font-bold text-orange-600">
                    {currencySymbol}
                    {Number(tx.amount || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-emerald-50 p-6 text-center">
              <p className="text-lg font-bold text-emerald-700">
                Everything is settled 🎉
              </p>

              <p className="mt-1 text-sm text-emerald-700/70">
                Nobody owes anything right now.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}