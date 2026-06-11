import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useListLoans, getListLoansQueryKey,
  useCreateLoan, useListMembers, getListMembersQueryKey,
  useGetChama, getGetChamaQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
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

  const { data: chama } = useGetChama(chamaId, { query: { enabled: !!chamaId, queryKey: getGetChamaQueryKey(chamaId) }});
  const { data: members } = useListMembers(chamaId, { query: { enabled: !!chamaId, queryKey: getListMembersQueryKey(chamaId) }});
  const { data: loans, isLoading } = useListLoans(chamaId, { query: { enabled: !!chamaId, queryKey: getListLoansQueryKey(chamaId) }});

  const createLoan = useCreateLoan();

  const form = useForm<z.infer<typeof loanSchema>>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      principal: 0,
      interestRate: 10,
      dueDate: "",
      notes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loanSchema>) => {
    createLoan.mutate({
      chamaId,
      data: values
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLoansQueryKey(chamaId) });
        toast.success("Loan issued successfully");
        setIsAddOpen(false);
        form.reset();
      },
      onError: () => toast.error("Failed to issue loan")
    });
  };

  const filteredLoans = loans?.filter(l => 
    l.memberName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href={`/chamas/${chamaId}`} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Chama
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Loans</h1>
          <p className="text-muted-foreground mt-1 text-sm">Issue and track member loans.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Issue New Loan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Issue Loan</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="memberId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {members?.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                        ))}
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search loans by member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [1,2,3].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl"></div>)
        ) : filteredLoans && filteredLoans.length > 0 ? (
          filteredLoans.map(loan => (
            <Link key={loan.id} href={`/chamas/${chamaId}/loans/${loan.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all h-full border-t-4 border-t-amber-500">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{loan.memberName}</h3>
                      <p className="text-xs text-muted-foreground">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={loan.status} />
                  </div>
                  
                  <div className="space-y-2 mt-4 pt-4 border-t border-dashed">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Principal:</span>
                      <span className="font-medium">KES {loan.principal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Interest ({loan.interestRate}%):</span>
                      <span className="font-medium">KES {((loan.principal * loan.interestRate) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold pt-1">
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
  );
}
