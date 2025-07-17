import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Layout as LayoutIcon, Users, Wand2 } from "lucide-react";
import { useEffect } from "react";
import { ProfileIcon } from "./ProfileIcon"; // Import ProfileIcon component

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === "/";

  const isActive = (path: string) => {
    return location.pathname === path
      ? "bg-blue-50 text-blue-600"
      : "text-gray-600 hover:bg-gray-50";
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (["/dashboard", "/community"].includes(location.pathname)) {
        try {
          const { supabase } = await import("../lib/supabase");
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            navigate("/login", { state: { from: location.pathname } });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          navigate("/login");
        }
      }
    };

    checkAuth();
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      const { supabase } = await import("../lib/supabase");

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error logging out:", error.message);
        return;
      }

      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link
              to="/"
              className="flex items-center px-2 py-2 text-xl font-bold text-blue-600"
            >
              <LayoutIcon className="w-6 h-6 mr-2" />
              WebCraft
            </Link>
            <div className="ml-6 flex space-x-4">
              <Link
                to="/"
                className={`inline-flex items-center px-4 py-2 rounded-lg ${isActive(
                  "/"
                )}`}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-4 py-2 rounded-lg ${isActive(
                  "/dashboard"
                )}`}
              >
                <LayoutIcon className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/community"
                className={`inline-flex items-center px-4 py-2 rounded-lg ${isActive(
                  "/community"
                )}`}
              >
                <Users className="w-4 h-4 mr-2" />
                Community
              </Link>
              <Link
                to="/ai-generate"
                className={`inline-flex items-center px-4 py-2 rounded-lg ${isActive(
                  "/ai-generate"
                )}`}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                AI Generate
              </Link>
            </div>
            {location.pathname === "/" ? (
              <Link
                to="/login"
                className={`inline-flex items-center px-4 py-2 rounded-lg ${isActive(
                  "/login"
                )}`}
              >
                <button className="bg-blue-500 text-white px-4 py-2 ml-2 rounded-lg">
                  Login
                </button>
              </Link>
            ) : location.pathname !== "/login" ? (
              <div className={`inline-flex items-center px-4 py-2 rounded-lg`}>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 ml-2 rounded-lg"
                >
                  Logout
                </button>
              </div>
            ) : null}
            {location.pathname !== "/" && <div></div>}
          </div>
        </div>
      </nav>
      {!isLandingPage && <ProfileIcon />}
      <Outlet />
    </div>
  );
};
