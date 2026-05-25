import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Bill, Project } from "../types/cospend";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  AlertCircle,
  Search,
  Trash2,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

interface BillsScreenProps {
  link: CospendLink;
}

export function BillsScreen({ link }: BillsScreenProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);

      const [activeBills, deletedBills, projectData] = await Promise.all([
        api.getBills(false),
        api.getBills(true),
        api.getProject(),
      ]);

      const allBills = [
        ...activeBills.map((b) => ({ ...b, deleted: false })),
        ...deletedBills.map((b) => ({ ...b, deleted: true })),
      ];

      setBills(allBills.sort((a, b) => b.timestamp - a.timestamp));
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load movements");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!billToDelete) return;

    setDeleting(true);

    try {
      const api = new CospendApi(link);
      await api.deleteBill(billToDelete.id);
      toast.success("Movement deleted");
      setBillToDelete(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete movement");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (bill: Bill) => {
    setRestoring(true);

    try {
      const api = new CospendApi(link);
      await api.restoreBill(bill.id);
      toast.success("Movement restored");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore movement");
    } finally {
      setRestoring(false);
    }
  };

  const getMemberById = (id: number) => {
    return project?.members?.find((m) => m.id === id);
  };

  const getPayer = (bill: Bill) => {
    const raw = bill as any;
    const payerId = raw.payer_id || raw.payerId || raw.payer;
    return getMemberById(Number(payerId));
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

  const getPaidForNames = (bill: Bill) => {
    const raw = bill as any;

    const rawIds =
      raw.payed_for ||
      raw.payedFor ||
      raw.payed_for_ids ||
      raw.payedForIds ||
      raw.ower_ids ||
      raw.owers ||
      "";

    const idList = Array.isArray(rawIds)
      ? rawIds.map(Number)
      : String(rawIds)
          .split(",")
          .map((id) => Number(id.trim()))
          .filter(Boolean);

    return idList
      .map((id) => getMemberById(id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  const isPaidBackBill = (bill: Bill) => {
    const categoryName = getCategoryName(bill).toLowerCase();

    return (
      categoryName.includes("paid back") ||
      bill.what?.toLowerCase().includes("paid back")
    );
  };

  const visibleBills = bills.filter((bill) =>
    showDeleted ? Boolean(bill.deleted) : !bill.deleted
  );

  const filteredBills = visibleBills.filter((bill) => {
    const searchLower = search.toLowerCase();
    const payer = getPayer(bill);
    const categoryName = getCategoryName(bill);
    const paidForNames = getPaidForNames(bill);

    return (
      bill.what?.toLowerCase().includes(searchLower) ||
      bill.comment?.toLowerCase().includes(searchLower) ||
      payer?.name.toLowerCase().includes(searchLower) ||
      paidForNames.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower) ||
      bill.amount.toString().includes(searchLower)
    );
  });

  const currencySymbol = project?.currencyname || "€";

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 rounded-2xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
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

  return (
    <div className="min-h-dvh space-y-4 overflow-y-auto bg-slate-50 px-4 pt-5 pb-28">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-600">Activity</p>
          <h1 className="text-3xl font-bold tracking-tight">Movements</h1>
          <p className="text-sm text-slate-500">
            {filteredBills.length} {showDeleted ? "deleted" : "active"} movements
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={loadData}
          disabled={loading}
          className="rounded-2xl"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <Input
            placeholder="Search movements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-9"
          />
        </div>

        <Button
          type="button"
          variant={showDeleted ? "default" : "outline"}
          className="mt-3 h-11 w-full rounded-2xl"
          onClick={() => setShowDeleted(!showDeleted)}
        >
          {showDeleted ? "Show active movements" : "Show deleted movements"}
        </Button>
      </div>

      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm">
            {search
              ? "No movements match your search"
              : showDeleted
                ? "No deleted movements"
                : "No movements yet"}
          </div>
        ) : (
          filteredBills.map((bill) => {
            const payer = getPayer(bill);
            const paidForNames = getPaidForNames(bill);
            const categoryName = getCategoryName(bill);
            const isPaidBack = isPaidBackBill(bill);
            const date = new Date(bill.timestamp * 1000);

            const payerColor = payer
              ? `rgb(${payer.color.r}, ${payer.color.g}, ${payer.color.b})`
              : "#64748b";

            return (
              <Card
                key={bill.id}
                className={`rounded-3xl border shadow-sm transition ${
                  bill.deleted
                    ? "border-red-200 bg-red-50/50 opacity-70"
                    : isPaidBack
                      ? "border-green-200 bg-green-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                      style={{ backgroundColor: payerColor }}
                    >
                      {payer?.name?.charAt(0).toUpperCase() || "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {bill.what || "Untitled movement"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {payer?.name || "Unknown"} paid for{" "}
                            {paidForNames || "Unknown"} ·{" "}
                            {date.toLocaleDateString()}
                          </p>

                          {bill.comment && (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {bill.comment}
                            </p>
                          )}
                        </div>

                        <span
                          className={`shrink-0 text-lg font-bold ${
                            isPaidBack
                              ? "text-green-700"
                              : bill.deleted
                                ? "text-red-500"
                                : "text-blue-700"
                          }`}
                        >
                          {currencySymbol}
                          {Number(bill.amount || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {isPaidBack && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Paid Back
                          </span>
                        )}

                        {Boolean(categoryName) && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {categoryName}
                          </span>
                        )}

                        {bill.deleted && (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Deleted
                          </span>
                        )}
                      </div>
                    </div>

                    {bill.deleted ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-2xl"
                        onClick={() => handleRestore(bill)}
                        disabled={restoring}
                      >
                        <RotateCcw className="h-4 w-4 text-green-600" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 rounded-2xl"
                        onClick={() => setBillToDelete(bill)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog
        open={!!billToDelete}
        onOpenChange={(open) => !open && setBillToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete movement?</AlertDialogTitle>

            <AlertDialogDescription>
              This movement will be moved to deleted movements. You can restore it later.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-2xl bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}