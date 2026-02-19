import type { Abi, Address, Hex } from "viem";

export interface AgwSignMessageParameters {
  message: string;
}

export type AgwSignMessageReturnType = `0x${string}`;

export interface AgwSignTransactionParameters {
  account: Address;
  to: Address;
  data: Hex;
  value: bigint;
  chain: null | undefined;
}

export type AgwSignTransactionReturnType = `0x${string}`;

export interface AgwSendTransactionParameters {
  account: Address;
  to: Address;
  data: Hex;
  value: bigint;
  chain: null | undefined;
}

export type AgwSendTransactionReturnType = `0x${string}`;

export interface AgwSendCallsParameters {
  calls: readonly Record<string, unknown>[];
  [key: string]: unknown;
}

export interface AgwSendCallsReturnType {
  id: string;
  capabilities?: Record<string, unknown>;
}

export interface AgwWriteContractParameters {
  account: Address;
  address: Address;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
  chain: null | undefined;
}

export type AgwWriteContractReturnType = `0x${string}`;

export interface AgwDeployContractParameters {
  account: Address;
  abi: Abi | readonly unknown[];
  bytecode: Hex;
  chain: null | undefined;
}

export type AgwDeployContractReturnType = `0x${string}`;

export interface AgwActionAdapter {
  signMessage: (args: AgwSignMessageParameters) => Promise<AgwSignMessageReturnType>;
  signTransaction: (args: AgwSignTransactionParameters) => Promise<AgwSignTransactionReturnType>;
  sendTransaction: (args: AgwSendTransactionParameters) => Promise<AgwSendTransactionReturnType>;
  sendCalls: (args: AgwSendCallsParameters) => Promise<AgwSendCallsReturnType>;
  writeContract: (args: AgwWriteContractParameters) => Promise<AgwWriteContractReturnType>;
  deployContract: (args: AgwDeployContractParameters) => Promise<AgwDeployContractReturnType>;
}

type ActionName = keyof AgwActionAdapter;
type AgwActionMethod = (args: unknown) => Promise<unknown>;

async function invokeAction<TArgs, TReturn>(client: unknown, actionName: ActionName, args: TArgs): Promise<TReturn> {
  const candidate = (client as Record<string, unknown>)[actionName];
  if (typeof candidate !== "function") {
    throw new Error(`AGW action adapter missing client method: ${actionName}`);
  }

  const action = candidate as AgwActionMethod;
  return (await Reflect.apply(action, client as object, [args])) as TReturn;
}

export function createAgwActionAdapter(client: unknown): AgwActionAdapter {
  return {
    signMessage: args => invokeAction<AgwSignMessageParameters, AgwSignMessageReturnType>(client, "signMessage", args),
    signTransaction: args =>
      invokeAction<AgwSignTransactionParameters, AgwSignTransactionReturnType>(client, "signTransaction", args),
    sendTransaction: args =>
      invokeAction<AgwSendTransactionParameters, AgwSendTransactionReturnType>(client, "sendTransaction", args),
    sendCalls: args => invokeAction<AgwSendCallsParameters, AgwSendCallsReturnType>(client, "sendCalls", args),
    writeContract: args => invokeAction<AgwWriteContractParameters, AgwWriteContractReturnType>(client, "writeContract", args),
    deployContract: args =>
      invokeAction<AgwDeployContractParameters, AgwDeployContractReturnType>(client, "deployContract", args),
  };
}
