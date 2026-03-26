export function ProtocolOverview() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm w-full">
      <h2 className="text-lg font-semibold font-mono text-accent mb-3">
        What is MPP?
      </h2>
      <p className="text-[15px] text-gray-300 font-sans leading-relaxed mb-4">
        MPP (Machine Payments Protocol) is an HTTP-native protocol for paid APIs.
        When a client requests a paid resource, the server responds{' '}
        <code className="bg-white/10 px-1.5 py-0.5 rounded text-white text-xs">
          402 Payment Required
        </code>{' '}
        with a{' '}
        <code className="bg-white/10 px-1.5 py-0.5 rounded text-white text-xs">
          WWW-Authenticate
        </code>{' '}
        challenge. The client signs a credential, retries with an{' '}
        <code className="bg-white/10 px-1.5 py-0.5 rounded text-white text-xs">
          Authorization
        </code>{' '}
        header, and the server settles directly on-chain.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
        <IntentCard
          title="Charge"
          description="One-time ERC-3009 payment. Client signs typed data, server broadcasts the transfer."
          traits={[
            'Single signature per request',
            'Server pays gas (or uses paymaster)',
            'Replay-protected by nonce + expiry',
          ]}
        />
        <IntentCard
          title="Session"
          description="Payment channel. Client opens once on-chain, then sends off-chain vouchers."
          traits={[
            'One on-chain tx to open, then off-chain',
            'Cumulative vouchers (micro-payments)',
            'Server settles when ready',
          ]}
        />
      </div>
    </div>
  )
}

function IntentCard({
  title,
  description,
  traits,
}: {
  title: string
  description: string
  traits: string[]
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 h-full">
      <h3 className="text-sm font-mono text-accent mb-1">{title}</h3>
      <p className="text-xs text-gray-400 font-sans mb-2">{description}</p>
      <ul className="space-y-1">
        {traits.map((t) => (
          <li key={t} className="text-[11px] text-gray-500 font-sans flex gap-1.5">
            <span className="text-accent/50 shrink-0">-</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
