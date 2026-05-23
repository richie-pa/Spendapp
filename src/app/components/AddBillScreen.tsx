import { useEffect, useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Member, Project, Category, PaymentMode } from "../types/cospend";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";

interface AddBillScreenProps {
  link: CospendLink;
  onBillAdded: () => void;
}

export function AddBillScreen({ link, onBillAdded }: AddBillScreenProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [what, setWhat] = useState("");
  const [comment, setComment] = useState("");
  const [payer, setPayer] = useState("");
  const [forEveryone, setForEveryone] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [paymentModeId, setPaymentModeId] = useState<number | undefined>();

  useEffect(() => {
    loadProject();
  }, []);

  const loadProject = async () => {
    setLoading(true);
    setError("");

    try {
      const api = new CospendApi(link);
      const data = await api.getProject();
      setProject(data);

      const activeMembers = data.members?.filter((m) => m.activated) || [];
      setSelectedMembers(new Set(activeMembers.map((m) => m.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payer) {
      toast.error("Please select who paid");
      return;
    }

    const participants = forEveryone
      ? project?.members?.filter((m) => m.activated).map((m) => m.id) || []
      : Array.from(selectedMembers);

    if (participants.length === 0) {
      toast.error("Please select at least one participant");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const api = new CospendApi(link);
      await api.createBill({
        amount: parseFloat(amount),
        what,
        comment,
        payer: parseInt(payer),
        payedFor: participants.join(","),
        categoryId,
        paymentModeId,
        repeat: "n",
        repeatAllActive: 0,
        repeatFreq: 1,
        repeatUntil: null,
        timestamp: Math.floor(Date.now() / 1000),
      });

      toast.success("Bill added successfully!");
      setAmount("");
      setWhat("");
      setComment("");
      setPayer("");
      setForEveryone(true);
      setCategoryId(undefined);
      setPaymentModeId(undefined);
      onBillAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMember = (memberId: number) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const activeMembers = project?.members?.filter((m) => m.activated) || [];
  const currencySymbol = project?.currencyname || "€";

  return (
    <div className="min-h-screen overflow-y-auto p-4 space-y-6 pb-40">
      <div>
        <h1 className="text-3xl font-bold">Add Bill</h1>
        <p className="text-muted-foreground">Record a new expense</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({currencySymbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="what">Description</Label>
              <Input
                id="what"
                type="text"
                placeholder="Dinner, groceries, etc."
                value={what}
                onChange={(e) => setWhat(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Additional details..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payer">Who Paid?</Label>
              <Select value={payer} onValueChange={setPayer}>
                <SelectTrigger id="payer">
                  <SelectValue placeholder="Select payer" />
                </SelectTrigger>
                <SelectContent>
                  {activeMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {project?.categories && project.categories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="category">Category (optional)</Label>
                <Select
                  value={categoryId?.toString()}
                  onValueChange={(v) => setCategoryId(parseInt(v))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {project.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {project?.paymentmodes && project.paymentmodes.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Payment Mode (optional)</Label>
                <Select
                  value={paymentModeId?.toString()}
                  onValueChange={(v) => setPaymentModeId(parseInt(v))}
                >
                  <SelectTrigger id="paymentMode">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {project.paymentmodes.map((mode) => (
                      <SelectItem key={mode.id} value={mode.id.toString()}>
                        {mode.icon} {mode.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="forEveryone"
                checked={forEveryone}
                onCheckedChange={(checked) => setForEveryone(checked as boolean)}
              />
              <Label htmlFor="forEveryone" className="cursor-pointer">
                Split between all active members
              </Label>
            </div>

            {!forEveryone && (
              <div className="space-y-3 pt-2">
                {activeMembers.map((member) => {
                  const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;
                  return (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <Label
                        htmlFor={`member-${member.id}`}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: color }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{member.name}</span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
  type="submit"
  className="w-full sticky bottom-24 z-20"
  size="lg"
  disabled={submitting}
>
          {submitting ? "Adding Bill..." : "Add Bill"}
        </Button>
      </form>
    </div>
  );
}
