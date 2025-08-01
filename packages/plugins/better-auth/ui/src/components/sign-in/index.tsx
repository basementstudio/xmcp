import { useEffect, useState } from "react";
import { SignInPageEmail } from "./email";
import { SignInPageGoogle } from "./google";
import { SignInPageEmailGoogle } from "./email-google";
import { SignInPage as SignInPageType } from "../../../../src/provider";

const SignInPage = () => {
  const [config, setConfig] = useState<SignInPageType | null>(null);

  useEffect(() => {
    fetch("/auth/config")
      .then((response) => response.json())
      .then((config) => setConfig(config))
      .catch(() => {});
  }, []);

  if (config === "email") {
    return <SignInPageEmail />;
  }
  if (config === "google") {
    return <SignInPageGoogle />;
  }
  if (config === "email-google") {
    return <SignInPageEmailGoogle />;
  }

  return <div>No config found</div>;
};

export { SignInPage };
