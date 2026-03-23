import { getPortalUserProfile } from "../integrations/portal/client.js";
import type { ToolHandler } from "./types.js";

export const portalGetUserProfileTool: ToolHandler = {
  name: "portal_get_user_profile",
  description: "Get a user profile from Abstract Portal API by wallet address.",
  inputSchema: {
    type: "object",
    properties: {
      address: {
        type: "string",
        description: "Optional wallet address. Uses locally linked wallet address when omitted.",
      },
    },
  },
  handler: async (params, context) => {
    const sessionAddress = context.sessionManager.getSession()?.accountAddress;
    const targetAddress =
      typeof params.address === "string" && params.address.trim().length > 0
        ? params.address
        : sessionAddress;

    if (!targetAddress) {
      throw new Error("address is required when no local wallet is linked. Run `agw auth init` or pass address explicitly.");
    }

    const profile = await getPortalUserProfile(targetAddress);
    return {
      profile,
      sourceAddress: targetAddress,
      source: params.address ? "explicit" : "session",
    };
  },
};
