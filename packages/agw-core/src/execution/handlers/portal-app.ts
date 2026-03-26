import type {
  AgwAppCatalogEntry,
  AgwAppContractRef,
} from "../../app-catalog.js";
import { getAppCatalogEntry, listSkillRefs } from "../../app-catalog.js";
import { AgwCliError } from "../../errors.js";
import type {
  PortalAppContract,
  PortalAppDetail,
  PortalAppListResponse,
  PortalAppSummary,
} from "../../integrations/portal/types.js";
import { portalGetAppTool } from "../../tools/portal-get-app.js";
import { portalGetUserProfileTool } from "../../tools/portal-get-user-profile.js";
import { portalListAppsTool } from "../../tools/portal-list-apps.js";
import { portalListStreamsTool } from "../../tools/portal-list-streams.js";
import type { ToolContext } from "../../tools/types.js";
import type { CommandHandler } from "../types.js";
import { parseOptionalBoolean, parseOptionalString } from "../validation.js";

const DEFAULT_APP_LIST_PAGE_SIZE = 20;

function normalizePortalContracts(
  contracts: PortalAppContract[] | undefined,
): AgwAppContractRef[] {
  if (!Array.isArray(contracts)) {
    return [];
  }

  return contracts
    .filter(
      (contract): contract is PortalAppContract =>
        Boolean(contract) &&
        typeof contract.address === "string" &&
        contract.address.trim() !== "" &&
        typeof contract.name === "string" &&
        contract.name.trim() !== "",
    )
    .map((contract) => ({
      address: contract.address,
      label: contract.name,
    }));
}

function mergeAppDetails(
  app: AgwAppCatalogEntry,
  liveApp: PortalAppDetail | null,
  contracts: AgwAppContractRef[],
): Record<string, unknown> {
  return {
    ...liveApp,
    ...app,
    name: app.name || liveApp?.name,
    description: app.description || liveApp?.description,
    categories:
      app.categories.length > 0 ? app.categories : liveApp?.categories,
    docsUrl: app.docsUrl,
    contracts,
  };
}

function normalizePortalError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "portal_unavailable";
  }

  if (error.name === "AbortError" || error.message.includes("timed out")) {
    return "portal_timeout";
  }

  if (error.message.includes("Portal API request failed")) {
    return "portal_request_failed";
  }

  return "portal_unavailable";
}

function parseCursorOffset(cursor: unknown): number {
  const offsetRaw =
    cursor === undefined
      ? 0
      : typeof cursor === "string"
        ? Number.parseInt(cursor, 10)
        : Number.NaN;
  if (!Number.isInteger(offsetRaw) || offsetRaw < 0) {
    throw new AgwCliError(
      "INVALID_INPUT",
      "cursor must be a non-negative integer string when provided",
      2,
    );
  }
  return offsetRaw;
}

function resolvePageSize(pageSize: unknown): number {
  if (pageSize === undefined) {
    return DEFAULT_APP_LIST_PAGE_SIZE;
  }
  if (
    typeof pageSize !== "number" ||
    !Number.isInteger(pageSize) ||
    pageSize <= 0
  ) {
    throw new AgwCliError(
      "INVALID_INPUT",
      "pageSize must be a positive integer when provided",
      2,
    );
  }
  return pageSize;
}

function mergeListAppSummary(
  liveApp: PortalAppSummary,
): Record<string, unknown> {
  const catalogApp = getAppCatalogEntry(liveApp.id);
  return {
    ...liveApp,
    ...(catalogApp
      ? {
          categories:
            catalogApp.categories.length > 0
              ? catalogApp.categories
              : liveApp.categories,
          description: catalogApp.description || liveApp.description,
          docsUrl: catalogApp.docsUrl,
          spotlight: catalogApp.spotlight,
          verified: catalogApp.verified,
        }
      : {}),
    skillRefs: catalogApp ? listSkillRefs(catalogApp.skillRefs) : [],
  };
}

export const portalAppHandlers: Record<string, CommandHandler> = {
  "portal.streams.list": async (input) =>
    portalListStreamsTool.handler(
      {
        app: input.appId,
        page: input.page,
        limit: input.pageSize,
        sortBy: input.sortBy,
        language: input.language,
      },
      {} as ToolContext,
    ),
  "portal.user-profile.get": async (input, context) =>
    portalGetUserProfileTool.handler(
      { address: parseOptionalString(input.address, "address") },
      context,
    ),
  "app.list": async (input) => {
    const offset = parseCursorOffset(input.cursor);
    const pageSize = resolvePageSize(input.pageSize);
    const page = Math.floor(offset / pageSize) + 1;
    const offsetWithinPage = offset % pageSize;
    const livePage = (await portalListAppsTool.handler(
      {
        page,
        limit: pageSize,
      },
      {} as ToolContext,
    )) as PortalAppListResponse;
    const items = livePage.items
      .slice(offsetWithinPage)
      .map(mergeListAppSummary);
    const nextOffset = offset + items.length;

    return {
      items,
      nextCursor:
        nextOffset < livePage.pagination.totalItems ? String(nextOffset) : null,
      totalItems: livePage.pagination.totalItems,
    };
  },
  "app.show": async (input) => {
    const appId = parseOptionalString(input.appId, "appId");
    const offline = parseOptionalBoolean(input.offline, "offline") === true;
    if (!appId) {
      throw new AgwCliError("INVALID_INPUT", "appId is required", 2);
    }

    const app = getAppCatalogEntry(appId);
    if (!app) {
      throw new AgwCliError(
        "APP_NOT_FOUND",
        `app ${appId} is not in the shipped AGW app catalog`,
        2,
      );
    }

    const skillRefs = listSkillRefs(app.skillRefs);
    if (offline) {
      return {
        app,
        skillRefs,
        meta: {
          offline: true,
          portalStatus: "skipped",
          contractsSource: "catalog",
        },
      };
    }

    const parsedAppId = Number.parseInt(appId, 10);
    if (!Number.isInteger(parsedAppId) || parsedAppId <= 0) {
      return {
        app,
        skillRefs,
        meta: {
          portalStatus: "unavailable",
          contractsSource: "catalog",
          portalError: "invalid_app_id",
        },
      };
    }

    try {
      const liveApp = (await portalGetAppTool.handler(
        {
          id: parsedAppId,
          includeContracts: true,
        },
        {} as ToolContext,
      )) as PortalAppDetail;
      const liveContracts = normalizePortalContracts(liveApp.contracts);
      const contracts =
        liveContracts.length > 0 ? liveContracts : app.contracts;

      return {
        app: mergeAppDetails(app, liveApp, contracts),
        skillRefs,
        live: {
          app: liveApp,
        },
        meta: {
          portalStatus: "available",
          contractsSource: liveContracts.length > 0 ? "portal" : "catalog",
        },
      };
    } catch (error) {
      return {
        app,
        skillRefs,
        meta: {
          portalStatus: "unavailable",
          contractsSource: "catalog",
          portalError: normalizePortalError(error),
        },
      };
    }
  },
};
