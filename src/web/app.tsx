import { Route, Switch } from "wouter";
import { AgentFeedback } from "@runablehq/website-runtime";
import Navbar from "./components/Navbar";
import Predict from "./pages/Predict";
import Models from "./pages/Models";
import Features from "./pages/Features";

function App() {
  return (
    <>
      <div style={{ minHeight: "100vh", background: "#f9fafb", color: "#111827" }}>
        <Navbar />
        <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 20px" }}>
          <Switch>
            <Route path="/" component={Predict} />
            <Route path="/predict" component={Predict} />
            <Route path="/models" component={Models} />
            <Route path="/features" component={Features} />
          </Switch>
        </main>
      </div>
      {import.meta.env.DEV && <AgentFeedback />}
    </>
  );
}

export default App;
