import {
  type AgwDeployContractParameters,
  type AgwDeployContractReturnType,
  type AgwSendCallsParameters,
  type AgwSendCallsReturnType,
  type AgwSendTransactionParameters,
  type AgwSendTransactionReturnType,
  type AgwSignMessageParameters,
  type AgwSignMessageReturnType,
  type AgwSignTransactionParameters,
  type AgwSignTransactionReturnType,
  type AgwWriteContractParameters,
  type AgwWriteContractReturnType,
  createAgwActionAdapter,
} from "../src/agw/actions.js";

describe("AGW actions adapter", () => {
  it("forwards signMessage through adapter surface", async () => {
    const signMessage = jest.fn<Promise<AgwSignMessageReturnType>, [AgwSignMessageParameters]>(async () => "0xabc123");
    const adapter = createAgwActionAdapter({ signMessage });

    await expect(adapter.signMessage({ message: "hello" })).resolves.toBe("0xabc123");
    expect(signMessage).toHaveBeenCalledTimes(1);
    expect(signMessage.mock.calls[0][0]).toMatchInlineSnapshot(`
{
  "message": "hello",
}
`);
  });

  it("forwards signTransaction through adapter surface", async () => {
    const signTransaction = jest.fn<Promise<AgwSignTransactionReturnType>, [AgwSignTransactionParameters]>(
      async () => "0x02abcd" as AgwSignTransactionReturnType,
    );
    const adapter = createAgwActionAdapter({ signTransaction });

    await expect(
      adapter.signTransaction({
        account: "0x1111111111111111111111111111111111111111",
        chain: undefined,
        to: "0x2222222222222222222222222222222222222222",
        data: "0xa9059cbb",
        value: 7n,
      } as AgwSignTransactionParameters),
    ).resolves.toBe("0x02abcd");
    expect(signTransaction).toHaveBeenCalledTimes(1);
    expect(signTransaction.mock.calls[0][0]).toMatchInlineSnapshot(`
{
  "account": "0x1111111111111111111111111111111111111111",
  "chain": undefined,
  "data": "0xa9059cbb",
  "to": "0x2222222222222222222222222222222222222222",
  "value": 7n,
}
`);
  });

  it("forwards sendTransaction through adapter surface", async () => {
    const sendTransaction = jest.fn<Promise<AgwSendTransactionReturnType>, [AgwSendTransactionParameters]>(async () =>
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as AgwSendTransactionReturnType,
    );
    const adapter = createAgwActionAdapter({ sendTransaction });

    await expect(
      adapter.sendTransaction({
        account: "0x1111111111111111111111111111111111111111",
        chain: undefined,
        to: "0x3333333333333333333333333333333333333333",
        data: "0xa9059cbb",
        value: 5n,
      } as AgwSendTransactionParameters),
    ).resolves.toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(sendTransaction).toHaveBeenCalledTimes(1);
    expect(sendTransaction.mock.calls[0][0]).toMatchInlineSnapshot(`
{
  "account": "0x1111111111111111111111111111111111111111",
  "chain": undefined,
  "data": "0xa9059cbb",
  "to": "0x3333333333333333333333333333333333333333",
  "value": 5n,
}
`);
  });

  it("forwards sendCalls through adapter surface", async () => {
    const sendCalls = jest.fn<Promise<AgwSendCallsReturnType>, [AgwSendCallsParameters]>(async () => ({
      id: "0xcallid",
    }));
    const adapter = createAgwActionAdapter({ sendCalls });

    await expect(
      adapter.sendCalls({
        calls: [
          {
            to: "0x3333333333333333333333333333333333333333",
            data: "0xa9059cbb",
            value: 0n,
          },
        ],
      } as AgwSendCallsParameters),
    ).resolves.toEqual({
      id: "0xcallid",
    });
    expect(sendCalls).toHaveBeenCalledTimes(1);
    expect(sendCalls.mock.calls[0][0]).toMatchInlineSnapshot(`
{
  "calls": [
    {
      "data": "0xa9059cbb",
      "to": "0x3333333333333333333333333333333333333333",
      "value": 0n,
    },
  ],
}
`);
  });

  it("forwards writeContract through adapter surface", async () => {
    const writeContract = jest.fn<Promise<AgwWriteContractReturnType>, [AgwWriteContractParameters]>(async () =>
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as AgwWriteContractReturnType,
    );
    const adapter = createAgwActionAdapter({ writeContract });

    await expect(
      adapter.writeContract({
        account: "0x1111111111111111111111111111111111111111",
        chain: undefined,
        address: "0x4444444444444444444444444444444444444444",
        abi: [],
        functionName: "transfer",
        args: ["0x5555555555555555555555555555555555555555", 1n],
        value: 11n,
      } as AgwWriteContractParameters),
    ).resolves.toBe("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    expect(writeContract).toHaveBeenCalledTimes(1);
    expect(writeContract.mock.calls[0][0]).toMatchInlineSnapshot(`
{
  "abi": [],
  "account": "0x1111111111111111111111111111111111111111",
  "address": "0x4444444444444444444444444444444444444444",
  "args": [
    "0x5555555555555555555555555555555555555555",
    1n,
  ],
  "chain": undefined,
  "functionName": "transfer",
  "value": 11n,
}
`);
  });

  it("forwards deployContract through adapter surface", async () => {
    const deployContract = jest.fn<Promise<AgwDeployContractReturnType>, [AgwDeployContractParameters]>(async () =>
      "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" as AgwDeployContractReturnType,
    );
    const adapter = createAgwActionAdapter({ deployContract });

    await expect(
      adapter.deployContract({
        account: "0x1111111111111111111111111111111111111111",
        abi: [],
        bytecode: "0x60006000",
        chain: undefined,
      } as AgwDeployContractParameters),
    ).resolves.toBe("0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc");
    expect(deployContract).toHaveBeenCalledTimes(1);
    expect(deployContract.mock.calls[0][0]).toMatchInlineSnapshot(`
{
  "abi": [],
  "account": "0x1111111111111111111111111111111111111111",
  "bytecode": "0x60006000",
  "chain": undefined,
}
`);
  });

  it("throws a deterministic error when required actions are missing", async () => {
    const adapter = createAgwActionAdapter({});

    await expect(adapter.signTransaction({} as never)).rejects.toThrow(
      "AGW action adapter missing client method: signTransaction",
    );
    await expect(adapter.sendCalls({} as never)).rejects.toThrow("AGW action adapter missing client method: sendCalls");
  });
});
