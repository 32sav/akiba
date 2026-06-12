import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useListLoans, getListLoansQueryKey,
  useCreateLoan, useListMembers, getListMembersQueryKey,
  useGetChama, getGetChamaQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, FileText, Search, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHero } from "@/components/shared/PageHero";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

const loanSchema = z.object({
  memberId: z.coerce.number().min(1, "Member is required"),
  principal: z.coerce.number().min(1, "Amount must be greater than 0"),
  interestRate: z.coerce.number().min(0, "Interest rate cannot be negative"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
});

export default function ManageLoans() {
  const params = useParams();
  const chamaId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: chama } = useGetChama(chamaId, { query: { enabled: !!chamaId, queryKey: getGetChamaQueryKey(chamaId) } });
  const { data: members } = useListMembers(chamaId, { query: { enabled: !!chamaId, queryKey: getListMembersQueryKey(chamaId) } });
  const { data: loans, isLoading } = useListLoans(chamaId, { query: { enabled: !!chamaId, queryKey: getListLoansQueryKey(chamaId) } });

  const createLoan = useCreateLoan();

  const form = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: { principal: 0, interestRate: 10, dueDate: "", notes: "" },
  });

  const onSubmit = (values: z.infer<typeof loanSchema>) => {
    createLoan.mutate({ chamaId, data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey(chamaId) });
        toast.success("Loan issued successfully");
        setIsAddOpen(false);
        form.reset();
      },
      onError: () => toast.error("Failed to issue loan"),
    });
  };

  const filteredLoans = loans?.filter(l => l.memberName.toLowerCase().includes(search.toLowerCase()));
  const activeLoans = loans?.filter(l => l.status === "active").length || 0;
  const totalLoaned = loans?.reduce((s, l) => s + l.principal, 0) || 0;

  return (
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1400&q=80&fit=crop"
        title="Loans"
        subtitle={chama ? `${chama.name} — Issue and track member loans.` : "Issue and track member loans."}
        overlay="bg-gradient-to-r from-amber-950/80 via-amber-900/50 to-transparent"
      />

      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={`/chamas/${chamaId}`} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Chama
          </Link>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Issue New Loan</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Issue Loan</DialogTitle></DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="memberId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value?.toString()}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {members?.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="principal" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Principal Amount (KES)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="interestRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl><Textarea placeholder="Purpose of the loan..." {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createLoan.isPending}>Issue Loan</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl overflow-hidden relative h-28">
            <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80&fit=crop" alt="Finance" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-amber-900/70 flex flex-col items-center justify-center text-white">
              <p className="text-xs font-medium opacity-80">Total Loaned Out</p>
              <p className="text-2xl font-bold">KES {totalLoaned.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center h-28">
            <TrendingUp className="w-6 h-6 text-amber-500 mb-1" />
            <p className="text-xs text-amber-700">Active Loans</p>
            <p className="text-3xl font-bold text-amber-700">{activeLoans}</p>
          </div>
          <div className="flex flex-col justify-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search loans by member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [1, 2, 3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />)
          ) : filteredLoans && filteredLoans.length > 0 ? (
            filteredLoans.map(loan => (
              <Link key={loan.id} href={`/chamas/${chamaId}/loans/${loan.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all h-full overflow-hidden group">
                  <div className="relative h-24 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=80&fit=crop"
                      alt="Loan"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-950/80 to-amber-800/40" />
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <div>
                        <p className="text-white font-bold text-lg">{loan.memberName}</p>
                        <p className="text-white/70 text-xs">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                      </div>
                      <StatusBadge status={loan.status} />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2 mt-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Principal:</span>
                        <span className="font-medium">KES {loan.principal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Interest ({loan.interestRate}%):</span>
                        <span className="font-medium">KES {((loan.principal * loan.interestRate) / 100).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                        <span>Total Due:</span>
                        <span className="text-amber-600">KES {loan.totalDue?.toLocaleString()}</span>
                      </div>
                      {loan.totalRepaid !== undefined && loan.totalRepaid > 0 && (
                        <div className="flex justify-between text-sm font-semibold text-green-600">
                          <span>Repaid:</span>
                          <span>- KES {loan.totalRepaid.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState icon={FileText} title="No Loans Found" description="There are no loans matching your criteria." />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
