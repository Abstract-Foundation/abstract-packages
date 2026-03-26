import { encodeFunctionData } from "viem";
import { AgwCliError } from "../../errors.js";
import { assertToolAllowedByPolicyMeta } from "../../policy/meta.js";
import { deployContractTool } from "../../tools/deploy-contract.js";
import { writeContractTool } from "../../tools/write-contract.js";
import type { CommandHandler } from "../types.js";
import { requireActiveSession } from "../context.js";
import { assertAddressString, assertDecimalString, parseOptionalBoolean } from "../validation.js";

export const contractHandlers: Record<string, CommandHandler> = {
  "contract.write": async (input, context) => {
    const session = requireActiveSession(context);
    assertToolAllowedByPolicyMeta(session, "write_contract");

    const execute = input.execute === true;
    if (!execute) {
      const address = assertAddressString(input.address, "address");
      if (typeof input.functionName !== "string") {
        throw new AgwCliError("INVALID_INPUT", "functionName must be a string", 2);
      }
      if (!Array.isArray(input.abi)) {
        throw new AgwCliError("INVALID_INPUT", "abi must be an array", 2);
      }
      if (input.args !== undefined && !Array.isArray(input.args)) {
        throw new AgwCliError("INVALID_INPUT", "args must be an array when provided", 2);
      }
      const value = input.value === undefined ? "0" : assertDecimalString(input.value, "value");

      try {
        encodeFunctionData({
          abi: input.abi as never,
          functionName: input.functionName,
          args: Array.isArray(input.args) ? input.args : undefined,
        } as never);
      } catch {
        throw new AgwCliError("INVALID_INPUT", "invalid abi/functionName/args payload", 2);
      }

      return {
        preview: true,
        requiresExplicitExecute: true,
        action: "write_contract",
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        contract: {
          address,
          functionName: input.functionName,
          args: Array.isArray(input.args) ? input.args : [],
          value,
        },
      };
    }

    return writeContractTool.handler(
      {
        address: input.address,
        abi: input.abi,
        functionName: input.functionName,
        args: input.args,
        value: input.value,
      },
      context,
    );
  },
  "contract.deploy": async (input, context) =>
    deployContractTool.handler(
      {
        abi: input.abi,
        bytecode: input.bytecode,
        execute: parseOptionalBoolean(input.execute, "execute"),
      },
      context,
    ),
};
