import "./index.css";
import ReactDOM from "react-dom/client";
import { SignInPage } from "./components/sign-in/email";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(<SignInPage />);
