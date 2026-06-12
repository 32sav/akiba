import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useListContributions, getListContributionsQueryKey,
  useRecordContribution, useInitiateMpesaPayment,
  useListMembers, getListMembersQueryKey,
  useGetChama, getGetChamaQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Wallet, Search, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
        data: { phoneNumber: values.phoneNumber, amount: values.amount, accountReference: `CHAMA-${chamaId}`, transactionDesc: "Chama Contribution" }
      }, {
        onSuccess: () => {
          toast.success("M-Pesa prompt sent to phone. Awaiting payment.");
          recordContribution.mutate({ chamaId, data: { memberId: values.memberId, amount: values.amount, status: "pending" } }, {
            onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListContributionsQueryKey(chamaId) }); setIsAddOpen(false); form.reset(); }
          });
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

  const totalCollected = contributions?.filter(c => c.status === "completed").reduce((s, c) => s + c.amount, 0) || 0;

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

        {/* Stats strip with image */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1 rounded-xl overflow-hidden relative h-28">
            <img src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&q=80&fit=crop" alt="M-Pesa" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-green-900/70 flex flex-col items-center justify-center text-white">
              <p className="text-xs font-medium opacity-80">Total Collected</p>
              <p className="text-2xl font-bold">KES {totalCollected.toLocaleString()}</p>
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="relative">
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
      </div>
    </div>
  );
}
