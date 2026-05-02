import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { abstractLogo } from "./assets.js";
import { BackgroundEffects } from "./BackgroundEffects.js";
import { ResourceCards } from "./ResourceCards.js";

type ExampleLogo = {
  alt: string;
  height: number;
  src: ComponentProps<typeof Image>["src"];
  width: number;
};

type ExamplePageProps = {
  children: ReactNode;
  editPath?: string;
  logos?: readonly [ExampleLogo, ...ExampleLogo[]];
};

const defaultLogos: [ExampleLogo] = [
  {
    src: abstractLogo,
    alt: "Abstract logo",
    width: 240,
    height: 32,
  },
];

export function ExamplePage({
  children,
  editPath = "src/app/page.tsx",
  logos = defaultLogos,
}: ExamplePageProps) {
  return (
    <div className="relative grid grid-rows-[1fr_auto] min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-avenue-mono)] bg-black overflow-hidden">
      <BackgroundEffects />

      <main className="relative flex flex-col items-center justify-center z-10 text-white text-center">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-4">
            {logos.map((logo, index) => (
              <FragmentLogo key={logo.alt} logo={logo} showPlus={index > 0} />
            ))}
          </div>
          <p className="text-md font-[family-name:var(--font-roobert)]">
            Get started by editing{" "}
            <code className="bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              {editPath}
            </code>
            .
          </p>

          <div className="flex justify-center">{children}</div>
        </div>
      </main>

      <ResourceCards />
    </div>
  );
}

function FragmentLogo({
  logo,
  showPlus,
}: {
  logo: ExampleLogo;
  showPlus: boolean;
}) {
  return (
    <>
      {showPlus && <span>+</span>}
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        priority
      />
    </>
  );
}
