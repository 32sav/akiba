import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useListMembers, getListMembersQueryKey,
  useAddMember, useRemoveMember,
  useGetChama, getGetChamaQueryKey,
  useCreateInvitation,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Plus, Trash2, Edit2, ShieldAlert, Link2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["chairperson", "treasurer", "secretary", "member"]),
});

const ROLE_COLORS: Record<string, string> = {
  chairperson: "bg-purple-100 text-purple-800",
  treasurer: "bg-blue-100 text-blue-800",
  secretary: "bg-teal-100 text-teal-800",
  member: "bg-gray-100 text-gray-700",
};

const AVATAR_COLORS = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

export default function ManageMembers() {
  const params = useParams();
  const chamaId = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: chama } = useGetChama(chamaId, {
    query: { enabled: !!chamaId, queryKey: getGetChamaQueryKey(chamaId) }
  });

  const { data: members, isLoading } = useListMembers(chamaId, {
    query: { enabled: !!chamaId, queryKey: getListMembersQueryKey(chamaId) }
  });

  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const createInvitation = useCreateInvitation();

  const form = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", phoneNumber: "", email: "", role: "member" },
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
        onError: () => toast.error("Failed to add member"),
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
          onError: () => toast.error("Failed to remove member"),
        }
      );
    }
  };

  const handleGenerateInvite = () => {
    createInvitation.mutate(
      { chamaId },
      {
        onSuccess: (data) => {
          const base = window.location.origin;
          const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
          const link = `${base}${basePath}/join/${data.token}`;
          setInviteLink(link);
          setIsInviteOpen(true);
        },
        onError: () => toast.error("Failed to generate invite link"),
      }
    );
  };

  const handleCopy = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&q=80&fit=crop"
        title="Manage Members"
        subtitle={chama ? `${chama.name} — Control group access and roles.` : "Control group access and roles."}
        overlay="bg-gradient-to-r from-green-950/80 via-green-900/50 to-transparent"
      />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link href={`/chamas/${chamaId}`} className="text-muted-foreground hover:text-foreground flex items-center text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Chama
          </Link>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
              onClick={handleGenerateInvite}
              disabled={createInvitation.isPending}
            >
              <Link2 className="w-4 h-4" />
              {createInvitation.isPending ? "Generating..." : "Share Invite Link"}
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New Member</DialogTitle></DialogHeader>
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
        </div>

        {/* Invite link dialog */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-green-600" /> Shareable Invite Link
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this link with anyone you'd like to invite to <strong>{chama?.name}</strong>. It expires in 7 days and allows up to 50 uses.
              </p>
              <div className="flex gap-2">
                <Input
                  value={inviteLink || ""}
                  readOnly
                  className="font-mono text-xs bg-muted"
                />
                <Button onClick={handleCopy} variant="outline" className="shrink-0 gap-1">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded p-3">
                Anyone with this link can join the chama directly — only share with trusted contacts.
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsInviteOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Member count banner */}
        {members && members.length > 0 && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=80&q=80&fit=crop"
              alt="Group"
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
            />
            <div>
              <p className="font-semibold text-green-800">{members.length} member{members.length !== 1 ? "s" : ""} in this group</p>
              <p className="text-xs text-green-600">Roles: {[...new Set(members.map(m => m.role))].join(", ")}</p>
            </div>
          </div>
        )}

        <Card className="shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading members...</div>
            ) : members && members.length > 0 ? (
              <div className="divide-y">
                {members.map((member, idx) => (
                  <div key={member.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-lg">{member.name}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${ROLE_COLORS[member.role] || ROLE_COLORS.member}`}>
                            {member.role}
                          </span>
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
    </div>
  );
}
