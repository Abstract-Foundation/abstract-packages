# Abstract Global Wallet with Thirdweb

This example showcases how to use the local
`@abstract-foundation/agw-thirdweb` workspace package with
[Thirdweb](https://www.thirdweb.xyz/) inside a
[Next.js](https://nextjs.org/) application.

## Local Development

1. Set up a Thirdweb API key:
   - Go to the [Thirdweb dashboard](https://thirdweb.com/dashboard) and create an account or sign in
   - Navigate to the **Project Settings** tab and copy your project's **Client ID**
   - Create a `.env.local` file in the project root and add your client ID:
     ```bash
     NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-client-id-here
     ```

2. Install dependencies from the repo root:

   ```bash
   pnpm install
   ```

3. Build the local package dependencies:

   ```bash
   pnpm turbo run build --filter=agw-thirdweb-nextjs
   ```

4. Run the development server:

   ```bash
   pnpm --filter agw-thirdweb-nextjs dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Useful Links

- [Docs](https://docs.abs.xyz/)
- [Official Site](https://abs.xyz/)
- [GitHub](https://github.com/Abstract-Foundation)
- [X](https://x.com/AbstractChain)
- [Discord](https://discord.com/invite/abstractchain)
