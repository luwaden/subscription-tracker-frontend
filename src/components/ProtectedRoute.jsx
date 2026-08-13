// components/ProtectedRoute.jsx
//
// Guards pages that require login. Reads straight from the Redux store
// via useSelector — no Context needed, because Redux's <Provider> (set up
// in main.jsx) already makes the store available everywhere.

import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../features/auth/authSlice";

export default function ProtectedRoute() {
  const user = useSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  // <Outlet/> renders whichever nested route matched, so one
  // ProtectedRoute can guard many pages without repeating this check.
  return <Outlet />;
}
