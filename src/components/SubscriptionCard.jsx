// components/SubscriptionCard.jsx
//
// This component doesn't talk to Redux at all — it just receives data as
// a prop and displays it. Not every component needs useSelector; "dumb"
// presentational components like this are easier to reuse and test.

import { Link } from "react-router-dom";

const statusStyles = {
  active: "bg-green-100 text-green-700",
  canceled: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-700",
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SubscriptionCard({ subscription }) {
  return (
    <Link
      to={`/subscriptions/${subscription._id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{subscription.name}</h3>
          <p className="text-sm text-gray-500 capitalize">
            {subscription.category} · {subscription.frequency}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
            statusStyles[subscription.status]
          }`}
        >
          {subscription.status}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-lg font-semibold text-brand-600">
          {subscription.currency} {subscription.price.toFixed(2)}
        </p>
        <p className="text-xs text-gray-500">
          Renews {formatDate(subscription.renewalDate)}
        </p>
      </div>
    </Link>
  );
}
