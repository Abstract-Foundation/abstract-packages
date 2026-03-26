export interface PrivyAuthKeyRef {
  kind: "keyfile";
  value: string;
}

export interface PrivySignerConfig {
  walletId: string;
  authKeyRef: PrivyAuthKeyRef;
}

export interface PrivyWalletRpcRequest {
  method: string;
  caip2: string;
  chain_type: "ethereum";
  params: {
    transaction?: PrivyTransactionRequest;
    message?: string;
    typedData?: string;
  };
}

export interface PrivyTransactionRequest {
  to?: string;
  data?: string;
  value?: string;
  from?: string;
  chain_id?: string;
}

export interface PrivyWalletRpcResponse {
  data: {
    signature?: string;
    signed_transaction?: string;
    result?: string;
  };
}

export interface PrivyWalletRpcErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PrivyPolicyRuleCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "not_in" | "in_condition_set";
  value: string | number | string[];
}

export interface PrivyPolicyRule {
  method: string;
  effect: "ALLOW" | "DENY";
  conditions?: PrivyPolicyRuleCondition[];
  abi?: readonly Record<string, unknown>[];
}

export interface PrivyPolicy {
  id?: string;
  name: string;
  rules: PrivyPolicyRule[];
}

export interface PrivyKeyQuorum {
  id?: string;
  authorization_key: string;
  authorization_key_algorithm: "p256";
}

export interface PrivySignerBundlePayload {
  accountAddress: string;
  chainId: number;
  policyMeta?: import("../session/types.js").SessionPolicyMeta;
}
