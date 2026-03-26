interface HeaderCardProps {
  name: string
  direction: string
  description: string
  fields: { key: string; value: string }[]
}

function HeaderCard({ name, direction, description, fields }: HeaderCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <code className="text-accent text-sm font-mono">{name}</code>
        <span className="text-[11px] text-gray-500 font-sans">{direction}</span>
      </div>
      <p className="text-[13px] text-gray-400 font-sans mb-3 leading-relaxed">
        {description}
      </p>
      <div className="bg-black/50 rounded p-2.5 space-y-1">
        {fields.map((field) => (
          <div key={field.key} className="flex gap-2 text-[11px] font-mono">
            <span className="text-gray-500">{field.key}:</span>
            <span className="text-gray-300">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function HeaderExplainer() {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold font-mono text-accent mb-4 text-center">
        MPP Headers
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HeaderCard
          name="WWW-Authenticate"
          direction="Server → Client"
          description='Sent with 402 response. Contains the payment challenge with method, amount, currency, recipient, and expiry.'
          fields={[
            { key: 'method', value: '"abstract/charge"' },
            { key: 'realm', value: '"mpp-demo.abs.xyz"' },
            { key: 'challenge', value: '<base64url JWT>' },
            { key: 'amount', value: '"10000"' },
            { key: 'currency', value: '"0xbd28..."' },
          ]}
        />
        <HeaderCard
          name="Authorization"
          direction="Client → Server"
          description="Sent with the retry request. Contains the signed credential (ERC-3009 authorization or session voucher)."
          fields={[
            { key: 'scheme', value: '"Payment"' },
            { key: 'credential', value: '<base64url>' },
            { key: 'payload.type', value: '"authorization"' },
            { key: 'payload.from', value: '"0x..."' },
            { key: 'payload.signature', value: '"0x..."' },
          ]}
        />
        <HeaderCard
          name="Payment-Receipt"
          direction="Server → Client"
          description="Sent with 200 response. Confirms settlement with transaction hash (charge) or accepted cumulative amount (session)."
          fields={[
            { key: 'method', value: '"abstract/charge"' },
            { key: 'transaction', value: '"0x..."' },
            { key: 'settled', value: 'true' },
          ]}
        />
      </div>
    </div>
  )
}
