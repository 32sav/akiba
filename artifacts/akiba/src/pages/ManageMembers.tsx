import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useListMembers, getListMembersQueryKey,
  useAddMember, useUpdateMember, useRemoveMember,
  useGetChama, getGetChamaQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Edit2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["chairperson", "treasurer", "secretary", "member"]),
});

export default function ManageMembers() {
  const params = useParams();
  const chamaId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: chama } = useGetChama(chamaId, {
    query: { enabled: !!chamaId, queryKey: getGetChamaQueryKey(chamaId) }
  });

  const { data: members, isLoading } = useListMembers(chamaId, {
    query: { enabled: !!chamaId, queryKey: getListMembersQueryKey(chamaId) }
  });

  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      role: "member",
    },
  });

  const onSubmit = (values: z.infer<typeof memberSchema>) => {
    addMember.mutate(
      { chamaId, data: { ...values, email: values.email || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMembersQueryKey(chamaId) });
          toast.success("Member added successfully");
          setIsAddOpen(false);
          form.reset();
        },
        onError: () => {
          toast.error("Failed to add member");
        }
      }
    );
  };

  const handleRemove = (memberId: number) => {
    if (confirm("Are you sure you want to remove this member?")) {
      removeMember.mutate(
        { chamaId, memberId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListMembersQueryKey(chamaId) });
            toast.success("Member removed");
          },
          onError: () => toast.error("Failed to remove member")
        }
      );
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link href={`/chamas/${chamaId}`} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Chama
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Members</h1>
          <p className="text-muted-foreground mt-1 text-sm">{chama?.name} • Control group access and roles.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="254700000000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl><Input placeholder="jane@example.com" type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="chairperson">Chairperson</SelectItem>
                        <SelectItem value="treasurer">Treasurer</SelectItem>
                        <SelectItem value="secretary">Secretary</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={addMember.isPending}>
                    {addMember.isPending ? "Adding..." : "Add Member"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading members...</div>
          ) : members && members.length > 0 ? (
            <div className="divide-y">
              {members.map(member => (
                <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground text-lg">{member.name}</p>
                        {member.role !== "member" && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium capitalize">
                            {member.role}
                          </span>
                        )}
                      </div>
                      <div className="flex text-sm text-muted-foreground mt-1 gap-3">
                        <span>{member.phoneNumber}</span>
                        {member.email && <span>• {member.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button variant="outline" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemove(member.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={ShieldAlert} title="No Members" description="Add members to this chama." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
