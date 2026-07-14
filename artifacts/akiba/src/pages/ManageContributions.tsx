import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useListContributions, getListContributionsQueryKey,
  useRecordContribution, useInitiateMpesaPayment,
  useListMembers, getListMembersQueryKey,
  useGetChama, getGetChamaQueryKey,
  useListMpesaTransactions, getListMpesaTransactionsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Wallet, Search, Phone, RefreshCw, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHero } from "@/components/shared/PageHero";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

const contributionSchema = z.object({
  memberId: z.coerce.number().min(1, "Member is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.enum(["manual", "mpesa"]),
  mpesaRef: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export default function ManageContributions() {
  const params = useParams();
  const chamaId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: chama } = useGetChama(chamaId, { query: { enabled: !!chamaId, queryKey: getGetChamaQueryKey(chamaId) } });
  const { data: members } = useListMembers(chamaId, { query: { enabled: !!chamaId, queryKey: getListMembersQueryKey(chamaId) } });
  const { data: contributions, isLoading } = useListContributions(chamaId, { query: { enabled: !!chamaId, queryKey: getListContributionsQueryKey(chamaId) } });
  const { data: txns, isLoading: isTxLoading } = useListMpesaTransactions(chamaId, {
    query: {
      enabled: !!chamaId,
      queryKey: getListMpesaTransactionsQueryKey(chamaId),
      // Auto-refresh every 10s when there are pending STK push transactions
      refetchInterval: (data) => {
        const pending = (data as { status: string }[] | undefined)?.filter(t => t.status === "pending").length ?? 0;
        return pending > 0 ? 10000 : false;
      },
    }
  });

  const recordContribution = useRecordContribution();
  const initiateMpesa = useInitiateMpesaPayment();

  const form = useForm<z.infer<typeof contributionSchema>>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { amount: chama?.contributionAmount || 0, paymentMethod: "manual", mpesaRef: "", phoneNumber: "" },
  });

  const paymentMethod = form.watch("paymentMethod");

  const handleMemberChange = (val: string) => {
    const memId = parseInt(val, 10);
    form.setValue("memberId", memId);
    const member = members?.find(m => m.id === memId);
    if (member?.phoneNumber && !form.getValues("phoneNumber")) {
      form.setValue("phoneNumber", member.phoneNumber);
    }
  };

  const onSubmit = async (values: z.infer<typeof contributionSchema>) => {
    if (values.paymentMethod === "mpesa") {
      if (!values.phoneNumber) {
        form.setError("phoneNumber", { message: "Phone number is required for M-Pesa" });
        return;
      }
      initiateMpesa.mutate({
        data: {
          phoneNumber: values.phoneNumber,
          amount: values.amount,
          accountReference: `CHAMA-${chamaId}`,
          transactionDesc: "Chama Contribution",
          chamaId,
          memberId: values.memberId,
        }
      }, {
        onSuccess: () => {
          toast.success("M-Pesa prompt sent! The status will update automatically.");
          queryClient.invalidateQueries({ queryKey: getListContributionsQueryKey(chamaId) });
          queryClient.invalidateQueries({ queryKey: getListMpesaTransactionsQueryKey(chamaId) });
          setIsAddOpen(false);
          form.reset();
        },
        onError: () => toast.error("Failed to initiate M-Pesa payment")
      });
    } else {
      recordContribution.mutate({ chamaId, data: { memberId: values.memberId, amount: values.amount, mpesaRef: values.mpesaRef, status: "completed" } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContributionsQueryKey(chamaId) });
          toast.success("Contribution recorded successfully");
          setIsAddOpen(false);
          form.reset();
        },
        onError: () => toast.error("Failed to record contribution")
      });
    }
  };

  const filteredCont = contributions?.filter(c =>
    c.memberName.toLowerCase().includes(search.toLowerCase()) ||
    (c.mpesaRef && c.mpesaRef.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredTxns = txns?.filter(t =>
    t.type === "contribution" &&
    ((t.memberName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (t.mpesaReceiptNumber ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollected = contributions?.filter(c => c.status === "completed").reduce((s, c) => s + c.amount, 0) || 0;
  const pendingCount = txns?.filter(t => t.status === "pending" && t.type === "contribution").length || 0;
  const isAutoRefreshing = pendingCount > 0;

  return (
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1400&q=80&fit=crop"
        title="Contributions"
        subtitle={chama ? `${chama.name} — Track deposits and M-Pesa payments.` : "Track deposits and M-Pesa payments."}
        overlay="bg-gradient-to-r from-green-950/80 via-green-900/55 to-transparent"
      />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={`/chamas/${chamaId}`} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Chama
          </Link>

          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (open && chama?.contributionAmount) form.setValue("amount", chama.contributionAmount);
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Record Contribution</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record New Contribution</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="memberId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member</FormLabel>
                      <Select onValueChange={handleMemberChange} value={field.value?.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {members?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
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
                        <p className="text-xs text-muted-foreground mt-1">An STK prompt will be sent to this number.</p>
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
                    <Button type="submit" disabled={recordContribution.isPending || initiateMpesa.isPending}>
                      {paymentMethod === "mpesa" ? "Send M-Pesa Prompt" : "Save Record"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl overflow-hidden relative h-28">
            <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80&fit=crop" alt="M-Pesa" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-green-900/70 flex flex-col items-center justify-center text-white">
              <p className="text-xs font-medium opacity-80">Total Collected</p>
              <p className="text-2xl font-bold">KES {totalCollected.toLocaleString()}</p>
            </div>
          </div>
          <div className={`flex items-center gap-3 rounded-xl px-4 border h-28 ${pendingCount > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-muted/30 border-transparent"}`}>
            {isAutoRefreshing
              ? <Loader2 className="w-8 h-8 text-amber-500 shrink-0 animate-spin" />
              : <Clock className="w-8 h-8 text-muted-foreground shrink-0" />
            }
            <div>
              <p className="text-xs text-muted-foreground">{isAutoRefreshing ? "Awaiting M-Pesa" : "Pending"}</p>
              <p className={`text-2xl font-bold ${pendingCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}>{pendingCount}</p>
              {isAutoRefreshing && <p className="text-xs text-amber-500 mt-0.5">Auto-updating</p>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="relative h-full flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member or reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="contributions">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-4">
            <TabsTrigger value="contributions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-2 px-5 shadow-none">
              Contributions ({contributions?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="mpesa" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-2 px-5 shadow-none">
              M-Pesa Log ({txns?.filter(t => t.type === "contribution").length ?? 0})
              {pendingCount > 0 && (
                <span className="ml-1.5 bg-amber-400 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{pendingCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contributions" className="mt-0">
            <Card className="shadow-sm">
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center animate-pulse text-muted-foreground">Loading contributions...</div>
                ) : filteredCont && filteredCont.length > 0 ? (
                  <div className="divide-y">
                    <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/30">
                      <div className="col-span-4">Member</div>
                      <div className="col-span-3">Date</div>
                      <div className="col-span-3">Reference</div>
                      <div className="col-span-2 text-right">Amount / Status</div>
                    </div>
                    {filteredCont.map(c => (
                      <div key={c.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 transition-colors text-sm">
                        <div className="col-span-4 font-medium">{c.memberName}</div>
                        <div className="col-span-3 text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
                        <div className="col-span-3 font-mono text-xs">{c.mpesaRef || "-"}</div>
                        <div className="col-span-2 text-right">
                          <div className="font-semibold text-foreground mb-1">KES {c.amount.toLocaleString()}</div>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Wallet} title="No Contributions" description="No contributions found." />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mpesa" className="mt-0">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
                <div>
                  <CardTitle className="text-base">M-Pesa STK Push Log</CardTitle>
                  {isAutoRefreshing && (
                    <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Live — refreshes every 10s while payments are pending
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => queryClient.invalidateQueries({ queryKey: getListMpesaTransactionsQueryKey(chamaId) })}>
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isTxLoading ? (
                  <div className="p-8 text-center animate-pulse text-muted-foreground">Loading transactions...</div>
                ) : filteredTxns && filteredTxns.length > 0 ? (
                  <div className="divide-y">
                    <div className="grid grid-cols-12 gap-2 p-4 text-xs font-semibold text-muted-foreground bg-muted/30 uppercase tracking-wide">
                      <div className="col-span-3">Member</div>
                      <div className="col-span-2">Phone</div>
                      <div className="col-span-3">Receipt / ID</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2 text-right">Amount / Status</div>
                    </div>
                    {filteredTxns.map(tx => (
                      <div key={tx.id} className={`grid grid-cols-12 gap-2 p-4 items-center hover:bg-muted/20 transition-colors text-sm ${tx.status === "pending" ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
                        <div className="col-span-3 font-medium">{tx.memberName ?? "—"}</div>
                        <div className="col-span-2 text-xs text-muted-foreground font-mono">{tx.phoneNumber ?? "—"}</div>
                        <div className="col-span-3">
                          {tx.mpesaReceiptNumber
                            ? <span className="font-mono text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">{tx.mpesaReceiptNumber}</span>
                            : <span className="text-xs text-muted-foreground font-mono">{tx.checkoutRequestId?.slice(-12) ?? "—"}</span>
                          }
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</div>
                        <div className="col-span-2 text-right">
                          <div className="font-semibold mb-1">KES {tx.amount.toLocaleString()}</div>
                          <TxStatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Phone} title="No M-Pesa Transactions" description="STK Push transactions will appear here." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TxStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    completed: { cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: "Paid", icon: <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> },
    pending: { cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", label: "Pending", icon: <Clock className="w-3 h-3 inline mr-0.5" /> },
    failed: { cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", label: "Failed", icon: <XCircle className="w-3 h-3 inline mr-0.5" /> },
    cancelled: { cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "Cancelled", icon: <XCircle className="w-3 h-3 inline mr-0.5" /> },
    timeout: { cls: "bg-orange-100 text-orange-700", label: "Timed Out", icon: <Clock className="w-3 h-3 inline mr-0.5" /> },
    expired: { cls: "bg-gray-100 text-gray-600", label: "Expired", icon: null },
  };
  const v = map[status] ?? { cls: "bg-gray-100 text-gray-600", label: status, icon: null };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>
      {v.icon}{v.label}
    </span>
  );
}
