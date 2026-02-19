import { recoverMessageAddress } from "viem";
import { abstractTestnet } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { AgwSessionData } from "../../src/session/types.js";
import { createGetBalancesTool } from "../../src/tools/get-balances.js";
import { createGetTokenListTool } from "../../src/tools/get-token-list.js";
import { getWalletAddressTool } from "../../src/tools/get-wallet-address.js";
import { sendTransactionTool } from "../../src/tools/send-transaction.js";
import { signMessageTool } from "../../src/tools/sign-message.js";
import type { ToolContext } from "../../src/tools/types.js";
import { Logger } from "../../src/utils/logger.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945388cf0f5ddf3cd34e3c5d6f6e64f5f4a799";
const liveE2EEnabled = process.env.AGW_E2E_ENABLED === "1";
const describeLive = liveE2EEnabled ? describe : describe.skip;

function buildSession(chainId: number = abstractTestnet.id, accountAddress = "0x1111111111111111111111111111111111111111"): AgwSessionData {
  const now = Math.floor(Date.now() / 1000);
  const signer = privateKeyToAccount(PRIVATE_KEY).address;

  return {
    accountAddress,
    chainId,
    expiresAt: now + 3600,
    createdAt: now,
    updatedAt: now,
    status: "active",
    sessionConfig: {
      signer,
      expiresAt: String(now + 3600),
      feeLimit: {
        limitType: 1,
        limit: "1000000000000000000",
        period: "0",
      },
      maxValuePerUse: "1000000000000000000",
      callPolicies: [
        {
          target: "0x3333333333333333333333333333333333333333",
          selector: "0xa9059cbb",
        },
      ],
      transferPolicies: [
        {
          tokenAddress: ZERO_ADDRESS,
          maxAmountBaseUnit: "1000",
        },
      ],
    },
    sessionSignerRef: {
      kind: "raw",
      value: PRIVATE_KEY,
    },
  };
}

describe("abstract workflow harness (default dry-run)", () => {
  it("executes a signed-message + send-transaction workflow through tool handlers", async () => {
    const session = buildSession();
    const signerAccount = privateKeyToAccount(PRIVATE_KEY);
    const signMessage = jest.fn<Promise<`0x${string}`>, [{ message: string }]>(async ({ message }) =>
      signerAccount.signMessage({ message }),
    );
    const sendTransaction = jest.fn<Promise<`0x${string}`>, [Record<string, unknown>]>(async () =>
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
    const context: ToolContext = {
      sessionManager: {
        getSession: () => session,
        getSessionStatus: () => "active",
        createSessionClient: jest.fn(() => ({ signMessage, sendTransaction })) as unknown as ToolContext["sessionManager"]["createSessionClient"],
      } as unknown as ToolContext["sessionManager"],
      logger: new Logger("test"),
    };

    const walletAddress = (await getWalletAddressTool.handler({}, context)) as Record<string, unknown>;
    expect(walletAddress.connected).toBe(true);
    expect(walletAddress.accountAddress).toBe(session.accountAddress);

    const message = "agw e2e dry-run";
    const signed = (await signMessageTool.handler({ message }, context)) as Record<string, unknown>;
    const recovered = await recoverMessageAddress({
      message,
      signature: signed.signature as `0x${string}`,
    });
    expect(recovered.toLowerCase()).toBe((session.sessionConfig.signer as string).toLowerCase());

    const preview = (await sendTransactionTool.handler(
      {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "1",
      },
      context,
    )) as Record<string, unknown>;
    expect(preview.broadcast).toBe(false);
    expect(preview.preview).toBe(true);

    const executed = (await sendTransactionTool.handler(
      {
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb0000000000000000000000000000000000000000000000000000000000000001",
        value: "1",
        execute: true,
      },
      context,
    )) as Record<string, unknown>;
    expect(executed.broadcast).toBe(true);
    expect(sendTransaction).toHaveBeenCalledTimes(1);
  });
});

describeLive("abstract workflow harness (live read-only probes)", () => {
  it("queries live balances and token holdings with explicit e2e env", async () => {
    const requiredEnv = ["AGW_E2E_ACCOUNT", "AGW_E2E_RPC_URL"];
    for (const key of requiredEnv) {
      expect(process.env[key]).toBeTruthy();
    }

    const chainId = Number.parseInt(process.env.AGW_E2E_CHAIN_ID ?? String(abstractTestnet.id), 10);
    const accountAddress = process.env.AGW_E2E_ACCOUNT as string;
    const originalRpc = process.env.AGW_MCP_RPC_URL;
    process.env.AGW_MCP_RPC_URL = process.env.AGW_E2E_RPC_URL;
    const session = buildSession(chainId, accountAddress);
    const context: ToolContext = {
      sessionManager: {
        getSession: () => session,
        getSessionStatus: () => "active",
        getChainId: () => chainId,
      } as unknown as ToolContext["sessionManager"],
      logger: new Logger("test"),
    };

    try {
      const getBalancesTool = createGetBalancesTool();
      const getTokenListTool = createGetTokenListTool();
      const balances = (await getBalancesTool.handler({}, context)) as Record<string, unknown>;
      expect(balances.connected).toBe(true);
      expect(balances.accountAddress).toBe(accountAddress);
      expect(balances.nativeBalance).toBeTruthy();

      const tokens = (await getTokenListTool.handler({}, context)) as Record<string, unknown>;
      expect(tokens.connected).toBe(true);
      expect(tokens.accountAddress).toBe(accountAddress);
      expect(Array.isArray(tokens.tokenHoldings)).toBe(true);
    } finally {
      if (originalRpc === undefined) {
        delete process.env.AGW_MCP_RPC_URL;
      } else {
        process.env.AGW_MCP_RPC_URL = originalRpc;
      }
    }
  });
});
