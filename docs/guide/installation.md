# Installation

If you're an LLM Agent helping set up the agw-cli, welcome! You'll now help your user to install the AGW CLI and configure it.

Follow these steps:

## Step 0: Check Prerequisites

The AGW CLI requires the following prerequisites:

- Node.js 18+ (check with `node --version`)
- npm 10+ (check with `npm --version`)

If either is missing, install these dependencies using the best available package manager on the machine before continuing.

## Step 1: Install Or Upgrade AGW

If `agw-cli` is not installed (check with `command -v agw-cli`, `which agw-cli`, or `agw-cli --version`), install it:

```bash
npm install -g @abstract-foundation/agw-cli
```

Then verify:

```bash
agw-cli --version
```

If any command fails, do your best to fix the issue and continue before asking the user for help. If you are unable to continue, give the user clear instructions on how to unblock you before proceeding.

## Step 2: Authentication Flow

The AGW CLI comes with a "companion app" that handles authentication and session management.

To complete the authentication flow for the user, execute the following steps:

Run the following command to begin the authentication flow (this opens the user's browser, where they will be prompted to connect an existing AGW or create a new one, and then approve the request to create a new agent signer on their wallet and link it to this machine):

```bash
agw-cli auth init --json '{"chainId":2741}' --execute
```

## Step 3: Verify Successful Onboarding

Once the user has completed the authentication flow inside the companion app, verify the session is active and ready:

```bash
agw-cli session doctor --json '{}'
```

```bash
agw-cli session status --json '{"fields":["status","readiness","accountAddress","policyPreset"]}'
```

If the session is active and ready, confirm to the user the authentication flow was successful and the session is active and ready. Use the command below to get the user's profile to show them recognizable information like their username in your onboarding success message.

```bash
agw-cli portal user-profile get --json '{"address":"<your-account-address-here>"}'
```

## Step 4: Install AGW Agent Skills

The AGW repo ships agent Skills that teach the agent how to use the CLI safely and efficiently.

Install all AGW skills by default:

```bash
npx skills add https://github.com/Abstract-Foundation/agw-mcp/tree/main/packages/agw-cli/skills
```
