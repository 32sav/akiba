import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetChama, getGetChamaQueryKey,
  useGetChamaSummary, getGetChamaSummaryQueryKey,
  useListMembers, getListMembersQueryKey,
  useListContributions, getListContributionsQueryKey,
  useListLoans, getListLoansQueryKey,
  useListMpesaTransactions, getListMpesaTransactionsQueryKey,
  useDisburseB2cPayout,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Wallet, FileText, ArrowUpRight, ArrowDownRight,
  Activity, PlusCircle, Settings, ChevronLeft, SendHorizonal,
  CheckCircle2, Clock, XCircle, Phone, RefreshCw
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHero } from "@/components/shared/PageHero";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as z from "zod";

const disburseSchema = z.object({
  memberId: z.coerce.number().min(1, "Member is required"),
  phoneNumber: z.string().min(9, "Phone number is required"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  roundNumber: z.coerce.number().min(1, "Round number is required"),
});

export default function ChamaDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);

  const { data: chama, isLoading: isChamaLoading } = useGetChama(id, {
    query: { enabled: !!id, queryKey: getGetChamaQueryKey(id) }
  });
  const { data: summary, isLoading: isSummaryLoading } = useGetChamaSummary(id, {
    query: { enabled: !!id, queryKey: getGetChamaSummaryQueryKey(id) }
  });
  const { data: members, isLoading: isMembersLoading } = useListMembers(id, {
    query: { enabled: !!id, queryKey: getListMembersQueryKey(id) }
  });
  const { data: contributions, isLoading: isContLoading } = useListContributions(id, {
    query: { enabled: !!id, queryKey: getListContributionsQueryKey(id) }
  });
  const { data: loans, isLoading: isLoansLoading } = useListLoans(id, {
    query: { enabled: !!id, queryKey: getListLoansQueryKey(id) }
  });
  const { data: txns, isLoading: isTxLoading } = useListMpesaTransactions(id, {
    query: { enabled: !!id, queryKey: getListMpesaTransactionsQueryKey(id) }
  });

  const disburse = useDisburseB2cPayout();

  const form = useForm<z.infer<typeof disburseSchema>>({
    resolver: zodResolver(disburseSchema),
    defaultValues: { amount: 0, roundNumber: 1, phoneNumber: "" },
  });

  const handleMemberChange = (val: string) => {
    const memId = parseInt(val, 10);
    form.setValue("memberId", memId);
    const member = members?.find(m => m.id === memId);
    if (member?.phoneNumber) form.setValue("phoneNumber", member.phoneNumber);
  };

  const onDisburse = (values: z.infer<typeof disburseSchema>) => {
    disburse.mutate({
      data: {
        chamaId: id,
        memberId: values.memberId,
        phoneNumber: values.phoneNumber,
        amount: values.amount,
        roundNumber: values.roundNumber,
      }
    }, {
      onSuccess: () => {
        toast.success("Payout queued! Safaricom will process the transfer shortly.");
        queryClient.invalidateQueries({ queryKey: getListMpesaTransactionsQueryKey(id) });
        setIsDisburseOpen(false);
        form.reset();
      },
      onError: () => toast.error("Failed to initiate B2C payout"),
    });
  };

  if (isChamaLoading || !chama) {
    return (
      <div className="animate-pulse">
        <div className="h-48 bg-muted" />
        <div className="p-8 max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
          </div>
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1400&q=80&fit=crop"
        title={chama.name}
        subtitle={chama.description || `${chama.meetingFrequency} contributions · KES ${chama.contributionAmount.toLocaleString()}`}
        height="h-48"
        overlay="bg-gradient-to-r from-green-950/85 via-green-900/60 to-transparent"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href="/chamas" className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Chamas
          </Link>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => { setIsDisburseOpen(true); if (chama?.contributionAmount && members?.length) form.setValue("amount", chama.contributionAmount * members.length); }}
            >
              <SendHorizonal className="w-4 h-4" /> Disburse Payout
            </Button>
            <Link href={`/chamas/${id}/members`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" /> Manage Members
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" /> Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Savings</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-foreground">
                  KES {summary?.totalSavings.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Loaned</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-amber-600">
                  KES {summary?.totalLoaned.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Repaid</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-green-600">
                  KES {summary?.totalRepaid.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-sm bg-primary text-primary-foreground border-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-primary-foreground/80">Active Loans</CardTitle>
              <Activity className="h-4 w-4 text-primary-foreground/80" />
            </CardHeader>
            <CardContent>
              {isSummaryLoading ? <div className="h-8 w-12 bg-primary-foreground/20 rounded" /> : (
                <div className="text-2xl font-bold">{summary?.activeLoanCount || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 shadow-none">Overview</TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 shadow-none">Members ({members?.length || 0})</TabsTrigger>
            <TabsTrigger value="contributions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 shadow-none">Contributions</TabsTrigger>
            <TabsTrigger value="loans" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 shadow-none">Loans</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3 px-6 shadow-none">
              M-Pesa {txns && txns.length > 0 ? `(${txns.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Recent Contributions</CardTitle>
                  <Link href={`/chamas/${id}/contributions`} className="text-sm text-primary hover:underline">View all</Link>
                </CardHeader>
                <CardContent>
                  {isSummaryLoading ? (
                    <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                  ) : summary?.recentContributions && summary.recentContributions.length > 0 ? (
                    <div className="space-y-4">
                      {summary.recentContributions.map(c => (
                        <div key={c.id} className="flex justify-between items-center py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{c.memberName}</p>
                            <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">KES {c.amount.toLocaleString()}</p>
                            <StatusBadge status={c.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-sm">No recent contributions</div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm overflow-hidden">
                <div className="relative h-24">
                  <img
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&fit=crop"
                    alt="Chama info"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-green-900/70 flex items-center px-6">
                    <p className="text-white font-semibold text-lg">Chama Information</p>
                  </div>
                </div>
                <CardContent className="p-6">
                  <dl className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Meeting Frequency</dt>
                      <dd className="font-medium capitalize">{chama.meetingFrequency}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Contribution Target</dt>
                      <dd className="font-medium">KES {chama.contributionAmount.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Bank / Paybill</dt>
                      <dd className="font-medium">{chama.bankAccount || "Not set"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="font-medium">{new Date(chama.createdAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="mt-0 outline-none">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
                <CardTitle className="text-lg">Member List</CardTitle>
                <Link href={`/chamas/${id}/members`}>
                  <Button size="sm" className="gap-2"><PlusCircle className="w-4 h-4" /> Add Member</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {isMembersLoading ? (
                  <div className="p-4 space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                ) : members && members.length > 0 ? (
                  <div className="divide-y">
                    {members.map(member => (
                      <div key={member.id} className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.phoneNumber}</p>
                          </div>
                        </div>
                        <BadgeRole role={member.role} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Users} title="No Members" description="Add members to start saving together." action={<Link href={`/chamas/${id}/members`}><Button>Manage Members</Button></Link>} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contributions" className="mt-0 outline-none">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
                <CardTitle className="text-lg">Contributions</CardTitle>
                <Link href={`/chamas/${id}/contributions`}>
                  <Button size="sm" className="gap-2"><PlusCircle className="w-4 h-4" /> Record Contribution</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {isContLoading ? (
                  <div className="p-4"><Skeleton className="h-32 w-full" /></div>
                ) : contributions && contributions.length > 0 ? (
                  <div className="divide-y">
                    {contributions.map(c => (
                      <div key={c.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{c.memberName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()} {c.mpesaRef && `• ${c.mpesaRef}`}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <p className="font-bold">KES {c.amount.toLocaleString()}</p>
                          <StatusBadge status={c.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Wallet} title="No Contributions" description="No contributions have been recorded yet." action={<Link href={`/chamas/${id}/contributions`}><Button>Record Contribution</Button></Link>} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans" className="mt-0 outline-none">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
                <CardTitle className="text-lg">Loans</CardTitle>
                <Link href={`/chamas/${id}/loans`}>
                  <Button size="sm" className="gap-2"><PlusCircle className="w-4 h-4" /> Issue Loan</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {isLoansLoading ? (
                  <div className="p-4"><Skeleton className="h-32 w-full" /></div>
                ) : loans && loans.length > 0 ? (
                  <div className="divide-y">
                    {loans.map(loan => (
                      <Link key={loan.id} href={`/chamas/${id}/loans/${loan.id}`}>
                        <div className="p-4 flex justify-between items-center hover:bg-muted/50 transition-colors cursor-pointer">
                          <div>
                            <p className="font-medium">{loan.memberName}</p>
                            <p className="text-xs text-muted-foreground">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="font-bold text-amber-600">KES {loan.principal.toLocaleString()}</p>
                            <StatusBadge status={loan.status} />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={FileText} title="No Loans" description="No loans have been issued yet." action={<Link href={`/chamas/${id}/loans`}><Button>Issue Loan</Button></Link>} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-0 outline-none">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
                <CardTitle className="text-lg">M-Pesa Transaction History</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => queryClient.invalidateQueries({ queryKey: getListMpesaTransactionsQueryKey(id) })}>
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isTxLoading ? (
                  <div className="p-8 text-center animate-pulse text-muted-foreground">Loading transactions...</div>
                ) : txns && txns.length > 0 ? (
                  <div className="divide-y">
                    <div className="grid grid-cols-12 gap-2 p-4 text-xs font-semibold text-muted-foreground bg-muted/30 uppercase tracking-wide">
                      <div className="col-span-1">Type</div>
                      <div className="col-span-2">Member</div>
                      <div className="col-span-2">Phone</div>
                      <div className="col-span-3">Receipt</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2 text-right">Amount / Status</div>
                    </div>
                    {txns.map(tx => (
                      <div key={tx.id} className="grid grid-cols-12 gap-2 p-4 items-center hover:bg-muted/20 transition-colors text-sm">
                        <div className="col-span-1">
                          <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${tx.type === "contribution" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                            {tx.type === "contribution" ? "C2B" : "B2C"}
                          </span>
                        </div>
                        <div className="col-span-2 font-medium truncate">{tx.memberName ?? "—"}</div>
                        <div className="col-span-2 text-xs text-muted-foreground font-mono">{tx.phoneNumber ?? "—"}</div>
                        <div className="col-span-3">
                          {tx.mpesaReceiptNumber
                            ? <span className="font-mono text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">{tx.mpesaReceiptNumber}</span>
                            : <span className="text-xs text-muted-foreground font-mono">{(tx.checkoutRequestId ?? tx.conversationId ?? "—").slice(-12)}</span>
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
                  <EmptyState icon={Phone} title="No Transactions" description="M-Pesa payments and payouts will appear here." />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDisburseOpen} onOpenChange={setIsDisburseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SendHorizonal className="w-5 h-5 text-green-600" />
              Disburse B2C Payout
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Send the chama pool directly to a member's M-Pesa. Safaricom will process the transfer within minutes.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onDisburse)} className="space-y-4">
              <FormField control={form.control} name="memberId" render={() => (
                <FormItem>
                  <FormLabel>Recipient Member</FormLabel>
                  <Select onValueChange={handleMemberChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {members?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name} — {m.phoneNumber}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
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
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KES)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="roundNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Round Number</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                ⚠️ This sends real money via M-Pesa. Ensure the phone number and amount are correct before submitting.
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDisburseOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={disburse.isPending} className="bg-green-600 hover:bg-green-700">
                  {disburse.isPending ? "Sending..." : "Send Payout"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BadgeRole({ role }: { role: string }) {
  let cls = "bg-gray-100 text-gray-800";
  if (role === "chairperson") cls = "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
  if (role === "treasurer") cls = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  if (role === "secretary") cls = "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300";
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {role}
    </span>
  );
}

function TxStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon?: React.ReactNode }> = {
    completed: { cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", label: "Paid", icon: <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> },
    pending: { cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", label: "Pending", icon: <Clock className="w-3 h-3 inline mr-0.5" /> },
    failed: { cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", label: "Failed", icon: <XCircle className="w-3 h-3 inline mr-0.5" /> },
    cancelled: { cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", label: "Cancelled", icon: <XCircle className="w-3 h-3 inline mr-0.5" /> },
    timeout: { cls: "bg-orange-100 text-orange-700", label: "Timed Out" },
    expired: { cls: "bg-gray-100 text-gray-600", label: "Expired" },
  };
  const v = map[status] ?? { cls: "bg-gray-100 text-gray-600", label: status };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>
      {v.icon}{v.label}
    </span>
  );
}
