import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { Community } from "./pages/Community";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Profile } from "./pages/Profile";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store";
import { supabase } from "./lib/supabase";
import { runMigrations } from "./lib/migrations";
import { AIGenerator } from "./pages/AIGenerator";
import { ContentEditor } from "./pages/ContentEditor";

function App() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    runMigrations().catch((error) => {
      console.error("Migration failed:", error);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="community" element={<Community />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          {/* Add this route for viewing other users' profiles */}
          <Route
            path="profile/:userId"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="ai-generate" element={<AIGenerator />} />
          <Route path="editor" element={<ContentEditor />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
