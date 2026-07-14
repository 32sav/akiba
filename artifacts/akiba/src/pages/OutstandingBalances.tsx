import { Link } from "wouter";
import {
  useListChamas, getListChamasQueryKey,
  listLoans, getListLoansQueryKey,
} from "@workspace/api-client-react";
import { useQueries } from "@tanstack/react-query";
import { AlertTriangle, TrendingDown, Wallet, Building2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PageHero } from "@/components/shared/PageHero";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const AVATAR_COLORS = [
  "bg-green-100 text-green-700",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
];

export default function OutstandingBalances() {
  const { data: chamas, isLoading: isChamasLoading } = useListChamas({
    query: { queryKey: getListChamasQueryKey() },
  });

  const loanQueries = useQueries({
    queries: (chamas ?? []).map((chama) => ({
      queryKey: getListLoansQueryKey(chama.id),
      queryFn: () => listLoans(chama.id),
      enabled: !!chama.id,
    })),
  });

  const isAnyLoading = isChamasLoading || loanQueries.some((q) => q.isLoading);

  // Build a combined structure: [{chama, activeLoans}]
  const chamaLoanGroups = (chamas ?? [])
    .map((chama, idx) => {
      const loans = loanQueries[idx]?.data ?? [];
      const activeLoans = loans
        .filter((l) => l.status === "active")
        .map((l) => ({
          ...l,
          remaining: (l.totalDue ?? 0) - (l.totalRepaid ?? 0),
          isOverdue: new Date(l.dueDate) < new Date(),
          progressPct: l.totalDue
            ? Math.min(100, Math.max(0, ((l.totalRepaid ?? 0) / l.totalDue) * 100))
            : 0,
        }))
        .sort((a, b) => {
          // overdue first, then by remaining balance desc
          if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
          return b.remaining - a.remaining;
        });
      return { chama, activeLoans };
    })
    .filter((g) => g.activeLoans.length > 0);

  const totalOutstanding = chamaLoanGroups.reduce(
    (sum, g) => sum + g.activeLoans.reduce((s, l) => s + l.remaining, 0),
    0,
  );
  const totalLoanCount = chamaLoanGroups.reduce((sum, g) => sum + g.activeLoans.length, 0);
  const overdueCount = chamaLoanGroups.reduce(
    (sum, g) => sum + g.activeLoans.filter((l) => l.isOverdue).length,
    0,
  );

  return (
    <div className="pb-8">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=1400&q=80&fit=crop"
        title="Outstanding Balances"
        subtitle="All active loan balances across every chama — sorted by urgency."
        overlay="bg-gradient-to-r from-amber-950/85 via-amber-900/60 to-transparent"
      />

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        {/* Summary stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Outstanding</p>
                <p className="text-2xl font-bold text-amber-600">
                  KES {isAnyLoading ? "—" : totalOutstanding.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Loans</p>
                <p className="text-2xl font-bold text-blue-600">
                  {isAnyLoading ? "—" : totalLoanCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  across {isAnyLoading ? "—" : chamaLoanGroups.length} chama{chamaLoanGroups.length !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className={`shadow-sm ${overdueCount > 0 ? "border-red-200" : ""}`}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${overdueCount > 0 ? "bg-red-100" : "bg-green-100"}`}>
                <AlertTriangle className={`w-5 h-5 ${overdueCount > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Overdue Loans</p>
                <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : "text-green-600"}`}>
                  {isAnyLoading ? "—" : overdueCount}
                </p>
                <p className="text-xs text-muted-foreground">
                  {overdueCount === 0 ? "All on track" : "Require immediate action"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        {isAnyLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : chamaLoanGroups.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-8">
              <EmptyState
                icon={TrendingDown}
                title="No Outstanding Balances"
                description="All loans across your chamas have been repaid. Great work!"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {chamaLoanGroups.map(({ chama, activeLoans }) => {
              const chamaTotal = activeLoans.reduce((s, l) => s + l.remaining, 0);
              const chamaOverdue = activeLoans.filter((l) => l.isOverdue).length;

              return (
                <Card key={chama.id} className="shadow-sm overflow-hidden">
                  {/* Chama header */}
                  <CardHeader className="pb-3 bg-muted/30 border-b flex flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{chama.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {activeLoans.length} active loan{activeLoans.length !== 1 ? "s" : ""} ·{" "}
                          <span className="font-medium text-amber-600">KES {chamaTotal.toLocaleString()} outstanding</span>
                          {chamaOverdue > 0 && (
                            <span className="ml-2 text-red-600 font-medium">· {chamaOverdue} overdue</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/chamas/${chama.id}/loans`}
                      className="text-xs text-muted-foreground hover:text-green-600 flex items-center gap-0.5 transition-colors shrink-0"
                    >
                      View all <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardHeader>

                  <CardContent className="p-0">
                    <div className="divide-y">
                      {activeLoans.map((loan, idx) => (
                        <Link
                          key={loan.id}
                          href={`/chamas/${chama.id}/loans/${loan.id}`}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/20 transition-colors group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                              {loan.memberName.substring(0, 2).toUpperCase()}
                            </div>

                            {/* Name + badges */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground">{loan.memberName}</p>
                                <StatusBadge status={loan.status} />
                                {loan.isOverdue && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Due {new Date(loan.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                                {" · "}Principal KES {loan.principal.toLocaleString()}
                                {" · "}{loan.interestRate}% interest
                              </p>
                            </div>
                          </div>

                          {/* Balance + progress */}
                          <div className="sm:w-56 shrink-0">
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground">{loan.progressPct.toFixed(0)}% repaid</span>
                              <span className={`font-bold ${loan.isOverdue ? "text-red-600" : "text-amber-600"}`}>
                                KES {loan.remaining.toLocaleString()} left
                              </span>
                            </div>
                            <Progress
                              value={loan.progressPct}
                              className={`h-2 ${loan.isOverdue ? "[&>div]:bg-red-500" : ""}`}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              KES {(loan.totalRepaid ?? 0).toLocaleString()} of KES {(loan.totalDue ?? 0).toLocaleString()}
                            </p>
                          </div>

                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-green-600 transition-colors shrink-0 hidden sm:block" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
