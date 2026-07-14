import { useListChamas } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, TrendingUp, ArrowRight, PlusCircle, Landmark } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const CHAMA_IMAGES = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop",
];

const CHART_COLORS = ["#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"];

const QUICK_ACTIONS = [
  { icon: PlusCircle, label: "New Chama", desc: "Start a new savings group", href: "/chamas", color: "text-green-600 bg-green-50" },
  { icon: Wallet, label: "Record Contribution", desc: "Log a member payment", href: "/chamas", color: "text-blue-600 bg-blue-50" },
  { icon: Landmark, label: "Issue Loan", desc: "Create a member loan", href: "/chamas", color: "text-amber-600 bg-amber-50" },
];

export default function Dashboard() {
  const { data: chamas, isLoading } = useListChamas();
  const { user } = useUser();
  const firstName = user?.firstName || user?.username || "there";

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-40 bg-muted" />
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const activeChamasCount = chamas?.length || 0;
  const totalContributionTarget = chamas?.reduce((acc, c) => acc + Number(c.contributionAmount), 0) || 0;

  const frequencyBreakdown = {
    weekly: chamas?.filter(c => c.meetingFrequency === "weekly").length || 0,
    monthly: chamas?.filter(c => c.meetingFrequency === "monthly").length || 0,
    quarterly: chamas?.filter(c => c.meetingFrequency === "quarterly").length || 0,
  };
  const dominantFreq = Object.entries(frequencyBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || "monthly";

  const chartData = chamas?.map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    amount: Number(c.contributionAmount),
  })) || [];

  return (
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1400&q=80&fit=crop"
        title={`Welcome back, ${firstName} 👋`}
        subtitle="Monitor all your savings groups in one place."
        height="h-48"
        overlay="bg-gradient-to-r from-green-950/85 via-green-900/60 to-transparent"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Chamas</CardTitle>
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeChamasCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Savings groups you manage</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-blue-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Collection Target</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">KES {totalContributionTarget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Combined contribution targets</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-amber-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Meeting Cadence</CardTitle>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold capitalize">{dominantFreq}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {frequencyBreakdown.weekly}W · {frequencyBreakdown.monthly}M · {frequencyBreakdown.quarterly}Q groups
              </p>
            </CardContent>
          </Card>
        </div>

        {chamas && chamas.length > 0 ? (
          <>
            {/* Bar Chart */}
            {chartData.length > 1 && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Contribution Target by Group</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0fdf4" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Target"]}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div>
              <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {QUICK_ACTIONS.map(({ icon: Icon, label, desc, href, color }) => (
                  <Link key={label} href={href}>
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors cursor-pointer group">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{label}</p>
                        <p className="text-xs text-muted-foreground truncate">{desc}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Your Groups */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Your Groups</h2>
                <Link href="/chamas" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chamas.slice(0, 6).map((chama, idx) => (
                  <Link key={chama.id} href={`/chamas/${chama.id}`}>
                    <Card className="hover-elevate cursor-pointer transition-all h-full overflow-hidden group">
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={CHAMA_IMAGES[idx % CHAMA_IMAGES.length]}
                          alt={chama.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-3 left-4 right-4">
                          <h3 className="font-semibold text-white text-base leading-tight">{chama.name}</h3>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize
                            ${chama.meetingFrequency === "weekly" ? "bg-green-500/80 text-white" :
                              chama.meetingFrequency === "monthly" ? "bg-blue-500/80 text-white" :
                              "bg-amber-500/80 text-white"}`}>
                            {chama.meetingFrequency}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                          {chama.description || "No description"}
                        </p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground text-xs">
                            Since {new Date(chama.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                          </span>
                          <span className="font-semibold text-primary">
                            KES {Number(chama.contributionAmount).toLocaleString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <Card className="shadow-sm overflow-hidden">
            <div className="relative h-40">
              <img
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80&fit=crop"
                alt="Community"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-green-950/70 flex flex-col items-center justify-center text-white text-center px-6">
                <h3 className="text-xl font-bold mb-1">Welcome to Akiba! 🌱</h3>
                <p className="text-sm text-white/80">Start your chama savings journey in seconds.</p>
              </div>
            </div>
            <EmptyState
              icon={Users}
              title="No Chamas yet"
              description="Create your first savings group to start tracking contributions, loans, and M-Pesa payments."
              action={
                <Link href="/chamas">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                    <PlusCircle className="w-4 h-4" /> Create your first Chama
                  </div>
                </Link>
              }
            />
          </Card>
        )}
      </div>
    </div>
  );
}
