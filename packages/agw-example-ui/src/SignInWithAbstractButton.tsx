import Image from "next/image";
import { absLogo } from "./assets.js";

type SignInWithAbstractButtonProps = {
  isLoading?: boolean;
  onClick: () => void;
};

export function SignInWithAbstractButton({
  isLoading = false,
  onClick,
}: SignInWithAbstractButtonProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-10 h-10">
        <div className="animate-spin">
          <Image src={absLogo} alt="Loading" width={24} height={24} />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] hover:text-white hover:cursor-pointer dark:hover:bg-[#e0e0e0] dark:hover:text-black text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 font-[family-name:var(--font-roobert)]"
      onClick={onClick}
    >
      <Image
        className="dark:invert"
        src={absLogo}
        alt="Abstract logomark"
        width={20}
        height={20}
        style={{ filter: "brightness(0)" }}
      />
      Sign in with Abstract
    </button>
  );
}
