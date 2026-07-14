import { useState } from "react";
import { useParams } from "wouter";
import { useGetInvitation, getGetInvitationQueryKey, useAcceptInvitation } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Users, Wallet, Calendar, Phone } from "lucide-react";

const joinSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["chairperson", "treasurer", "secretary", "member"]),
});

const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export default function JoinChama() {
  const params = useParams<{ token: string }>();
  const token = params.token || "";
  const [joined, setJoined] = useState(false);
  const [joinedName, setJoinedName] = useState("");

  const { data: invite, isLoading, error } = useGetInvitation(token, {
    query: { enabled: !!token, queryKey: getGetInvitationQueryKey(token) },
  });

  const acceptInvitation = useAcceptInvitation();

  const form = useForm<z.infer<typeof joinSchema>>({
    resolver: zodResolver(joinSchema),
    defaultValues: { name: "", phoneNumber: "", email: "", role: "member" },
  });

  const onSubmit = (values: z.infer<typeof joinSchema>) => {
    acceptInvitation.mutate(
      { token, data: { ...values, email: values.email || undefined } },
      {
        onSuccess: (member) => {
          setJoinedName(member.name);
          setJoined(true);
          toast.success("You've joined the chama!");
        },
        onError: () => toast.error("Failed to join — the invite may be expired or invalid."),
      }
    );
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundImage: "url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80&fit=crop)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-green-950/75" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/logo.svg" alt="Akiba" className="h-9" />
          <span className="text-white font-bold text-2xl tracking-tight">Akiba</span>
        </div>

        {isLoading && (
          <Card className="shadow-xl">
            <CardContent className="p-8 space-y-4">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        )}

        {!isLoading && (error || !invite) && (
          <Card className="shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Invite Not Found</h2>
              <p className="text-muted-foreground text-sm">
                This invite link is invalid, has expired, or has already reached its limit.
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && invite && !joined && (
          <Card className="shadow-xl">
            <CardHeader className="pb-2 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-green-700" />
              </div>
              <CardTitle className="text-2xl font-bold">{invite.chamaName}</CardTitle>
              {invite.chamaDescription && (
                <p className="text-muted-foreground text-sm mt-1">{invite.chamaDescription}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-3 py-3 border-y">
                <div className="text-center">
                  <Wallet className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Contribution</p>
                  <p className="font-bold text-sm">KES {invite.contributionAmount.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <Calendar className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Frequency</p>
                  <p className="font-bold text-sm">{FREQ_LABELS[invite.meetingFrequency]}</p>
                </div>
                <div className="text-center">
                  <Users className="w-4 h-4 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Members</p>
                  <p className="font-bold text-sm">{invite.memberCount}</p>
                </div>
              </div>

              <p className="text-sm font-semibold text-foreground">Your Details</p>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="Jane Wanjiku" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="254700000000" {...field} />
                        </div>
                      </FormControl>
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
                      <FormLabel>Your Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="chairperson">Chairperson</SelectItem>
                          <SelectItem value="treasurer">Treasurer</SelectItem>
                          <SelectItem value="secretary">Secretary</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={acceptInvitation.isPending}>
                    {acceptInvitation.isPending ? "Joining..." : `Join ${invite.chamaName}`}
                  </Button>
                </form>
              </Form>

              <p className="text-xs text-center text-muted-foreground">
                Expires {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        {joined && (
          <Card className="shadow-xl">
            <CardContent className="p-10 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Welcome, {joinedName}!</h2>
              <p className="text-muted-foreground">
                You've successfully joined <strong>{invite?.chamaName}</strong>. The group admin will be in touch soon.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Already have an account?{" "}
                <a href="/sign-in" className="text-green-600 font-semibold hover:underline">Sign in</a>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
