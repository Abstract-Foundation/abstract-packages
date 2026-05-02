import {
  SubmitTransactionButton,
  TransactionStatus,
} from "@abstract-foundation/agw-example-ui";
import { useWriteContractSponsored } from "@abstract-foundation/agw-react";
import { parseAbi } from "viem";
import { getGeneralPaymasterInput } from "viem/zksync";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

export function SendTransaction() {
  const { address } = useAccount();
  const {
    writeContractSponsored,
    data: transactionHash,
    isPending,
  } = useWriteContractSponsored();

  const { data: transactionReceipt } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });

  const hasTransaction = !!transactionReceipt;

  const onSubmitTransaction = () => {
    if (!address) return;

    writeContractSponsored({
      abi: parseAbi(["function mint(address,uint256) external"]),
      address: "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA",
      functionName: "mint",
      args: [address, BigInt(1)],
      paymaster: "0x5407B5040dec3D339A9247f3654E59EEccbb6391",
      paymasterInput: getGeneralPaymasterInput({
        innerInput: "0x",
      }),
    });
  };

  return (
    <div className="flex flex-col w-full border-solid">
      <SubmitTransactionButton
        onClick={onSubmitTransaction}
        disabled={!address || isPending || hasTransaction}
        isPending={isPending}
      />
      <TransactionStatus
        transactionHash={transactionHash}
        isSuccess={hasTransaction}
        explorerHref={
          transactionReceipt
            ? `https://sepolia.abscan.org/tx/${transactionReceipt.transactionHash}`
            : undefined
        }
      />
    </div>
  );
}
