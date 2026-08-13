// components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, signOut } from "../features/auth/authSlice";

export default function Navbar() {
  // useSelector subscribes this component to a slice of the store — React
  // will re-render Navbar automatically whenever state.auth.user changes.
  const user = useSelector(selectCurrentUser);

  // useDispatch gives us the function used to send actions to the store.
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSignOut() {
    // dispatch(signOut()) runs the thunk: it calls the API, then the
    // reducer clears user/token from the store once it resolves.
    // .unwrap() turns a rejected thunk back into a normal thrown Promise
    // rejection, which we don't even need to catch here.
    await dispatch(signOut());
    navigate("/sign-in");
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-brand-600">
          Subscription Tracker
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <span className="text-gray-600">Hi, {user.name}</span>
              <button
                onClick={handleSignOut}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="text-gray-700 hover:text-brand-600">
                Sign in
              </Link>
              <Link
                to="/sign-up"
                className="rounded-md bg-brand-500 px-3 py-1.5 text-white hover:bg-brand-600"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
