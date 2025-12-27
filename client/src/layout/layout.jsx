import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { GlobalNotificationHandler } from "../components/notifications/GlobalNotificationHandler";
import { useAuthStore } from "@store/auth";

export default function Layout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <>
      <Navbar />
      {/* Global notification handler - manages real-time updates across all pages */}
      {isAuthenticated && <GlobalNotificationHandler />}
      <Outlet />
    </>
  );
}