import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Farms from "./pages/farms/index";
import Batches from "./pages/batches/index";
import Sales from "./pages/sales/index";
import NotFound from "./pages/not-found";

// Setup global fetch interceptor to inject Authorization header
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    init = init || {};
    init.headers = {
      ...init.headers,
      Authorization: `Bearer ${token}`
    };
  }
  const response = await originalFetch(input, init);
  if (response.status === 401 && window.location.pathname !== '/login') {
    localStorage.removeItem("auth_token");
    window.location.href = "/login";
  }
  return response;
};

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/farms" component={Farms} />
      <Route path="/batches" component={Batches} />
      <Route path="/sales" component={Sales} />
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
