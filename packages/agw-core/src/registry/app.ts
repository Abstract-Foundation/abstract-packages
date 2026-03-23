import {
  booleanSchema,
  authNone,
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
  stringSchema,
} from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const appNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "app",
  path: ["app"],
  kind: "namespace",
  description: "Discover Abstract apps through a canonical AGW agent-facing surface.",
  status: "planned",
  inputMode: "json",
  auth: authNone(),
  mutation: readMutation(),
  output: ndjsonOutput(true, true),
  exposure: exposure(true, true),
  children: [
    defineCommand({
      id: "app.list",
      path: ["app", "list"],
      kind: "command",
      description: "List live Portal apps merged with AGW curation and skill metadata.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: objectSchema({
        ...paginationRequestSchema().properties,
        fields: fieldsSchema(),
      }),
      responseSchema: listResponseSchema(
        objectSchema(
          {
            id: idSchema("Shipped AGW app identifier."),
            name: stringSchema(),
            description: stringSchema(),
            skillRefs: { type: "array", items: opaqueObjectSchema("Shipped skill reference metadata.") },
          },
          { additionalProperties: true },
        ),
      ),
      mutation: readMutation(),
      output: ndjsonOutput(true, true),
      sanitization: sanitize(true, "strict"),
      exposure: exposure(true, true),
    }),
    defineCommand({
      id: "app.show",
      path: ["app", "show"],
      kind: "command",
      description: "Show AGW app metadata and related skill references.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: objectSchema(
        {
          appId: idSchema("Shipped AGW app identifier."),
          offline: booleanSchema({ description: "Skip live Portal enrichment and use the shipped AGW catalog only." }),
        },
        { required: ["appId"] },
      ),
      responseSchema: objectSchema(
        {
          app: opaqueObjectSchema("Shipped AGW app metadata."),
          skillRefs: { type: "array", items: opaqueObjectSchema("Shipped skill reference metadata.") },
          live: objectSchema(
            {
              app: opaqueObjectSchema("Live Portal app metadata."),
            },
            { required: ["app"], additionalProperties: false },
          ),
          meta: objectSchema(
            {
              portalStatus: stringSchema(),
              contractsSource: stringSchema(),
              portalError: stringSchema(),
              offline: booleanSchema(),
            },
            { required: ["portalStatus", "contractsSource"], additionalProperties: false },
          ),
        },
        { required: ["app", "skillRefs", "meta"] },
      ),
      mutation: readMutation(),
      output: jsonOutput(true, false),
      sanitization: sanitize(true, "strict"),
      exposure: exposure(true, true),
    }),
  ],
});
