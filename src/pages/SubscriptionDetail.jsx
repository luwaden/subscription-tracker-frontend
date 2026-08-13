// pages/SubscriptionDetail.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSubscriptionById,
  deleteSubscription,
  selectSubscriptionById,
} from "../features/subscriptions/subscriptionsSlice";

export default function SubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const subscription = useSelector(selectSubscriptionById(id));
  const [isLoading, setIsLoading] = useState(!subscription);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (subscription) {
      setIsLoading(false);
      return;
    }
    dispatch(fetchSubscriptionById(id))
      .unwrap()
      .catch((message) => setError(message))
      .finally(() => setIsLoading(false));
  }, [id, subscription, dispatch]);

  async function handleDelete() {
    if (!confirm("Delete this subscription? This can't be undone.")) return;
    setIsDeleting(true);
    const result = await dispatch(deleteSubscription(id));
    if (deleteSubscription.fulfilled.match(result)) {
      navigate("/dashboard");
    } else {
      setError(result.payload);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <p className="mx-auto mt-16 max-w-lg text-gray-500">Loading...</p>;
  }

  if (error || !subscription) {
    return (
      <p className="mx-auto mt-16 max-w-lg rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error || "Subscription not found."}
      </p>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-lg px-4">
      <Link to="/dashboard" className="text-sm text-brand-600 hover:underline">
        &larr; Back to dashboard
      </Link>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">{subscription.name}</h1>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium capitalize text-brand-700">
            {subscription.status}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Price</dt>
            <dd className="font-medium text-gray-900">
              {subscription.currency} {subscription.price.toFixed(2)} / {subscription.frequency}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Category</dt>
            <dd className="font-medium capitalize text-gray-900">{subscription.category}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Payment method</dt>
            <dd className="font-medium text-gray-900">{subscription.paymentMethod}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Start date</dt>
            <dd className="font-medium text-gray-900">
              {new Date(subscription.startDate).toLocaleDateString()}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-gray-500">Renews on</dt>
            <dd className="font-medium text-gray-900">
              {new Date(subscription.renewalDate).toLocaleDateString()}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          <Link
            to={`/subscriptions/${subscription._id}/edit`}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
