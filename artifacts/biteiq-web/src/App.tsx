import { Switch, Route, Router as WouterRouter } from "wouter";

import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Support from "@/pages/Support";
import DeleteAccount from "@/pages/DeleteAccount";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/support" component={Support} />
      <Route path="/delete-account" component={DeleteAccount} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Layout>
        <Router />
      </Layout>
    </WouterRouter>
  );
}

export default App;
