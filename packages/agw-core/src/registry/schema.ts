import {
  authNone,
  defineCommand,
  exposure,
  integerSchema,
  jsonOutput,
  objectSchema,
  opaqueObjectSchema,
  readMutation,
  sanitize,
  stringSchema,
} from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const schemaNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "schema",
  path: ["schema"],
  kind: "namespace",
  description: "Inspect machine-readable AGW command metadata from the shared registry.",
  status: "implemented",
  inputMode: "json",
  auth: authNone(),
  mutation: readMutation(),
  output: jsonOutput(false, false),
  exposure: exposure(true, false),
  children: [
    defineCommand({
      id: "schema.list",
      path: ["schema", "list"],
      kind: "command",
      description: "List executable AGW command schemas from the shared registry.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: objectSchema({}),
      responseSchema: objectSchema(
        {
          commandCount: integerSchema({ description: "Number of executable commands in the registry." }),
          commands: {
            type: "array",
            items: opaqueObjectSchema("Executable command schema definition."),
          },
        },
        { required: ["commandCount", "commands"] },
      ),
      mutation: readMutation(),
      output: jsonOutput(false, false),
      sanitization: sanitize(false),
      exposure: exposure(false, true),
    }),
    defineCommand({
      id: "schema.get",
      path: ["schema", "get"],
      kind: "command",
      description: "Get the executable AGW command schema for a specific command id.",
      status: "implemented",
      inputMode: "json",
      auth: authNone(),
      requestSchema: objectSchema(
        {
          commandId: stringSchema({ description: "Executable command id to inspect." }),
        },
        { required: ["commandId"] },
      ),
      responseSchema: objectSchema(
        {
          command: opaqueObjectSchema("Executable command schema definition."),
        },
        { required: ["command"] },
      ),
      mutation: readMutation(),
      output: jsonOutput(false, false),
      sanitization: sanitize(false),
      exposure: exposure(false, true),
    }),
  ],
});
