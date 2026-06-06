import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import { createTranslator } from "../lib/i18n";
import { storage } from "../lib/storage";
import type { CospendLink, Settlement, Project, Bill } from "../types/cospend";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Wallet,
  HandCoins,
  ShoppingBag,
  Scale,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";

interface SettlementScreenProps {
  link: CospendLink;
}

export function SettlementScreen({ link }: SettlementScreenProps) {
  const t = createTranslator(storage.getLanguage());
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
      setError(err instanceof Error ? err.message : t("failedToLoadSettlement"));
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

  const money = (value: number) => {
    return `${currencySymbol}${Number(value || 0).toFixed(2)}`;
  };

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

  const normalBills = bills.filter((bill) => !isPaidBackBill(bill));
  const paidBackBills = bills.filter((bill) => isPaidBackBill(bill));

  const getMemberPaid = (memberId: number) => {
    return normalBills
      .filter((bill) => getPayerId(bill) === memberId)
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  };

  const getMemberSpent = (memberId: number) => {
    return normalBills.reduce((sum, bill) => {
      const ids = getPaidForIds(bill);

      if (!ids.includes(memberId) || ids.length === 0) {
        return sum;
      }

      return sum + Number(bill.amount || 0) / ids.length;
    }, 0);
  };

  const getMemberReceived = (memberId: number) => {
    return paidBackBills.reduce((sum, bill) => {
      const ids = getPaidForIds(bill);

      if (!ids.includes(memberId)) {
        return sum;
      }

      return sum + Number(bill.amount || 0);
    }, 0);
  };

  const getMemberSentBack = (memberId: number) => {
    return paidBackBills
      .filter((bill) => getPayerId(bill) === memberId)
      .reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
  };

  const getSettlementBalance = (memberId: number) => {
    const balances = settlement?.balances || (project as any)?.balance || {};
    const value = (balances as any)[memberId];

    if (value !== undefined && value !== null) {
      return Number(value);
    }

    const paid = getMemberPaid(memberId);
    const received = getMemberReceived(memberId);
    const spent = getMemberSpent(memberId);
    const sentBack = getMemberSentBack(memberId);

    return paid + received - spent - sentBack;
  };

  const memberSummaries = activeMembers.map((member) => {
    const paid = getMemberPaid(member.id);
    const received = getMemberReceived(member.id);
    const spent = getMemberSpent(member.id);
    const sentBack = getMemberSentBack(member.id);
    const balance = getSettlementBalance(member.id);

    return {
      member,
      paid,
      received,
      spent,
      sentBack,
      balance,
    };
  });

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
          <p className="text-sm font-semibold text-blue-600">{t("overview")}</p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {t("settlement")}
          </h1>

          <p className="text-sm text-slate-500">{t("paidReceivedSpentBalance")}</p>
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
                <p className="text-sm font-medium">{t("getsBackMost")}</p>
              </div>

              <p className="mt-2 truncate text-lg font-bold text-emerald-950">
                {mostAdvanced?.member.name || "—"}
              </p>

              <p className="text-sm font-semibold text-emerald-700">
                +{money(Math.max(mostAdvanced?.balance || 0, 0))}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 bg-red-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <Scale className="h-4 w-4" />
                <p className="text-sm font-medium">{t("owesMost")}</p>
              </div>

              <p className="mt-2 truncate text-lg font-bold text-red-950">
                {mostOwing?.member.name || "—"}
              </p>

              <p className="text-sm font-semibold text-red-600">
                {money(Math.min(mostOwing?.balance || 0, 0))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t("perPerson")}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {memberSummaries.map(
            ({ member, paid, received, spent, sentBack, balance }) => {
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
                          {t("paid")} {money(paid)} · {t("received")} {money(received)} · {t("spent")} {money(spent)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                    <p
                      className={`whitespace-nowrap text-lg font-bold ${
                        isPositive ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                        {isPositive ? "+" : ""}
                        {money(balance)}
                      </p>

                      <p className="text-xs text-slate-500">
                        {isPositive ? t("getsBackMost") : t("owesMost")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-white p-3 text-center">
                      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <Wallet className="h-3.5 w-3.5" />
                      </div>

                      <p className="text-[11px] text-slate-500">{t("paid")}</p>

                      <p className="font-semibold text-slate-900">
                        {money(paid)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 text-center">
                      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <HandCoins className="h-3.5 w-3.5" />
                      </div>

                      <p className="text-[11px] text-slate-500">{t("received")}</p>

                      <p className="font-semibold text-emerald-700">
                        {money(received)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 text-center">
                      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </div>

                      <p className="text-[11px] text-slate-500">{t("spent")}</p>

                      <p className="font-semibold text-slate-900">
                        {money(spent)}
                      </p>
                    </div>
                  </div>

                  {sentBack > 0 && (
                    <div className="mt-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      {t("sentBack")} {money(sentBack)} {t("already")}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-0 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{t("whoOwesWho")}</CardTitle>
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
                    {money(Number(tx.amount || 0))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-emerald-50 p-6 text-center">
              <p className="text-lg font-bold text-emerald-700">
                {t("everythingSettled")}
              </p>

              <p className="mt-1 text-sm text-emerald-700/70">
                {t("nobodyOwesAnything")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}