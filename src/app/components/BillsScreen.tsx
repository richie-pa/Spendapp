import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Bill, Member, Project } from "../types/cospend";
import { Card, CardContent } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { AlertCircle, Search, Trash2, RefreshCw } from "lucide-react";
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);
      const [billsData, projectData] = await Promise.all([
        api.getBills(),
        api.getProject(),
      ]);

      setBills(billsData.filter((b) => !b.deleted).sort((a, b) => b.timestamp - a.timestamp));
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bills");
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
      toast.success("Bill deleted successfully");
      setBillToDelete(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete bill");
    } finally {
      setDeleting(false);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const searchLower = search.toLowerCase();
    const payer = project?.members?.find((m) => m.id === bill.payer_id);
    return (
      bill.what.toLowerCase().includes(searchLower) ||
      bill.comment.toLowerCase().includes(searchLower) ||
      payer?.name.toLowerCase().includes(searchLower) ||
      bill.amount.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
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

  const currencySymbol = project?.currencyname || "€";

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">Bills</h1>
          <p className="text-muted-foreground">{bills.length} total bills</p>
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filteredBills.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search ? "No bills match your search" : "No bills yet"}
          </div>
        ) : (
          filteredBills.map((bill) => {
            const payer = project?.members?.find((m) => m.id === bill.payer_id);
            const payerColor = payer
              ? `rgb(${payer.color.r}, ${payer.color.g}, ${payer.color.b})`
              : "#666";
            const date = new Date(bill.timestamp * 1000);

            return (
              <Card key={bill.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: payerColor }}
                    >
                      {payer?.name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg">{bill.what}</h3>
                        <span className="font-bold text-lg text-primary shrink-0">
                          {currencySymbol}
                          {bill.amount.toFixed(2)}
                        </span>
                      </div>
                      {bill.comment && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {bill.comment}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span>{payer?.name || "Unknown"} paid</span>
                        <span>•</span>
                        <span>{date.toLocaleDateString()}</span>
                      </div>
                      {bill.owers && bill.owers.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          <span className="text-sm text-muted-foreground">For:</span>
                          {bill.owers.map((ower) => (
                            <span
                              key={ower.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted"
                            >
                              {ower.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setBillToDelete(bill)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!billToDelete} onOpenChange={() => setBillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{billToDelete?.what}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
