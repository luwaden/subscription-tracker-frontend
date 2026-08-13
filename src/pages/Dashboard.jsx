// pages/Dashboard.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscriptions,
  selectAllSubscriptions,
  selectSubscriptionsStatus,
  selectSubscriptionsError,
} from "../features/subscriptions/subscriptionsSlice";
import SubscriptionCard from "../components/SubscriptionCard";

export default function Dashboard() {
  const dispatch = useDispatch();
  const subscriptions = useSelector(selectAllSubscriptions);
  const status = useSelector(selectSubscriptionsStatus);
  const error = useSelector(selectSubscriptionsError);

  // Fetch the list once when this page first mounts. The empty dependency
  // array ([]) means "run only on mount" — same idea as in plain React,
  // the only difference is we're dispatching a Redux thunk instead of
  // calling an API function and setting local state directly.
  useEffect(() => {
    dispatch(fetchSubscriptions());
  }, [dispatch]);

  const monthlyTotal = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const monthlyEquivalent =
        s.frequency === "yearly"
          ? s.price / 12
          : s.frequency === "weekly"
          ? s.price * 4.33
          : s.frequency === "daily"
          ? s.price * 30
          : s.price;
      return sum + monthlyEquivalent;
    }, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Your subscriptions</h1>
          {subscriptions.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              ~${monthlyTotal.toFixed(2)} / month across{" "}
              {subscriptions.filter((s) => s.status === "active").length} active subscriptions
            </p>
          )}
        </div>
        <Link
          to="/subscriptions/new"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          + Add subscription
        </Link>
      </div>

      {status === "loading" && <p className="text-gray-500">Loading...</p>}

      {status === "failed" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === "succeeded" && subscriptions.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No subscriptions yet.{" "}
          <Link to="/subscriptions/new" className="text-brand-600 hover:underline">
            Add your first one
          </Link>
          .
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subscriptions.map((sub) => (
          <SubscriptionCard key={sub._id} subscription={sub} />
        ))}
      </div>
    </div>
  );
}
