"use agent";
import { useMcpConnection, useModel } from "@flue/runtime";
import { shippingConnection } from "../connection";
import { required } from "../env";

export function ShippingAssistant() {
  useModel(required("FLUE_MODEL"));
  useMcpConnection(shippingConnection());
  return "Answer shipping questions using get-shipping-policy. Do not invent store policies.";
}
