// App.jsx
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import SubscriptionForm from "./pages/SubscriptionForm";
import SubscriptionDetail from "./pages/SubscriptionDetail";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Everything inside this <Route> is gated by ProtectedRoute. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscriptions/new" element={<SubscriptionForm />} />
          <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
          <Route path="/subscriptions/:id/edit" element={<SubscriptionForm />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
