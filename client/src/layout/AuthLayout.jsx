import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";

/**
 * Auth layout with minimal navbar for login, register, and password reset pages
 */
export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Minimal Navbar - Only logo, theme switcher, and language switcher */}
      <Navbar variant="minimal" />

      {/* Main content area - centered vertically and horizontally */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
