import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListChamas, useCreateChama, getListChamasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const createChamaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  meetingFrequency: z.enum(["weekly", "monthly", "quarterly"]),
  contributionAmount: z.coerce.number().min(1, "Amount must be greater than 0"),
  bankAccount: z.string().optional(),
});

export default function ChamasList() {
  const { data: chamas, isLoading } = useListChamas();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const createChama = useCreateChama();

  const form = useForm<z.infer<typeof createChamaSchema>>({
    resolver: zodResolver(createChamaSchema),
    defaultValues: {
      name: "",
      description: "",
      meetingFrequency: "monthly",
      contributionAmount: 1000,
      bankAccount: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createChamaSchema>) => {
    createChama.mutate(
      { data: values },
      {
        onSuccess: (newChama) => {
          queryClient.invalidateQueries({ queryKey: getListChamasQueryKey() });
          toast.success("Chama created successfully");
          setIsDialogOpen(false);
          form.reset();
          setLocation(`/chamas/${newChama.id}`);
        },
        onError: () => {
          toast.error("Failed to create chama");
        },
      }
    );
  };

  const filteredChamas = chamas?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Chamas</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and view all your savings groups.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0 gap-2">
              <Plus className="w-4 h-4" />
              New Chama
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Chama</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chama Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Visionaries Sacco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="What is the goal of this chama?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="meetingFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contributionAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contribution Amount (KES)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="bankAccount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account / Paybill (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Paybill 123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createChama.isPending}>
                    {createChama.isPending ? "Creating..." : "Create Chama"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search chamas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-muted animate-pulse rounded-xl"></div>)}
        </div>
      ) : filteredChamas && filteredChamas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChamas.map((chama) => (
            <Link key={chama.id} href={`/chamas/${chama.id}`}>
              <Card className="hover-elevate cursor-pointer transition-all border-l-4 border-l-primary h-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{chama.name}</CardTitle>
                      <CardDescription className="line-clamp-1 mt-1">
                        {chama.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Contributions</span>
                      <span className="font-semibold text-primary">KES {chama.contributionAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium capitalize">{chama.meetingFrequency}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
                      Created {new Date(chama.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No Chamas Found"
          description={search ? "We couldn't find any groups matching your search." : "You haven't created or joined any chamas yet."}
          action={
            search ? (
              <Button variant="outline" onClick={() => setSearch("")}>Clear Search</Button>
            ) : null
          }
        />
      )}
    </div>
  );
}
