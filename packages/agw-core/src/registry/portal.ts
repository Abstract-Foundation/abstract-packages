import {
  addressSchema,
  authSession,
  defineCommand,
  exposure,
  fieldsSchema,
  idSchema,
  jsonOutput,
  listResponseSchema,
  ndjsonOutput,
  objectSchema,
  opaqueObjectSchema,
  paginationRequestSchema,
  readMutation,
  sanitize,
} from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const portalNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "portal",
  path: ["portal"],
  kind: "namespace",
  description:
    "Read Portal API data related to apps, streams, and user profiles.",
  status: "planned",
  inputMode: "json",
  auth: authSession("active_required"),
  mutation: readMutation(),
  output: ndjsonOutput(true, true),
  exposure: exposure(true, true),
  children: [
    defineCommand({
      id: "portal.streams",
      path: ["portal", "streams"],
      kind: "namespace",
      description: "List Portal streams.",
      status: "planned",
      inputMode: "json",
      auth: authSession("active_required"),
      mutation: readMutation(),
      output: ndjsonOutput(true, true),
      exposure: exposure(true, true),
      children: [
        defineCommand({
          id: "portal.streams.list",
          path: ["portal", "streams", "list"],
          kind: "command",
          description: "List streams for a Portal app.",
          status: "implemented",
          inputMode: "json",
          auth: authSession("active_required"),
          requestSchema: objectSchema(
            {
              appId: idSchema("Portal app identifier."),
              ...paginationRequestSchema().properties,
              fields: fieldsSchema(),
            },
            { required: ["appId"] },
          ),
          responseSchema: listResponseSchema(
            opaqueObjectSchema("Portal stream record."),
          ),
          mutation: readMutation(),
          output: ndjsonOutput(true, true),
          sanitization: sanitize(true, "strict"),
          exposure: exposure(true, true),
        }),
      ],
    }),
    defineCommand({
      id: "portal.user-profile",
      path: ["portal", "user-profile"],
      kind: "namespace",
      description: "Inspect Portal user profiles.",
      status: "planned",
      inputMode: "json",
      auth: authSession("active_required"),
      mutation: readMutation(),
      output: jsonOutput(true, false),
      exposure: exposure(true, true),
      children: [
        defineCommand({
          id: "portal.user-profile.get",
          path: ["portal", "user-profile", "get"],
          kind: "command",
          description: "Get a Portal user profile by address.",
          status: "implemented",
          inputMode: "json",
          auth: authSession("active_required"),
          requestSchema: objectSchema(
            {
              address: addressSchema("Profile address."),
              fields: fieldsSchema(),
            },
            { required: ["address"] },
          ),
          responseSchema: objectSchema(
            {
              profile: opaqueObjectSchema(
                "Opaque Portal user profile payload.",
              ),
            },
            { required: ["profile"] },
          ),
          mutation: readMutation(),
          output: jsonOutput(true, false),
          sanitization: sanitize(true, "strict"),
          exposure: exposure(true, true),
        }),
      ],
    }),
  ],
});
