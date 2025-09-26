export interface Configuration {
  type?: "production" | "sandbox";
  token: string;
  organizationId: string;
  productId: string;
}

export interface CustomerData {
  id: string;
  external_id: string;
}

export interface ValidateLicenseKeyResponse {
  status: "granted" | "denied";
  usage: number;
  limit_usage: number | null;
  limit_activations: number | null;
  expires_at: string | null;
  validations: number;
  key: string;
  display_key: string;
  customer: CustomerData;
}

export interface ValidateLicenseKeyResult {
  valid: boolean;
  code: string;
  message: string;
}

export interface CheckoutResponse {
  id: string;
  url: string;
}

export interface UsageResult {
  hasUsage: boolean;
  message?: string;
}

export interface ProductBenefit {
  id: string;
  type: string;
  meter_id?: string;
  description?: string;
  selectable?: boolean;
  deletable?: boolean;
  organization_id?: string;
  created_at?: string;
  modified_at?: string;
}

export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  benefits: ProductBenefit[];
  organization_id: string;
  is_recurring: boolean;
  is_archived: boolean;
  created_at: string;
  modified_at: string;
}

export interface GrantedBenefit {
  id: string;
  benefit_id: string;
  benefit_type: string;
  benefit_metadata?: Record<string, any>;
  properties?: Record<string, any>;
  granted_at: string;
  created_at: string;
  modified_at: string;
}

export interface ActiveMeter {
  id: string;
  meter_id: string;
  consumed_units: number;
  credited_units: number;
  balance: number;
  created_at: string;
  modified_at: string;
}

export interface CustomerStateResponse {
  id: string;
  email?: string;
  name?: string;
  external_id?: string;
  organization_id: string;
  granted_benefits: GrantedBenefit[];
  active_meters: ActiveMeter[];
  active_subscriptions: any[];
  created_at: string;
  modified_at?: string;
}

export interface EventPayload {
  events: Array<
    Event & {
      customer_id?: string;
    }
  >;
}

export interface Event {
  name: string;
  metadata: Record<string, string | number>;
}
export interface EventIngestResponse {
  success?: boolean;
  error?: string;
  message?: string;
}
