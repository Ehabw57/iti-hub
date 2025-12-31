import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

/**
 * Auth layout with minimal navbar for login, register, and password reset pages
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Row 1 - Top */}
        <div className="absolute top-[8%] left-[10%] w-32 h-32 bg-primary-100  rounded-full opacity-70 dark:opacity-25 animate-float-slow" />
        <div className="absolute top-[10%] left-[55%] w-28 h-28 bg-primary-100  rounded-2xl opacity-65 dark:opacity-25 animate-float-slower" style={{ transform: 'rotate(15deg)' }} />
        <div className="absolute top-[12%] right-[8%] w-36 h-24 bg-primary-100  rounded-2xl opacity-70 dark:opacity-25 animate-float-slow" style={{ transform: 'rotate(-20deg)' }} />

        {/* Row 2 - Upper Middle */}
        <div className="absolute top-[32%] left-[5%] w-40 h-28 bg-primary-100  rounded-2xl opacity-65 dark:opacity-25 animate-float-slower" style={{ transform: 'rotate(12deg)' }} />
        <div className="absolute top-[35%] left-[48%] w-24 h-24 bg-primary-100  rounded-lg opacity-70 dark:opacity-25 animate-float-slow" style={{ transform: 'rotate(45deg)' }} />
        <div className="absolute top-[30%] right-[12%] w-32 h-32 bg-primary-100  rounded-full opacity-65 dark:opacity-25 animate-float-slower" />

        {/* Row 3 - Center */}
        <div className="absolute top-[52%] left-[20%] w-28 h-28 bg-primary-100  rounded-full opacity-70 dark:opacity-25 animate-float-slow" />
        <div className="absolute top-[55%] right-[25%] w-36 h-24 bg-primary-100  rounded-2xl opacity-65 dark:opacity-25 animate-float-slower" style={{ transform: 'rotate(-15deg)' }} />

        {/* Row 4 - Lower */}
        <div className="absolute bottom-[20%] left-[8%] w-40 h-28 bg-primary-100  rounded-2xl opacity-70 dark:opacity-25 animate-float-slower" style={{ transform: 'rotate(18deg)' }} />
        <div className="absolute bottom-[22%] left-[50%] w-32 h-32 bg-primary-100  rounded-full opacity-65 dark:opacity-25 animate-float-slow" />
        <div className="absolute bottom-[18%] right-[10%] w-28 h-28 bg-primary-100  rounded-lg opacity-70 dark:opacity-25 animate-float-slower" style={{ transform: 'rotate(-30deg)' }} />
      </div>

      {/* Minimal Navbar - Only logo, theme switcher, and language switcher */}
      <Navbar variant="minimal" />

      {/* Main content area - centered vertically and horizontally */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-1">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
