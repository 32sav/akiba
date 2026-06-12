import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListChamas, useCreateChama, getListChamasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Search, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const CHAMA_IMAGES = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop",
];

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
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1400&q=80&fit=crop"
        title="My Chamas"
        subtitle="Manage and view all your savings groups."
        overlay="bg-gradient-to-r from-green-950/80 via-green-900/55 to-transparent"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search chamas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 max-w-md w-72"
            />
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
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chama Name</FormLabel>
                      <FormControl><Input placeholder="e.g. Visionaries Sacco" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl><Input placeholder="What is the goal of this chama?" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="meetingFrequency" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="contributionAmount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contribution Amount (KES)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="bankAccount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account / Paybill (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g. Paybill 123456" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createChama.isPending}>
                      {createChama.isPending ? "Creating..." : "Create Chama"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : filteredChamas && filteredChamas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChamas.map((chama, idx) => (
              <Link key={chama.id} href={`/chamas/${chama.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all h-full overflow-hidden group">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={CHAMA_IMAGES[idx % CHAMA_IMAGES.length]}
                      alt={chama.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-bold text-white text-lg leading-tight">{chama.name}</h3>
                      <CardDescription className="text-white/70 text-xs mt-0.5 line-clamp-1">
                        {chama.description || "No description provided"}
                      </CardDescription>
                    </div>
                    <div className="absolute top-3 right-3 p-1.5 bg-white/20 backdrop-blur-sm rounded-full">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Contributions</span>
                        <span className="font-semibold text-primary">KES {chama.contributionAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Frequency</span>
                        <span className="font-medium capitalize bg-muted px-2 py-0.5 rounded text-xs">{chama.meetingFrequency}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pt-1 border-t mt-1">
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
            action={search ? <Button variant="outline" onClick={() => setSearch("")}>Clear Search</Button> : null}
          />
        )}
      </div>
    </div>
  );
}
