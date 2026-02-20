import { isAddress, type Address, type Hex } from "viem";
import { createAgwActionAdapter } from "../agw/actions.js";
import { canCallTargetWithData, canTransferNativeValue } from "../policies/validate.js";
import { assertMainnetPolicyRegistryPreflight } from "../session/mainnet-preflight.js";
import { resolveToolNetworkConfig } from "./network.js";
import type { ToolHandler } from "./types.js";

interface ParsedCall {
  to: Address;
  data: Hex;
  value: bigint;
  valueRaw: string;
}

function parseExecute(value: unknown): boolean {
  if (value === undefined) {
    return false;
  }
  if (typeof value !== "boolean") {
    throw new Error("execute must be a boolean");
  }
  return value;
}

function parseCalls(value: unknown): ParsedCall[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("calls must be a non-empty array");
  }

  const parsed: ParsedCall[] = [];
  for (const [index, call] of value.entries()) {
    if (!call || typeof call !== "object") {
      throw new Error(`calls[${index}] must be an object`);
    }
    const record = call as Record<string, unknown>;

    if (typeof record.to !== "string" || !isAddress(record.to)) {
      throw new Error(`calls[${index}].to must be a valid 0x-prefixed address`);
    }
    if (typeof record.data !== "string" || !/^0x[0-9a-fA-F]*$/.test(record.data) || record.data.length % 2 !== 0) {
      throw new Error(`calls[${index}].data must be a 0x-prefixed hex string with even length`);
    }

    const valueRaw = record.value === undefined ? "0" : String(record.value);
    if (!/^\d+$/.test(valueRaw)) {
      throw new Error(`calls[${index}].value must be a non-negative integer string`);
    }

    parsed.push({
      to: record.to,
      data: record.data as Hex,
      value: BigInt(valueRaw),
      valueRaw,
    });
  }

  return parsed;
}

export const sendCallsTool: ToolHandler = {
  name: "send_calls",
  description: "Executes AGW sendCalls (EIP-5792 batch calls) with explicit call-array validation and policy preflight.",
  inputSchema: {
    type: "object",
    properties: {
      calls: {
        type: "array",
        description: "Array of call objects: {to, data, value?}",
      },
      execute: {
        type: "boolean",
        description: "Broadcast when true; preview only when omitted/false",
        default: false,
      },
    },
    required: ["calls"],
  },
  handler: async (params, context) => {
    const calls = parseCalls(params.calls);
    const execute = parseExecute(params.execute);

    const status = context.sessionManager.getSessionStatus();
    if (status !== "active") {
      throw new Error(`session must be active (current status: ${status})`);
    }

    const session = context.sessionManager.getSession();
    if (!session) {
      throw new Error("session is missing");
    }

    for (const [index, call] of calls.entries()) {
      if (!canCallTargetWithData(session.sessionConfig, call.to, call.data)) {
        throw new Error(`send_calls rejected: call policy does not allow calls[${index}] target/selector`);
      }
      if (!canTransferNativeValue(session.sessionConfig, call.value)) {
        throw new Error(`send_calls rejected: transfer policy does not allow calls[${index}] native value`);
      }
    }

    if (!execute) {
      return {
        preview: true,
        execute: false,
        requiresExplicitExecute: true,
        callCount: calls.length,
        calls: calls.map(call => ({
          to: call.to,
          data: call.data,
          value: call.valueRaw,
        })),
      };
    }

    const networkConfig = resolveToolNetworkConfig(context, session.chainId);
    for (const call of calls) {
      await assertMainnetPolicyRegistryPreflight({
        chainId: session.chainId,
        to: call.to,
        data: call.data,
        value: call.value,
        rpcUrl: networkConfig.rpcUrl,
      });
    }

    const sessionClient = context.sessionManager.createSessionClient({
      chain: networkConfig.chain,
      rpcUrl: networkConfig.rpcUrl,
    });
    const agwActions = createAgwActionAdapter(sessionClient);
    const result = await agwActions.sendCalls({
      calls: calls.map(call => ({
        to: call.to,
        data: call.data,
        value: call.value,
      })),
    });

    return {
      execute: true,
      accountAddress: session.accountAddress,
      chainId: session.chainId,
      id: result.id,
      capabilities: result.capabilities ?? {},
      callCount: calls.length,
      calls: calls.map(call => ({
        to: call.to,
        data: call.data,
        value: call.valueRaw,
      })),
    };
  },
};
