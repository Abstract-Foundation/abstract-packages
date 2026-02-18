export interface CallPolicy {
  target: string;
  selector?: string;
}

export interface TransferPolicy {
  tokenAddress: string;
  maxAmountBaseUnit: string;
}

export interface PolicyTemplate {
  name: "read_and_sign" | "limited_spend";
  expiresInSeconds: number;
  callPolicies: CallPolicy[];
  transferPolicies: TransferPolicy[];
}

export const READ_AND_SIGN_TEMPLATE: PolicyTemplate = {
  name: "read_and_sign",
  expiresInSeconds: 3600,
  callPolicies: [],
  transferPolicies: [],
};

export const LIMITED_SPEND_TEMPLATE: PolicyTemplate = {
  name: "limited_spend",
  expiresInSeconds: 3600,
  callPolicies: [],
  transferPolicies: [
    {
      tokenAddress: "0x0000000000000000000000000000000000000000",
      maxAmountBaseUnit: "10000000000000000",
    },
  ],
};
