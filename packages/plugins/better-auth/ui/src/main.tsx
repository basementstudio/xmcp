import { createBrowserRouter, RouterProvider } from "react-router";
import { SignInPage } from "./components/sign-in";
import "./index.css";
import ReactDOM from "react-dom/client";
import { GoogleCallback } from "./components/callback/google";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

const router = createBrowserRouter([
  {
    path: "/auth/sign-in",
    element: <SignInPage />,
  },
  {
    path: "/auth/callback/google",
    element: <GoogleCallback />,
  },
]);

ReactDOM.createRoot(root).render(<RouterProvider router={router} />);
