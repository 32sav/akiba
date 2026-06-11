import { useListChamas } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Wallet, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: chamas, isLoading } = useListChamas();

  if (isLoading) {
    return (
      <div className="p-8 animate-pulse space-y-8">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const activeChamasCount = chamas?.length || 0;
  const totalSavings = chamas?.reduce((acc, c) => acc + (c.contributionAmount * 10), 0) || 0; // mockup estimate

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Monitor all your financial groups in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Chamas</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeChamasCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active groups you manage</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. Total Pool</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">KES {totalSavings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all your groups</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
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
            {chamas.slice(0, 6).map(chama => (
              <Link key={chama.id} href={`/chamas/${chama.id}`}>
                <Card className="hover-elevate cursor-pointer transition-all border-l-4 border-l-primary h-full">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg">{chama.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {chama.description || "No description"}
                    </p>
                    <div className="mt-4 flex justify-between items-center text-sm">
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
  );
}
