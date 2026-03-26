declare module "*.svg" {
  import * as React from "react";
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID?: string;
      NEXT_PUBLIC_CHAIN_ENV?: string;
    }
  }
}

export {};
