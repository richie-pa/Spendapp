import { useEffect, useState } from "react";
import { notifySplitCloud } from "../lib/notifications";
import { storage } from "../lib/storage";
import { CospendApi } from "../lib/cospend-api";
import type { CospendLink, Member, Project } from "../types/cospend";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { AlertCircle, Equal, SlidersHorizontal, CheckCircle2 } from "lucide-react";
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
  const [formMode, setFormMode] = useState<"bill" | "payback">("bill");
  const [forEveryone, setForEveryone] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [paymentModeId, setPaymentModeId] = useState<number | undefined>();
  const [customSplit, setCustomSplit] = useState(false);
  const [memberAmounts, setMemberAmounts] = useState<Record<number, string>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [markAsPaidBack, setMarkAsPaidBack] = useState(false);
  const [receiver, setReceiver] = useState("");


  useEffect(() => {
    loadProject();
  }, []);

  const activeMembers = project?.members?.filter((m) => m.activated) || [];
  const currencySymbol = project?.currencyname || "€";
  const selectedMemberList = activeMembers.filter((m) => selectedMembers.has(m.id));
  const totalAmount = parseFloat(amount || "0");
  const customTotal = selectedMemberList.reduce(
    (sum, m) => sum + parseFloat(memberAmounts[m.id] || "0"),
    0
  );
  const remaining = totalAmount - customTotal;
  const equalShare =
    selectedMemberList.length > 0 ? totalAmount / selectedMemberList.length : 0;
  const splitStateTone =
    Math.abs(remaining) < 0.01
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : remaining > 0
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

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

 const paidBackCategory = project?.categories?.find((cat) =>
  cat.name.toLowerCase().includes("paid back")
);

const effectiveCategoryId = markAsPaidBack
  ? paidBackCategory?.id
  : categoryId;

