# Agent Registration URI Schema

The `agentURI` passed to `register()` should point to a JSON file following this schema. Host it at any HTTPS URL or IPFS.

## Schema

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "My Agent",
  "description": "What this agent does in natural language",
  "image": "https://example.com/agent-avatar.png",
  "services": [
    {
      "name": "MCP",
      "endpoint": "https://mcp.example.com/",
      "version": "2025-06-18"
    },
    {
      "name": "A2A",
      "endpoint": "https://agent.example/.well-known/agent-card.json",
      "version": "0.3.0"
    }
  ],
  "x402Support": false,
  "active": true,
  "registrations": [
    {
      "agentId": 22,
      "agentRegistry": "eip155:2741:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432"
    }
  ],
  "supportedTrust": ["reputation"]
}
```

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Must be `https://eips.ethereum.org/EIPS/eip-8004#registration-v1` |
| `name` | Yes | Human-readable agent name |
| `description` | Yes | What the agent does |
| `image` | No | Avatar/logo URL |
| `services` | No | Array of protocol endpoints the agent supports |
| `x402Support` | No | Whether the agent supports HTTP 402 payments |
| `active` | No | Whether the agent is currently accepting requests |
| `registrations` | No | Array of onchain registrations for cross-chain discovery |
| `supportedTrust` | No | Trust models supported: `reputation`, `crypto-economic`, `tee-attestation` |

## Service Types

| name | What it is | endpoint points to |
|------|-----------|-------------------|
| `MCP` | Model Context Protocol server | MCP server URL |
| `A2A` | Google Agent2Agent protocol | `.well-known/agent-card.json` |
| `ENS` | Ethereum Name Service | ENS name |
| `DID` | Decentralized Identifier | DID document URL |

## Minimal Example

The simplest valid registration file:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "Price Oracle Agent",
  "description": "Returns real-time token prices on Abstract",
  "active": true
}
```

## Domain Verification

To prove you control the agent's endpoint domain, host this file at:

```
https://{your-domain}/.well-known/agent-registration.json
```

It must contain a `registrations` array with entries matching your agent's `agentId` and the Abstract IdentityRegistry address (`eip155:2741:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`).

## References

- [ERC-8004 Specification](https://eips.ethereum.org/EIPS/eip-8004)
