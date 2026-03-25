---
"@abstract-foundation/mpp": patch
---

Add onChannelOpened callback to abstractSession client options, called after the on-chain channel open but before voucher signing — supports deferring the voucher via a returned Promise
