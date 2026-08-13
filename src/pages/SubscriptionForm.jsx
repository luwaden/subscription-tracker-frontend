// pages/SubscriptionForm.jsx
//
// One component handles BOTH "create" (/subscriptions/new) and "edit"
// (/subscriptions/:id/edit) — we tell which mode we're in by checking
// whether the URL has an :id param.

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  createSubscription,
  updateSubscription,
  fetchSubscriptionById,
  selectSubscriptionById,
  selectFormStatus,
  selectFormError,
  clearFormError,
} from "../features/subscriptions/subscriptionsSlice";
import FormError from "../components/FormError";

const emptyForm = {
  name: "",
  price: "",
  currency: "USD",
  frequency: "monthly",
  category: "entertainment",
  paymentMethod: "",
  startDate: new Date().toISOString().slice(0, 10),
};

export default function SubscriptionForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // selectSubscriptionById(id) is a "selector factory" — it returns a
  // selector scoped to this one id, so useSelector only re-renders this
  // component when THIS subscription changes, not the whole list.
  const existing = useSelector(selectSubscriptionById(id));
  const formStatus = useSelector(selectFormStatus);
  const formError = useSelector(selectFormError);

  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // In edit mode, make sure we have the subscription's data, then pre-fill
  // the form with it.
  useEffect(() => {
    if (!isEditMode) return;

    if (existing) {
      setForm({
        name: existing.name,
        price: String(existing.price),
        currency: existing.currency,
        frequency: existing.frequency,
        category: existing.category,
        paymentMethod: existing.paymentMethod,
        startDate: existing.startDate.slice(0, 10),
      });
      setIsLoading(false);
    } else {
      // Not in the store yet (e.g. user refreshed directly on this page) —
      // go fetch it.
      dispatch(fetchSubscriptionById(id)).finally(() => setIsLoading(false));
    }
  }, [id, isEditMode, existing, dispatch]);

  useEffect(() => {
    return () => dispatch(clearFormError());
  }, [dispatch]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price) };

    const action = isEditMode
      ? updateSubscription({ id, payload })
      : createSubscription(payload);

    const result = await dispatch(action);

    if (createSubscription.fulfilled.match(result) || updateSubscription.fulfilled.match(result)) {
      navigate(`/subscriptions/${result.payload._id}`);
    }
  }

  if (isLoading) {
    return <p className="mx-auto mt-16 max-w-lg text-gray-500">Loading...</p>;
  }

  return (
    <div className="mx-auto mt-10 max-w-lg px-4">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        {isEditMode ? "Edit subscription" : "Add a subscription"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Netflix"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Price</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => updateField("currency", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Frequency</label>
            <select
              value={form.frequency}
              onChange={(e) => updateField("frequency", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="entertainment">Entertainment</option>
              <option value="productivity">Productivity</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment method</label>
          <input
            type="text"
            required
            value={form.paymentMethod}
            onChange={(e) => updateField("paymentMethod", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Visa ending in 4242"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Start date</label>
          <input
            type="date"
            required
            max={new Date().toISOString().slice(0, 10)}
            value={form.startDate}
            onChange={(e) => updateField("startDate", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={formStatus === "loading"}
          className="w-full rounded-md bg-brand-500 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {formStatus === "loading"
            ? "Saving..."
            : isEditMode
            ? "Save changes"
            : "Add subscription"}
        </button>
      </form>
    </div>
  );
}
