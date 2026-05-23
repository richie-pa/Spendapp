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
import { AlertCircle, Equal, SlidersHorizontal } from "lucide-react";
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
  const [customSplit, setCustomSplit] = useState(false);
  const [memberAmounts, setMemberAmounts] = useState<Record<number, string>>({});

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

  const payerId = parseInt(payer);

  const participants = customSplit
    ? activeMembers.filter((m) => selectedMembers.has(m.id))
    : forEveryone
      ? activeMembers
      : activeMembers.filter((m) => selectedMembers.has(m.id));

  if (participants.length === 0) {
    toast.error("Please select at least one participant");
    return;
  }

  setSubmitting(true);
  setError("");

  try {
    const api = new CospendApi(link);

    if (customSplit) {
      const expected = parseFloat(amount);
      const totalCustom = participants.reduce(
        (sum, m) => sum + parseFloat(memberAmounts[m.id] || "0"),
        0
      );

      if (Math.abs(totalCustom - expected) > 0.01) {
        toast.error("Custom split must equal total amount");
        setSubmitting(false);
        return;
      }

      for (const member of participants) {
        const share = parseFloat(memberAmounts[member.id] || "0");
        if (share <= 0) continue;

        await api.createBill({
          amount: share,
          what: `${what} - ${member.name}`,
          comment,
          payer: payerId,
          payedFor: member.id.toString(),
          categoryId,
          paymentModeId,
          repeat: "n",
          repeatAllActive: 0,
          repeatFreq: 1,
          repeatUntil: null,
          timestamp: Math.floor(Date.now() / 1000),
        });
      }
    } else {
      await api.createBill({
        amount: parseFloat(amount),
        what,
        comment,
        payer: payerId,
        payedFor: participants.map((m) => m.id).join(","),
        categoryId,
        paymentModeId,
        repeat: "n",
        repeatAllActive: 0,
        repeatFreq: 1,
        repeatUntil: null,
        timestamp: Math.floor(Date.now() / 1000),
      });
    }

    toast.success("Bill added successfully!");
    setAmount("");
    setWhat("");
    setComment("");
    setPayer("");
    setForEveryone(true);
    setCustomSplit(false);
    setMemberAmounts({});
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

  const updateMemberAmount = (memberId: number, value: string) => {
    setMemberAmounts((prev) => ({
      ...prev,
      [memberId]: value,
    }));
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
  <div className="rounded-2xl bg-muted p-1 grid grid-cols-2 gap-1">
    <Button
      type="button"
      variant={!customSplit ? "default" : "ghost"}
      className="rounded-xl"
      onClick={() => {
        setCustomSplit(false);
        setForEveryone(true);
      }}
    >
      Equal
    </Button>

    <Button
      type="button"
      variant={customSplit ? "default" : "ghost"}
      className="rounded-xl"
      onClick={() => {
        setCustomSplit(true);
        setForEveryone(false);
      }}
    >
      Custom
    </Button>
  </div>

  {!customSplit && (
    <div className="flex items-center justify-between rounded-2xl border bg-background p-4">
      <Label htmlFor="forEveryone" className="cursor-pointer">
        Split between all active members
      </Label>

      <Checkbox
        id="forEveryone"
        checked={forEveryone}
        onCheckedChange={(checked) => setForEveryone(checked as boolean)}
      />
    </div>
  )}

  {(!forEveryone || customSplit) && (
    <div className="space-y-3 pt-2">
      {activeMembers.map((member) => {
        const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;

        return (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-2xl border bg-background p-3"
          >
            <Checkbox
              id={`member-${member.id}`}
              checked={selectedMembers.has(member.id)}
              onCheckedChange={() => toggleMember(member.id)}
            />

            <Label
              htmlFor={`member-${member.id}`}
              className="flex items-center gap-3 cursor-pointer flex-1"
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: color }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>

              <span className="font-medium">{member.name}</span>
            </Label>

            {customSplit && selectedMembers.has(member.id) && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={memberAmounts[member.id] || ""}
                  onChange={(e) =>
                    updateMemberAmount(member.id, e.target.value)
                  }
                  className="w-24 text-right"
                />
                <span className="text-sm text-muted-foreground">
                  {currencySymbol}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
      <Button
          type="button"
          variant={!customSplit ? "default" : "outline"}
          onClick={() => setCustomSplit(false)}
        >
          <Equal className="h-4 w-4 mr-2" />
          Equal
        </Button>

        <Button
          type="button"
          variant={customSplit ? "default" : "outline"}
          onClick={() => setCustomSplit(true)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Custom
        </Button>
      </div>


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
                        {customSplit && (
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={memberAmounts[member.id] || ""}
                          onChange={(e) =>
                            updateMemberAmount(member.id, e.target.value)
                          }
                          className="w-24 ml-auto"
                        />
                      )}
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
