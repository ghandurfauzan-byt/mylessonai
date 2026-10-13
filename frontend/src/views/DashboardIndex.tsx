// src/pages/DashboardIndex.tsx — padanan app/dashboard/page.tsx. /dashboard
// sendiri bukan halaman final, hanya mengalihkan ke sub-dashboard sesuai role.

import { useSession } from "@/hooks/useSession";
import { Navigate } from "react-router-dom";

export default function DashboardIndex() {
  const { data } = useSession();
  const role = data?.role ?? "pelajar";
  return <Navigate to={`/dashboard/${role}`} replace />;
}
