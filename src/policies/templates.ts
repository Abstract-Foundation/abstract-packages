export interface CallPolicy {
  target: string;
  selector?: string;
}

export interface TransferPolicy {
  target: string;
  maxValuePerUse: string;
}

export interface PolicyTemplate {
  name: "transfer";
  expiresInSeconds: number;
  callPolicies: CallPolicy[];
  transferPolicies: TransferPolicy[];
}

export const TRANSFER_TEMPLATE: PolicyTemplate = {
  name: "transfer",
  expiresInSeconds: 3600,
  callPolicies: [],
  transferPolicies: [],
};
