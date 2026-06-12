import { useListChamas } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHero } from "@/components/shared/PageHero";
import { Link } from "wouter";
import { useUser } from "@clerk/react";

const CHAMA_IMAGES = [
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80&fit=crop",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&q=80&fit=crop",
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
  const totalSavings = chamas?.reduce((acc, c) => acc + (c.contributionAmount * 10), 0) || 0;

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Chamas</CardTitle>
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeChamasCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Active groups you manage</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-blue-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Est. Total Pool</CardTitle>
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">KES {totalSavings.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all your groups</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-amber-400">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
              <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Healthy</div>
              <p className="text-xs text-muted-foreground mt-1">All groups contributing</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Groups</h2>
            <Link href="/chamas" className="text-sm text-primary hover:underline font-medium">View all</Link>
          </div>

          {chamas && chamas.length > 0 ? (
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
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                        {chama.description || "No description"}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="bg-muted px-2 py-1 rounded text-xs font-medium capitalize">
                          {chama.meetingFrequency}
                        </span>
                        <span className="font-semibold text-primary">
                          KES {chama.contributionAmount.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No Chamas found"
              description="You haven't joined or created any groups yet."
              action={<Link href="/chamas" className="text-primary hover:underline font-medium">Go to Chamas to create one</Link>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
