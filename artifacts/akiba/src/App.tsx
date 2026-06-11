import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";

// Pages
import Dashboard from "@/pages/Dashboard";
import ChamasList from "@/pages/ChamasList";
import ChamaDetail from "@/pages/ChamaDetail";
import ManageMembers from "@/pages/ManageMembers";
import ManageContributions from "@/pages/ManageContributions";
import ManageLoans from "@/pages/ManageLoans";
import LoanDetail from "@/pages/LoanDetail";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chamas" component={ChamasList} />
        <Route path="/chamas/:id" component={ChamaDetail} />
        <Route path="/chamas/:id/members" component={ManageMembers} />
        <Route path="/chamas/:id/contributions" component={ManageContributions} />
        <Route path="/chamas/:id/loans" component={ManageLoans} />
        <Route path="/chamas/:id/loans/:loanId" component={LoanDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
