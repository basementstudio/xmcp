import { mppProvider } from "@xmcp-dev/mpp";

export default mppProvider({
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  debug: true,
  defaults: {
    amount: "1",
    currency: "usd",
  },
});
