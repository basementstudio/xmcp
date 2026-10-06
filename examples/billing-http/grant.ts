import { openStore } from "./src/store.js";
const store = openStore();
try {
  store.grant(process.env.BILLING_CUSTOMER_ID!, Number(process.argv[2]));
} finally {
  store.close();
}
