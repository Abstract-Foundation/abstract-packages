# AGW MCP Prompt Playbook

Copy-paste prompts for common workflows.

## Setup
`Initialize AGW MCP for Abstract testnet using secure companion handoff, then confirm session status and wallet address.`

## Read Portfolio
`Use get_wallet_address, get_balances, and get_token_list to summarize my wallet on one screen with raw + formatted values and explorer links.`

## Sign Message
`Sign this UTF-8 message with my active AGW session key: "I approve this login challenge". Return signature and signer address only.`

## Send Transaction (Safe)
`Preview this transaction first, then execute only if preview risk is acceptable: to=<ADDRESS> data=<HEX> value=<WEI>.`

## Transfer Native
`Transfer 1000000000000000 wei to <ADDRESS> using transfer_token. Show preview first, then run with execute=true after confirmation.`

## Swap Tokens (0x)
`Get a 0x quote to swap sellToken=<TOKEN_A> to buyToken=<TOKEN_B> with sellAmount=<AMOUNT>. Show approval requirements and expected output. Execute only if I confirm.`

## Contract Write
`Call write_contract for address=<CONTRACT> functionName=<FUNCTION> args=<ARGS>. Validate policy preflight and return tx hash + explorer URL.`

## Revoke Session
`Run revoke_session and then verify that write tools are blocked due to revoked local status.`
