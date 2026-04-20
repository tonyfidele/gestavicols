import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";

import Landing from "./pages/landing";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import Farms from "./pages/farms/index";
import FarmDetail from "./pages/farms/[id]";
import Batches from "./pages/batches/index";
import BatchDetail from "./pages/batches/[id]";
import Sales from "./pages/sales/index";
import Stock from "./pages/stock/index";
import Expenses from "./pages/expenses/index";
import Users from "./pages/users/index";
import Audit from "./pages/audit/index";
import Customers from "./pages/customers/index";
import HR from "./pages/hr/index";
import Analytics from "./pages/analytics/index";
import Veterinary from "./pages/veterinary/index";
import Eggs from "./pages/eggs/index";
import NotFound from "./pages/not-found";

const PUBLIC_PATHS = ["/", "/login", "/register"];

const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    init = { ...init };
    const headers = new Headers(init.headers);
    if (!headers.has("authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    init.headers = headers;
  }
  const response = await originalFetch(input, init);
  if (response.status === 401) {
    const path = window.location.pathname;
    const isPublic = PUBLIC_PATHS.some(p => path.endsWith(p));
    if (!isPublic) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
  }
  return response;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/farms" component={Farms} />
      <Route path="/farms/:id" component={FarmDetail} />
      <Route path="/batches" component={Batches} />
      <Route path="/batches/:id" component={BatchDetail} />
      <Route path="/sales" component={Sales} />
      <Route path="/stock" component={Stock} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/veterinary" component={Veterinary} />
      <Route path="/customers" component={Customers} />
      <Route path="/hr" component={HR} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/eggs" component={Eggs} />
      <Route path="/users" component={Users} />
      <Route path="/audit" component={Audit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