const getActorName = () => {
  const currentMemberId = storage.getCurrentMember();

  return (
    activeMembers.find((m) => m.id === currentMemberId)?.name ||
    activeMembers.find((m) => m.id === Number(payer))?.name ||
    "Someone"
  );
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!payer) {
    toast.error(
      formMode === "payback"
        ? "Please select who paid back"
        : "Please select who paid"
    );
    return;
  }

  if (!amount || parseFloat(amount) <= 0) {
    toast.error("Please enter a valid amount");
    return;
  }

  const payerId = parseInt(payer);

  setSubmitting(true);
  setError("");

  try {
    const api = new CospendApi(link);

    // PAY BACK MODE
    if (formMode === "payback") {
      if (!receiver) {
        toast.error("Please select who received the payback");
        setSubmitting(false);
        return;
      }

      if (receiver === payer) {
        toast.error("Payer and receiver cannot be the same person");
        setSubmitting(false);
        return;
      }

      if (!paidBackCategory?.id) {
        toast.error("Paid Back category was not found");
        setSubmitting(false);
        return;
      }

    await api.createBill({
      amount: parseFloat(amount),
      what: what || "Paid back",
      comment,
      payer: payerId,
      payedFor: receiver,
      categoryId: paidBackCategory.id,
      paymentModeId: paymentModeId || 0,
      repeat: "n",
      repeatAllActive: 0,
      repeatFreq: 1,
      repeatUntil: null,
      timestamp: Math.floor(Date.now() / 1000),
    });


    const payerName =
      activeMembers.find((m) => m.id === payerId)?.name || "Someone";

    const receiverName =
      activeMembers.find((m) => m.id === Number(receiver))?.name || "Someone";

    await notifySplitCloud({
      projectId: link.token,
      actor: payerName,
      title: "💸 Payback added",
      body: `${payerName} paid back ${receiverName} ${currencySymbol}${parseFloat(amount).toFixed(2)}`,
    });

      toast.success("Payback added successfully!");

      setAmount("");
      setWhat("");
      setComment("");
      setPayer("");
      setReceiver("");
      setCategoryId(undefined);
      setPaymentModeId(undefined);
      setMarkAsPaidBack(false);

      onBillAdded();
      return;
    }

    // NORMAL BILL MODE
    const participants = selectedMemberList;

    if (participants.length === 0) {
      toast.error("Please select at least one participant");
      setSubmitting(false);
      return;
    }

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
          categoryId: effectiveCategoryId || 0,
          paymentModeId: paymentModeId || 0,
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
        categoryId: categoryId || 0,
        paymentModeId: paymentModeId || 0,
        repeat: "n",
        repeatAllActive: 0,
        repeatFreq: 1,
        repeatUntil: null,
        timestamp: Math.floor(Date.now() / 1000),
      });

        const payerName =
          activeMembers.find((m) => m.id === payerId)?.name || "Someone";

        await notifySplitCloud({
          projectId: link.token,
          actor: payerName,
          title: "🧾 New bill added",
          body: `${payerName} added ${what || "a bill"} for ${currencySymbol}${parseFloat(amount).toFixed(2)}`,
        });

    toast.success("Bill added successfully!");

    setAmount("");
    setWhat("");
    setComment("");
    setPayer("");
    setReceiver("");
    setForEveryone(false);
    setCustomSplit(false);
    setMemberAmounts({});
    setCategoryId(undefined);
    setMarkAsPaidBack(false);
    setPaymentModeId(undefined);

    onBillAdded();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : formMode === "payback"
          ? "Failed to create payback"
          : "Failed to create bill"
    );
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

  return (
    <div className="min-h-dvh overflow-y-auto bg-slate-50 px-4 pt-5 pb-28 space-y-5">
      <div className="space-y-1">

        <p className="text-sm font-semibold text-blue-600">
  {formMode === "payback" ? "Money returned" : "New expense"}
</p>

<h1 className="text-3xl font-bold tracking-tight">
  {formMode === "payback" ? "Pay Back" : "Add Bill"}
</h1>

<p className="text-sm text-slate-500">
  {formMode === "payback"
    ? "Record money paid back between two people."
    : "Record a new expense with a clean mobile flow."}
</p>

         </div>
      

      <form onSubmit={handleSubmit} className="space-y-5">

<div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
  <Button
    type="button"
    variant={formMode === "bill" ? "default" : "ghost"}
    className="rounded-xl"
    onClick={() => {
      setFormMode("bill");
      setMarkAsPaidBack(false);
    }}
  >
    Add Bill
  </Button>

  <Button
    type="button"
    variant={formMode === "payback" ? "default" : "ghost"}
    className="rounded-xl"
    onClick={() => {
      setFormMode("payback");
      setMarkAsPaidBack(true);
      setCustomSplit(false);
      setForEveryone(false);
      setMemberAmounts({});
    }}
  >
    Pay Back
  </Button>
</div>



<Card className="rounded-[2rem] border border-slate-200/70 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
  <CardHeader className="space-y-1 border-b border-slate-100 px-5 pb-4 pt-5">
<CardTitle>
  {formMode === "payback" ? "Pay Back Details" : "Bill Details"}
</CardTitle>

  <CardDescription>
      {formMode === "payback"
        ? "Choose who paid back whom and how much."
        : "Add expense information"}
  </CardDescription>
  </CardHeader>

  <CardContent className="space-y-5 p-5">
    <div className="space-y-2">
      <Label htmlFor="amount">
        Amount ({currencySymbol})
      </Label>

      <Input
        id="amount"
        type="number"
        step="0.01"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        className="h-16 rounded-2xl border-slate-200 bg-slate-50 px-4 text-3xl font-bold shadow-inner focus:bg-white"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="what">
        Description
      </Label>

      <Input
        id="what"
        type="text"
        placeholder="Dinner, groceries, taxi..."
        value={what}
        onChange={(e) => setWhat(e.target.value)}
        required
        className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 text-base shadow-inner focus:bg-white"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="comment">
        Comment{" "}
        <span className="text-muted-foreground">
          (optional)
        </span>
      </Label>

      <Textarea
        id="comment"
        placeholder="Add context, receipts or notes..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="min-h-24 rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-base shadow-inner focus:bg-white resize-none"
      />
    </div>

    <div className="space-y-2">
      <Label htmlFor="payer">
        Who paid?
      </Label>

      <Select
        value={payer}
        onValueChange={setPayer}
      >
        <SelectTrigger
          id="payer"
          className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 shadow-inner"
        >
          <SelectValue placeholder="Select payer" />
        </SelectTrigger>

        <SelectContent className="rounded-2xl border-slate-200">
          {activeMembers.map((member) => (
            <SelectItem
              key={member.id}
              value={member.id.toString()}
              className="rounded-xl"
            >
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {formMode === "payback" && (
  <div className="space-y-2">
    <Label htmlFor="receiver">Paid to</Label>

    <Select value={receiver} onValueChange={setReceiver}>
      <SelectTrigger
        id="receiver"
        className="h-14 rounded-2xl border-slate-200 bg-slate-50 px-4 shadow-inner"
      >
        <SelectValue placeholder="Select receiver" />
      </SelectTrigger>

      <SelectContent className="rounded-2xl border-slate-200">
        {activeMembers.map((member) => (
          <SelectItem key={member.id} value={member.id.toString()}>
            {member.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)}

    {formMode === "bill" && (
      <>
        <Button
          type="button"
          variant="ghost"
          className="w-full h-12 rounded-2xl justify-between bg-blue-50 text-blue-700 hover:bg-blue-100"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Advanced options

          <span className="text-lg">
            {showAdvanced ? "−" : "+"}
          </span>
        </Button>

        {showAdvanced && (
          <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-sm">
            {/* advanced content */}
          </Card>
        )}
      </>
    )}

    {showAdvanced && (
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
        {project?.categories &&
          project.categories.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="category">
                Category
              </Label>

              <Select
                value={categoryId?.toString()}
                onValueChange={(v) =>
                  setCategoryId(parseInt(v))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>

                <SelectContent className="rounded-2xl border-slate-200">
                  {project.categories
            .filter((cat) => !cat.name.toLowerCase().includes("paid back"))
            .map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id.toString()}
                    >
                      {cat.icon
                        ? `${cat.icon} `
                        : ""}
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        {project?.paymentmodes &&
          project.paymentmodes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="paymentMode">
                Payment method
              </Label>

              <Select
                value={paymentModeId?.toString()}
                onValueChange={(v) =>
                  setPaymentModeId(parseInt(v))
                }
              >
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>

                <SelectContent className="rounded-2xl border-slate-200">
                  {project.paymentmodes.map((mode) => (
                    <SelectItem
                      key={mode.id}
                      value={mode.id.toString()}
                    >
                      {mode.icon
                        ? `${mode.icon} `
                        : ""}
                      {mode.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
      </div>
    )}
  </CardContent>
</Card>

      {formMode === "bill" && (
        <Card className="rounded-3xl border-0 bg-white shadow-sm">          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-xl">Participants</CardTitle>
            <p className="text-sm text-muted-foreground">Choose equal or custom split, then tap the people involved.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] bg-slate-100 p-1">
             <Button
              type="button"
              variant={!customSplit ? "default" : "ghost"}
              className="h-12 rounded-[1.1rem] font-semibold"
              onClick={() => {
                setCustomSplit(false);
                setForEveryone(false);
                setMemberAmounts({});

              }}
            >
              <Equal className="mr-2 h-4 w-4" />
              Equal
            </Button>

              <Button
                type="button"
                variant={customSplit ? "default" : "ghost"}
                className="h-12 rounded-[1.1rem] font-semibold"
                onClick={() => {
                  setCustomSplit(true);
                  setForEveryone(false);
                }}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Custom
              </Button>
            </div>

            {customSplit ? (
  <div className={`rounded-3xl border p-4 shadow-sm transition-all duration-200 ${splitStateTone}`}>
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">Assigned</span>
      <strong>
        {currencySymbol}{customTotal.toFixed(2)}
      </strong>
    </div>

    <div className="mt-2 flex items-center justify-between text-sm">
      <span className="font-medium">Remaining</span>
      <strong>
        {currencySymbol}{remaining.toFixed(2)}
      </strong>
    </div>
  </div>
) : (
  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
    <p className="text-sm font-medium">
      Equal split preview
    </p>
    <p className="mt-1 text-xl font-bold">
      {currencySymbol}{equalShare.toFixed(2)}
      <span className="ml-1 text-sm font-normal text-slate-500">
        per selected person
      </span>
    </p>
  </div>
)}

            <div className="space-y-3 pt-1">
              {activeMembers.map((member) => {
                const color = `rgb(${member.color.r}, ${member.color.g}, ${member.color.b})`;
                const isSelected = selectedMembers.has(member.id);

                return (
                  <div
                    key={member.id}
                    className={`group rounded-3xl border p-4 transition-all duration-200 ${isSelected ? "border-blue-200 bg-white shadow-sm shadow-blue-100/70" : "border-slate-200 bg-slate-50/80 opacity-70"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleMember(member.id)}
                      />

                      <Label
                        htmlFor={`member-${member.id}`}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                      >
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm transition-transform duration-200 group-hover:scale-105"
                          style={{ backgroundColor: color }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="truncate font-medium text-slate-900">{member.name}</div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />}
                          </div>
                          {customSplit ? (
                            isSelected ? (
                              <p className="text-xs text-slate-500">Enter the custom amount for this person.</p>
                            ) : (
                              <p className="text-xs text-slate-400">Tap to include in the split.</p>
                            )
                          ) : (
                            isSelected && (
                              <p className="text-xs text-slate-500">
                                Equal share preview: {currencySymbol}{equalShare.toFixed(2)}
                              </p>
                            )
                          )}
                        </div>
                      </Label>

                      {customSplit && isSelected ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={memberAmounts[member.id] || ""}
                            onChange={(e) => updateMemberAmount(member.id, e.target.value)}
                            className="h-12 w-24 rounded-2xl bg-white text-right"
                            inputMode="decimal"
                          />
                          <span className="text-sm font-medium text-slate-500">{currencySymbol}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}

        {error && (
          <Alert variant="destructive" className="rounded-3xl border-0 shadow-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="h-12 w-full rounded-2xl bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/25 transition-transform duration-200 active:scale-[0.99]"
          size="lg"
          disabled={submitting}
        >
          {submitting ? "Adding Bill..." : "Add Bill"}
        </Button>
      </form>
    </div>
  );
}
