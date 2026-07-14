import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Landing from "@/pages/Landing";

// Pages
import Dashboard from "@/pages/Dashboard";
import ChamasList from "@/pages/ChamasList";
import ChamaDetail from "@/pages/ChamaDetail";
import ManageMembers from "@/pages/ManageMembers";
import ManageContributions from "@/pages/ManageContributions";
import ManageLoans from "@/pages/ManageLoans";
import LoanDetail from "@/pages/LoanDetail";
import JoinChama from "@/pages/JoinChama";
import OutstandingBalances from "@/pages/OutstandingBalances";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#16a34a",
    colorForeground: "#0f1a11",
    colorMutedForeground: "#4b5563",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#f9fafb",
    colorInputForeground: "#0f1a11",
    colorNeutral: "#d1d5db",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-gray-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-bold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-medium",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-green-600 font-semibold hover:text-green-700",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-green-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-gray-700",
    logoBox: "flex justify-center",
    logoImage: "h-10",
    socialButtonsBlockButton: "border border-gray-200 hover:bg-gray-50",
    formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white font-semibold",
    formFieldInput: "border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-green-500",
    footerAction: "bg-gray-50",
    dividerLine: "bg-gray-200",
    alert: "border-red-100 bg-red-50",
    otpCodeFieldInput: "border-gray-300",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4 py-12"
      style={{
        backgroundImage: "url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80&fit=crop)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-green-950/70" />
      <div className="relative z-10 w-full flex justify-center">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-4 py-12"
      style={{
        backgroundImage: "url(https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80&fit=crop)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-green-950/70" />
      <div className="relative z-10 w-full flex justify-center">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRoutes() {
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
        <Route path="/outstanding" component={OutstandingBalances} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function DashboardGate() {
  return (
    <>
      <Show when="signed-in">
        <AppRoutes />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back to Akiba",
            subtitle: "Sign in to manage your savings groups",
          },
        },
        signUp: {
          start: {
            title: "Join Akiba",
            subtitle: "Create your account and start saving smarter",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/join/:token" component={JoinChama} />
            <Route path="/dashboard" component={DashboardGate} />
            <Route path="/chamas" component={DashboardGate} />
            <Route path="/chamas/:rest*" component={DashboardGate} />
            <Route path="/outstanding" component={DashboardGate} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
