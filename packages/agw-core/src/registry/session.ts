import { authNone, authSession, config, defineCommand, emptyObjectSchema, exposure, jsonOutput, objectSchema, readMutation, sanitize, stringSchema } from "./helpers.js";
import type { AgwCommandDefinition } from "./types.js";

export const sessionNamespaceDefinition: AgwCommandDefinition = defineCommand({
  id: "session",
  path: ["session"],
  kind: "namespace",
  description: "Inspect local session state, readiness, and health.",
  status: "planned",
  inputMode: "json",
  auth: authNone(),
  mutation: readMutation(),
  output: jsonOutput(true, false),
  exposure: exposure(true, true),
  children: [
    defineCommand({
      id: "session.status",
      path: ["session", "status"],
      kind: "command",
      description: "Return the current AGW session status and delegated capability summary.",
      status: "implemented",
      inputMode: "json",
      auth: authSession("missing_ok"),
      requestSchema: objectSchema({
        fields: { type: "array", items: stringSchema({ minLength: 1 }) },
      }),
      responseSchema: objectSchema(
        {
          status: stringSchema(),
          readiness: stringSchema(),
          policyPreset: stringSchema(),
        },
        { required: ["status", "readiness"] },
      ),
      mutation: readMutation(),
      output: jsonOutput(true, false),
      sanitization: sanitize(false),
      exposure: exposure(true, true, ["request only the session fields required for the current reasoning step"]),
      config: config({ env: "AGW_HOME", description: "AGW home directory for local session state." }),
    }),
    defineCommand({
      id: "session.doctor",
      path: ["session", "doctor"],
      kind: "command",
      description: "Run local health checks for AGW session, config, and companion connectivity.",
      status: "implemented",
      inputMode: "json",
      auth: authSession("missing_ok"),
      requestSchema: emptyObjectSchema(),
      responseSchema: objectSchema(
        {
          ok: { type: "boolean" },
          checks: {
            type: "array",
            items: objectSchema(
              {
                name: stringSchema(),
                ok: { type: "boolean" },
                detail: stringSchema(),
              },
              { additionalProperties: true },
            ),
          },
          status: stringSchema(),
          readiness: stringSchema(),
        },
        { required: ["ok", "checks"] },
      ),
      mutation: readMutation(),
      output: jsonOutput(false, false),
      sanitization: sanitize(false),
      exposure: exposure(true, false),
      config: config({ env: "AGW_HOME", description: "AGW home directory for local session state." }),
    }),
  ],
});
