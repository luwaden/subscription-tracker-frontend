// pages/SignUp.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signUp, selectAuthStatus, selectAuthError } from "../features/auth/authSlice";
import FormError from "../components/FormError";

export default function SignUp() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Read loading/error state straight from the store, instead of keeping
  // separate local state for it — the thunk's pending/fulfilled/rejected
  // lifecycle already tracks this for us in authSlice.
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    // dispatch(...) returns a Promise. .unwrap() either resolves with the
    // thunk's payload (on success) or throws (on failure) — much nicer to
    // work with here than manually checking action.meta.requestStatus.
    const result = await dispatch(signUp({ name, email, password }));
    if (signUp.fulfilled.match(result)) {
      navigate("/dashboard");
    }
    // If it failed, `error` above is already populated by the reducer —
    // no extra handling needed here.
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">
        Create your account
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={error} />

        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-md bg-brand-500 py-2 font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {status === "loading" ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/sign-in" className="text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
