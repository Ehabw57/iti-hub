import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

export default function Layout() {
  const location = useLocation();
  const isAuth =
    /^\/(login|register|reset-password|password-reset)(\/.*)?$/.test(location.pathname) ||
    location.pathname.startsWith("/auth");

  return (
    <>
      <Navbar />
      {isAuth ? (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-100 via-pink-100 to-red-100 dark:from-rose-950 dark:via-red-950 dark:to-rose-900">
          {/* Animated Background Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Light Mode Circles - Soft pastels */}
            <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-rose-300/40 dark:bg-rose-600/50 rounded-full blur-[6px]"></div>
            <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-pink-300/35 dark:bg-pink-700/40 rounded-full blur-[6px]"></div>
            <div className="absolute -bottom-32 left-1/4 w-[450px] h-[450px] bg-red-200/40 dark:bg-red-600/45 rounded-full blur-[6px]"></div>
            
            {/* Medium Circles */}
            <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-rose-400/30 dark:bg-rose-500/40 rounded-full blur-[6px]"></div>
            <div className="absolute bottom-1/4 right-1/3 w-[280px] h-[280px] bg-pink-400/30 dark:bg-pink-600/45 rounded-full blur-[6px]"></div>
            
            {/* Small Circles */}
            <div className="absolute top-1/2 left-1/4 w-[200px] h-[200px] bg-red-300/35 dark:bg-red-500/40 rounded-full blur-[6px]"></div>
            <div className="absolute bottom-1/3 left-2/3 w-[220px] h-[220px] bg-rose-500/25 dark:bg-rose-600/45 rounded-full blur-[6px]"></div>
            <div className="absolute top-3/4 right-1/4 w-[180px] h-[180px] bg-pink-500/25 dark:bg-pink-500/40 rounded-full blur-[6px]"></div>
            <div className="absolute top-1/5 left-1/2 w-[160px] h-[160px] bg-red-400/30 dark:bg-red-700/40 rounded-full blur-[6px]"></div>
            
            {/* Extra small circles for more depth */}
            <div className="absolute top-2/3 right-1/2 w-[140px] h-[140px] bg-rose-600/20 dark:bg-rose-400/35 rounded-full blur-[6px]"></div>
            <div className="absolute bottom-1/2 left-1/5 w-[130px] h-[130px] bg-pink-600/25 dark:bg-pink-800/40 rounded-full blur-[6px]"></div>
          </div>

          {/* Overlay - subtle in light, more contrast in dark */}
          <div className="absolute inset-0 bg-white/5 dark:bg-black/20"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </>
  );
}
