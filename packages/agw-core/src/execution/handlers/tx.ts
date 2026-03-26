import { AgwCliError } from "../../errors.js";
import { assertToolAllowedByPolicyMeta } from "../../policy/meta.js";
import { previewTransactionTool } from "../../tools/preview-transaction.js";
import { sendCallsTool } from "../../tools/send-calls.js";
import { sendTransactionTool } from "../../tools/send-transaction.js";
import { signMessageTool } from "../../tools/sign-message.js";
import { signTransactionTool } from "../../tools/sign-transaction.js";
import { transferTokenTool } from "../../tools/transfer-token.js";
import { requireActiveSession } from "../context.js";
import type { CommandHandler } from "../types.js";
import {
  assertAddressString,
  assertDecimalString,
  assertHexString,
  parseOptionalBoolean,
} from "../validation.js";

export const txHandlers: Record<string, CommandHandler> = {
  "tx.preview": async (input, context) =>
    previewTransactionTool.handler(
      { to: input.to, data: input.data, value: input.value },
      context,
    ),
  "tx.send": async (input, context) =>
    sendTransactionTool.handler(
      {
        to: input.to,
        data: input.data,
        value: input.value,
        execute: parseOptionalBoolean(input.execute, "execute"),
      },
      context,
    ),
  "tx.calls": async (input, context) =>
    sendCallsTool.handler(
      {
        calls: input.calls,
        execute: parseOptionalBoolean(input.execute, "execute"),
      },
      context,
    ),
  "tx.sign-message": async (input, context) => {
    const session = requireActiveSession(context);
    assertToolAllowedByPolicyMeta(session, "sign_message");

    if (typeof input.message !== "string") {
      throw new AgwCliError("INVALID_INPUT", "message must be a string", 2);
    }

    const execute = input.execute === true;
    if (!execute) {
      return {
        preview: true,
        requiresExplicitExecute: true,
        action: "sign_message",
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        message: input.message,
      };
    }

    return signMessageTool.handler({ message: input.message }, context);
  },
  "tx.sign-transaction": async (input, context) => {
    const session = requireActiveSession(context);
    assertToolAllowedByPolicyMeta(session, "sign_transaction");

    const execute = input.execute === true;
    if (!execute) {
      const to = assertAddressString(input.to, "to");
      const data = assertHexString(input.data, "data");
      const value =
        input.value === undefined
          ? "0"
          : assertDecimalString(input.value, "value");
      return {
        preview: true,
        requiresExplicitExecute: true,
        action: "sign_transaction",
        accountAddress: session.accountAddress,
        chainId: session.chainId,
        transaction: {
          to,
          data,
          value,
        },
      };
    }

    return signTransactionTool.handler(
      { to: input.to, data: input.data, value: input.value },
      context,
    );
  },
  "tx.transfer-token": async (input, context) =>
    transferTokenTool.handler(
      {
        tokenAddress: input.tokenAddress ?? input.token,
        to: input.to,
        amount: input.amount,
        execute: parseOptionalBoolean(input.execute, "execute"),
      },
      context,
    ),
};
