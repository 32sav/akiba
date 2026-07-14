import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetLoan, getGetLoanQueryKey,
  useUpdateLoan,
  useListRepayments, getListRepaymentsQueryKey,
  useRecordRepayment, useInitiateMpesaPayment,
  useGetMember, getGetMemberQueryKey,
  useListRepaymentPlan, getListRepaymentPlanQueryKey,
  useAddRepaymentPlanEntry,
  useUpdateRepaymentPlanEntry,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, Plus, History, CheckCircle, AlertCircle, Phone,
  CalendarClock, Pencil, Check, X, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHero } from "@/components/shared/PageHero";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const repaymentSchema = z.object({
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(["manual", "mpesa"]),
  mpesaRef: z.string().optional(),
  phoneNumber: z.string().optional(),
});

const planEntrySchema = z.object({
  plannedDate: z.string().min(1, "Date is required"),
  plannedAmount: z.coerce.number().min(1, "Amount must be greater than 0"),
  notes: z.string().optional(),
});

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  planned: { bg: "bg-blue-100", text: "text-blue-700", label: "Planned" },
  paid: { bg: "bg-green-100", text: "text-green-700", label: "Paid" },
  skipped: { bg: "bg-gray-100", text: "text-gray-500", label: "Skipped" },
};

export default function LoanDetail() {
  const params = useParams();
  const chamaId = parseInt(params.id || "0", 10);
  const loanId = parseInt(params.loanId || "0", 10);
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  const { data: loan, isLoading: isLoanLoading } = useGetLoan(chamaId, loanId, {
    query: { enabled: !!(chamaId && loanId), queryKey: getGetLoanQueryKey(chamaId, loanId) }
  });
  const { data: repayments, isLoading: isRepaymentsLoading } = useListRepayments(chamaId, loanId, {
    query: { enabled: !!(chamaId && loanId), queryKey: getListRepaymentsQueryKey(chamaId, loanId) }
  });
  const { data: member } = useGetMember(chamaId, loan?.memberId || 0, {
    query: { enabled: !!(chamaId && loan?.memberId), queryKey: getGetMemberQueryKey(chamaId, loan?.memberId || 0) }
  });
  const { data: planEntries, isLoading: isPlanLoading } = useListRepaymentPlan(chamaId, loanId, {
    query: { enabled: !!(chamaId && loanId), queryKey: getListRepaymentPlanQueryKey(chamaId, loanId) }
  });

  const recordRepayment = useRecordRepayment();
  const initiateMpesa = useInitiateMpesaPayment();
  const updateLoan = useUpdateLoan();
  const addPlanEntry = useAddRepaymentPlanEntry();
  const updatePlanEntry = useUpdateRepaymentPlanEntry();

  const remainingBalance = (loan?.totalDue || 0) - (loan?.totalRepaid || 0);
  const progressPercent = loan?.totalDue ? Math.min(100, Math.max(0, ((loan.totalRepaid || 0) / loan.totalDue) * 100)) : 0;

  const plannedTotal = planEntries?.reduce((sum, e) => sum + e.plannedAmount, 0) || 0;
  const plannedPaid = planEntries?.filter(e => e.status === "paid").reduce((sum, e) => sum + e.plannedAmount, 0) || 0;
  const planCoverage = remainingBalance > 0 ? Math.min(100, (plannedTotal / (loan?.totalDue || 1)) * 100) : 0;

  const form = useForm<z.infer<typeof repaymentSchema>>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: { amount: remainingBalance > 0 ? remainingBalance : 0, paymentMethod: "manual", mpesaRef: "", phoneNumber: "" },
  });

  const planForm = useForm<z.infer<typeof planEntrySchema>>({
    resolver: zodResolver(planEntrySchema),
    defaultValues: { plannedDate: "", plannedAmount: 0, notes: "" },
  });

  const paymentMethod = form.watch("paymentMethod");

  if (isAddOpen && !form.getValues("phoneNumber") && member?.phoneNumber) {
    form.setValue("phoneNumber", member.phoneNumber);
  }
  if (isAddOpen && form.getValues("amount") === 0 && remainingBalance > 0) {
    form.setValue("amount", remainingBalance);
  }

  const onSubmit = async (values: z.infer<typeof repaymentSchema>) => {
    if (values.paymentMethod === "mpesa") {
      if (!values.phoneNumber) { form.setError("phoneNumber", { message: "Phone number is required for M-Pesa" }); return; }
      initiateMpesa.mutate({
        data: { phoneNumber: values.phoneNumber, amount: values.amount, accountReference: `LOAN-${loanId}`, transactionDesc: "Loan Repayment" }
      }, {
        onSuccess: () => {
          toast.success("M-Pesa prompt sent. Recording as pending...");
          recordRepayment.mutate({ chamaId, loanId, data: { amount: values.amount } }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getListRepaymentsQueryKey(chamaId, loanId) });
              queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(chamaId, loanId) });
              setIsAddOpen(false); form.reset();
            }
          });
        },
        onError: () => toast.error("Failed to initiate M-Pesa payment")
      });
    } else {
      recordRepayment.mutate({ chamaId, loanId, data: { amount: values.amount, mpesaRef: values.mpesaRef } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRepaymentsQueryKey(chamaId, loanId) });
          queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(chamaId, loanId) });
          toast.success("Repayment recorded");
          setIsAddOpen(false); form.reset();
        },
        onError: () => toast.error("Failed to record repayment")
      });
    }
  };

  const onAddPlan = (values: z.infer<typeof planEntrySchema>) => {
    addPlanEntry.mutate({ chamaId, loanId, data: { ...values, notes: values.notes || undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRepaymentPlanQueryKey(chamaId, loanId) });
        toast.success("Installment added to plan");
        setIsPlanOpen(false);
        planForm.reset();
      },
      onError: () => toast.error("Failed to add installment"),
    });
  };

  const handlePlanStatus = (planId: number, status: "planned" | "paid" | "skipped") => {
    updatePlanEntry.mutate({ chamaId, loanId, planId, data: { status } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRepaymentPlanQueryKey(chamaId, loanId) });
        toast.success("Installment updated");
      },
      onError: () => toast.error("Failed to update installment"),
    });
  };

  const markAsDefaulted = () => {
    if (confirm("Are you sure you want to mark this loan as defaulted?")) {
      updateLoan.mutate({ chamaId, loanId, data: { status: "defaulted" } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(chamaId, loanId) }); toast.success("Loan marked as defaulted"); }
      });
    }
  };

  const markAsRepaid = () => {
    if (confirm("Manually close this loan as fully repaid?")) {
      updateLoan.mutate({ chamaId, loanId, data: { status: "repaid" } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(chamaId, loanId) }); toast.success("Loan marked as repaid"); }
      });
    }
  };

  if (isLoanLoading || !loan) {
    return (
      <div>
        <div className="h-40 bg-muted animate-pulse" />
        <div className="p-8 max-w-5xl mx-auto space-y-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const isOverdue = new Date(loan.dueDate) < new Date() && loan.status === "active";

  return (
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1400&q=80&fit=crop"
        title={`Loan — ${loan.memberName}`}
        subtitle={`${progressPercent.toFixed(0)}% repaid · Due ${new Date(loan.dueDate).toLocaleDateString()}${isOverdue ? " · ⚠️ Overdue" : ""}`}
        overlay="bg-gradient-to-r from-green-950/85 via-green-900/60 to-transparent"
      />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/chamas/${chamaId}/loans`} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Loans
            </Link>
            <StatusBadge status={loan.status} />
          </div>

          {loan.status === "active" && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Record Repayment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Repayment</DialogTitle></DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="bg-muted/50 p-3 rounded text-sm mb-4">
                      Remaining Balance: <span className="font-bold text-primary">KES {remainingBalance.toLocaleString()}</span>
                    </div>
                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (KES)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="manual">Manual Record (Cash/Bank)</SelectItem>
                            <SelectItem value="mpesa">M-Pesa STK Push (Auto)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    {paymentMethod === "mpesa" ? (
                      <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>M-Pesa Phone Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input className="pl-9" placeholder="2547XXXXXXXX" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    ) : (
                      <FormField control={form.control} name="mpesaRef" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number (Optional)</FormLabel>
                          <FormControl><Input placeholder="e.g. QWE123RTY" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    )}
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={recordRepayment.isPending || initiateMpesa.isPending}>
                        {paymentMethod === "mpesa" ? "Send M-Pesa Prompt" : "Save Repayment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Loan summary + history row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 shadow-sm overflow-hidden">
            <div className="relative h-24">
              <img
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&fit=crop"
                alt="Loan progress"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-green-950/75 flex items-center px-6 gap-6">
                <div>
                  <p className="text-white/70 text-xs">Repaid so far</p>
                  <p className="text-white font-bold text-2xl">KES {loan.totalRepaid?.toLocaleString() || 0}</p>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div>
                  <p className="text-white/70 text-xs">Total Due</p>
                  <p className="text-white font-bold text-2xl">KES {loan.totalDue?.toLocaleString()}</p>
                </div>
                <div className="h-10 w-px bg-white/20" />
                <div>
                  <p className="text-white/70 text-xs">Still Owes</p>
                  <p className="text-amber-300 font-bold text-2xl">KES {remainingBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="mb-4 space-y-2">
                <div className="flex justify-between items-end text-sm">
                  <span className="text-muted-foreground">{progressPercent.toFixed(1)}% Repaid</span>
                  <span className="text-muted-foreground">Balance: KES {remainingBalance.toLocaleString()}</span>
                </div>
                <Progress value={progressPercent} className="h-3 bg-muted" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Principal</p>
                  <p className="font-semibold mt-1">KES {loan.principal.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Interest Rate</p>
                  <p className="font-semibold mt-1">{loan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className={`font-semibold mt-1 ${isOverdue ? "text-red-600" : "text-amber-600"}`}>
                    {new Date(loan.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disbursed</p>
                  <p className="font-semibold mt-1">{loan.disbursedAt ? new Date(loan.disbursedAt).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>

              {loan.notes && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm bg-muted/50 p-3 rounded">{loan.notes}</p>
                </div>
              )}

              {loan.status === "active" && (
                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={markAsRepaid} className="text-green-600 border-green-200 hover:bg-green-50">
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Full Repaid
                  </Button>
                  <Button variant="outline" size="sm" onClick={markAsDefaulted} className="text-red-600 border-red-200 hover:bg-red-50">
                    <AlertCircle className="w-4 h-4 mr-2" /> Mark Defaulted
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Repayment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isRepaymentsLoading ? (
                <div className="p-6 text-center text-muted-foreground animate-pulse">Loading history...</div>
              ) : repayments && repayments.length > 0 ? (
                <div className="divide-y">
                  {repayments.map(r => (
                    <div key={r.id} className="p-4 flex justify-between items-center hover:bg-muted/20">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                          <History className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">KES {r.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(r.paidAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {r.mpesaRef && (
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{r.mpesaRef}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <EmptyState icon={History} title="No Repayments" description="No repayments recorded yet." />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* What I Owe + Repayment Plan */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingDown className="w-5 h-5 text-amber-500" />
                What {loan.memberName} Owes & Payment Plan
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Outstanding balance and how the member plans to settle it.
              </p>
            </div>
            {loan.status === "active" && (
              <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 shrink-0">
                    <Plus className="w-3.5 h-3.5" /> Add Installment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Planned Installment</DialogTitle></DialogHeader>
                  <Form {...planForm}>
                    <form onSubmit={planForm.handleSubmit(onAddPlan)} className="space-y-4">
                      <div className="bg-amber-50 border border-amber-100 rounded p-3 text-sm">
                        Remaining balance: <span className="font-bold text-amber-700">KES {remainingBalance.toLocaleString()}</span>
                      </div>
                      <FormField control={planForm.control} name="plannedDate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Planned Payment Date</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={planForm.control} name="plannedAmount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount (KES)</FormLabel>
                          <FormControl><Input type="number" placeholder="e.g. 5000" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={planForm.control} name="notes" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl><Textarea placeholder="e.g. Will pay from salary" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsPlanOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={addPlanEntry.isPending}>
                          {addPlanEntry.isPending ? "Adding..." : "Add Installment"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Outstanding balance summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs text-amber-600 font-medium uppercase tracking-wide mb-1">Still Owes</p>
                <p className="text-2xl font-bold text-amber-700">KES {remainingBalance.toLocaleString()}</p>
                <p className="text-xs text-amber-600 mt-1">of KES {loan.totalDue?.toLocaleString()} total</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Planned in Schedule</p>
                <p className="text-2xl font-bold text-blue-700">KES {plannedTotal.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-1">across {planEntries?.length || 0} installment{(planEntries?.length || 0) !== 1 ? "s" : ""}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Paid via Plan</p>
                <p className="text-2xl font-bold text-green-700">KES {plannedPaid.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">{planEntries?.filter(e => e.status === "paid").length || 0} installment{(planEntries?.filter(e => e.status === "paid").length || 0) !== 1 ? "s" : ""} marked paid</p>
              </div>
            </div>

            {/* Plan coverage bar */}
            {(planEntries?.length || 0) > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Plan coverage</span>
                  <span>{planCoverage.toFixed(0)}% of total loan covered</span>
                </div>
                <Progress value={planCoverage} className="h-2" />
              </div>
            )}

            {/* Plan entries */}
            {isPlanLoading ? (
              <div className="text-center text-muted-foreground animate-pulse py-4">Loading plan...</div>
            ) : planEntries && planEntries.length > 0 ? (
              <div className="divide-y border rounded-xl overflow-hidden">
                {planEntries.map((entry) => {
                  const st = STATUS_STYLES[entry.status] || STATUS_STYLES.planned;
                  const isPast = new Date(entry.plannedDate) < new Date() && entry.status === "planned";
                  return (
                    <div key={entry.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isPast ? "bg-red-50/60" : "hover:bg-muted/20"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${st.bg} ${st.text}`}>
                          <CalendarClock className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold">KES {entry.plannedAmount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
                              {st.label}
                            </span>
                            {isPast && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Overdue</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(entry.plannedDate).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                            {entry.notes && ` · ${entry.notes}`}
                          </p>
                        </div>
                      </div>
                      {loan.status === "active" && entry.status !== "paid" && (
                        <div className="flex gap-1.5 self-end sm:self-auto">
                          <Button
                            size="sm" variant="outline"
                            className="h-7 text-green-600 border-green-200 hover:bg-green-50 text-xs gap-1"
                            onClick={() => handlePlanStatus(entry.id, "paid")}
                            disabled={updatePlanEntry.isPending}
                          >
                            <Check className="w-3 h-3" /> Mark Paid
                          </Button>
                          {entry.status === "planned" && (
                            <Button
                              size="sm" variant="outline"
                              className="h-7 text-gray-500 border-gray-200 hover:bg-gray-50 text-xs gap-1"
                              onClick={() => handlePlanStatus(entry.id, "skipped")}
                              disabled={updatePlanEntry.isPending}
                            >
                              <X className="w-3 h-3" /> Skip
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="border rounded-xl">
                <EmptyState
                  icon={Pencil}
                  title="No Payment Plan Yet"
                  description={loan.status === "active"
                    ? `Add planned installments to show how ${loan.memberName} intends to repay KES ${remainingBalance.toLocaleString()}.`
                    : "No repayment plan was set for this loan."
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
