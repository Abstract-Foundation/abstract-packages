import { createStore, type EIP6963ProviderDetail } from "mipd";
import { createWalletClient, custom, type Address, type CustomSource, type EIP1193Provider } from "viem";
import { abstractTestnet } from "viem/chains";
import { eip712WalletActions } from "viem/zksync";
import { generatePrivateKey, privateKeyToAccount, toAccount } from "viem/accounts";
import { createAbstractClient } from "@abstract-foundation/agw-client";
import {
  buildSessionBundle,
  toSdkSessionConfig,
  type CompanionPolicyPayload,
} from "./session-bundle.js";

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

const walletStatus = $<HTMLParagraphElement>("wallet-status");
const connectBtn = $<HTMLButtonElement>("connect-wallet");
const policySection = $<HTMLElement>("policy-section");
const presetSelect = $<HTMLSelectElement>("policy-preset");
const customPolicyField = $<HTMLElement>("custom-policy-field");
const customPolicyInput = $<HTMLTextAreaElement>("custom-policy");
const previewSection = $<HTMLElement>("preview-section");
const policyPreview = $<HTMLPreElement>("policy-preview");
const policyRiskLevel = $<HTMLParagraphElement>("policy-risk-level");
const policyRiskReasons = $<HTMLUListElement>("policy-risk-reasons");
const confirmHighRiskWrapper = $<HTMLLabelElement>("confirm-high-risk-wrapper");
const confirmHighRiskInput = $<HTMLInputElement>("confirm-high-risk");
const policyPreviewError = $<HTMLParagraphElement>("policy-preview-error");
const sessionSection = $<HTMLElement>("session-section");
const createSessionBtn = $<HTMLButtonElement>("create-session");
const sessionStatus = $<HTMLParagraphElement>("session-status");
const resultSection = $<HTMLElement>("result-section");
const resultMessage = $<HTMLParagraphElement>("result-message");

const AGW_PROVIDER_DELAY_MS = 300;

const params = new URLSearchParams(window.location.search);
const callbackUrl = params.get("callbackUrl");
const chainId = Number(params.get("chainId") ?? "11124");

let connectedAddress: Address | null = null;
let connectedProvider: EIP1193Provider | null = null;
let currentPolicyPayload: CompanionPolicyPayload | null = null;
let latestSecurity = { requiresConfirmation: false, level: "low", reasons: [] as string[] };
let previewRequestId = 0;

const DEFAULT_CUSTOM_POLICY = JSON.stringify(
  {
    expiresInSeconds: 3600,
    sessionConfig: {
      feeLimit: "2000000000000000",
      maxValuePerUse: "10000000000000000",
      callPolicies: [],
      transferPolicies: [],
    },
  },
  null,
  2,
);

async function connectWallet(): Promise<void> {
  connectBtn.disabled = true;
  walletStatus.textContent = "Connecting...";

  try {
    await import("@abstract-foundation/agw-web/testnet");
    await new Promise((r) => setTimeout(r, AGW_PROVIDER_DELAY_MS));

    const store = createStore();
    const providers = store.getProviders();
    const agw = providers.find(
      (p: EIP6963ProviderDetail) =>
        p.info.name.includes("Abstract") || p.info.rdns === "foundation.abstract.agw",
    );

    if (!agw) {
      throw new Error("Abstract Global Wallet provider not found.");
    }

    const provider = agw.provider;
    connectedProvider = provider;
    let accounts = (await provider.request({
      method: "eth_requestAccounts",
    })) as Address[];

    if (!accounts || accounts.length === 0) {
      let retries = 0;
      while ((!accounts || accounts.length === 0) && retries < 10) {
        await new Promise((r) => setTimeout(r, 1000));
        accounts = (await provider.request({ method: "eth_accounts" })) as Address[];
        retries++;
      }
    }

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts returned from wallet.");
    }

    connectedAddress = accounts[0];
    walletStatus.textContent = `Connected: ${connectedAddress}`;
    connectBtn.textContent = "Connected";

    policySection.hidden = false;
    previewSection.hidden = false;
    void refreshPolicyPreview();
  } catch (err) {
    walletStatus.textContent = `Connection failed: ${err instanceof Error ? err.message : String(err)}`;
    connectBtn.disabled = false;
  }
}

function readCustomPolicy(): string {
  if (presetSelect.value !== "custom") return "";
  const trimmed = customPolicyInput.value.trim();
  return trimmed || DEFAULT_CUSTOM_POLICY;
}

function renderRiskReasons(reasons: string[]): void {
  while (policyRiskReasons.firstChild) {
    policyRiskReasons.removeChild(policyRiskReasons.firstChild);
  }
  for (const reason of reasons) {
    const li = document.createElement("li");
    li.textContent = reason;
    policyRiskReasons.appendChild(li);
  }
}

async function refreshPolicyPreview(): Promise<void> {
  const requestId = ++previewRequestId;
  const preset = presetSelect.value;
  const customPolicy = readCustomPolicy();

  const previewParams = new URLSearchParams();
  previewParams.set("preset", preset);
  if (preset === "custom" && customPolicy.trim()) {
    previewParams.set("customPolicy", customPolicy);
  }

  try {
    const response = await fetch(`/policy/preview?${previewParams.toString()}`);
    const body = await response.text();
    if (requestId !== previewRequestId) return;

    if (!response.ok) {
      policyPreview.textContent = "";
      policyPreviewError.hidden = false;
      policyPreviewError.textContent = body || "Policy preview failed.";
      sessionSection.hidden = true;
      return;
    }

    const parsed = JSON.parse(body);
    currentPolicyPayload = parsed.policyPayload as CompanionPolicyPayload;
    policyPreview.textContent = JSON.stringify(parsed.policyPayload, null, 2);

    const security = parsed.security ?? { requiresConfirmation: false, level: "low", reasons: [] };
    latestSecurity = security;
    policyRiskLevel.textContent = `Risk level: ${security.level}`;
    renderRiskReasons(security.reasons ?? []);
    confirmHighRiskWrapper.hidden = !security.requiresConfirmation;
    if (!security.requiresConfirmation) {
      confirmHighRiskInput.checked = false;
    }

    policyPreviewError.hidden = true;
    policyPreviewError.textContent = "";
    sessionSection.hidden = false;
    createSessionBtn.disabled = security.requiresConfirmation && !confirmHighRiskInput.checked;
  } catch (err) {
    if (requestId !== previewRequestId) return;
    policyPreview.textContent = "";
    policyPreviewError.hidden = false;
    policyPreviewError.textContent = `Preview failed: ${err instanceof Error ? err.message : String(err)}`;
    sessionSection.hidden = true;
  }
}

async function createSession(): Promise<void> {
  if (!connectedAddress || !connectedProvider || !currentPolicyPayload) return;

  if (latestSecurity.requiresConfirmation && !confirmHighRiskInput.checked) {
    sessionStatus.textContent = "High-risk policy requires explicit confirmation.";
    return;
  }

  const walletAddress = connectedAddress;
  const walletProvider = connectedProvider;
  const policyPayload = currentPolicyPayload;

  createSessionBtn.disabled = true;
  sessionStatus.textContent = "Generating session key...";

  try {
    const sessionSignerKey = generatePrivateKey();
    const sessionSigner = privateKeyToAccount(sessionSignerKey);

    sessionStatus.textContent = "Building Abstract client...";

    const walletClient = createWalletClient({
      account: walletAddress,
      chain: abstractTestnet,
      transport: custom(walletProvider),
    }).extend(eip712WalletActions());

    const signer = toAccount({
      address: walletAddress,
      signMessage: async (args) => walletClient.signMessage(args),
      signTransaction: walletClient.signTransaction as CustomSource["signTransaction"],
      signTypedData: walletClient.signTypedData as CustomSource["signTypedData"],
    });

    const abstractClient = await createAbstractClient({
      signer,
      chain: abstractTestnet,
      transport: custom(walletProvider),
    });

    let sdkSessionConfig: ReturnType<typeof toSdkSessionConfig>;
    try {
      sdkSessionConfig = toSdkSessionConfig(
        sessionSigner.address,
        policyPayload,
      );
      console.log("[agw-mcp] sdkSessionConfig built:", JSON.stringify(sdkSessionConfig, (_k, v) => typeof v === "bigint" ? v.toString() : v));
    } catch (err) {
      throw new Error(`toSdkSessionConfig failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    sessionStatus.textContent = "Creating session on-chain (approve in wallet)...";
    let session: typeof sdkSessionConfig;
    try {
      const result = await abstractClient.createSession({
        session: sdkSessionConfig,
        account: walletAddress,
        chain: abstractTestnet,
      });
      session = result.session;
    } catch (err) {
      throw new Error(`createSession failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    const bundle = buildSessionBundle(
      walletAddress,
      session,
      sessionSignerKey,
      chainId,
    );

    if (callbackUrl) {
      sessionStatus.textContent = "Sending session to CLI...";
      const response = await fetch(callbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bundle),
      });

      if (!response.ok) {
        throw new Error(`CLI callback failed (${response.status}): ${await response.text()}`);
      }

      resultSection.hidden = false;
      sessionSection.hidden = true;
      resultMessage.textContent =
        "Session created and sent to CLI. You can close this window and return to the terminal.";
    } else {
      resultSection.hidden = false;
      sessionSection.hidden = true;
      resultMessage.textContent =
        "Session created on-chain. No callback URL provided — copy the bundle below and paste into the CLI.";
      const bundlePre = document.createElement("pre");
      bundlePre.textContent = JSON.stringify(bundle, null, 2);
      resultSection.appendChild(bundlePre);
    }
  } catch (err) {
    sessionStatus.textContent = `Session creation failed: ${err instanceof Error ? err.message : String(err)}`;
    createSessionBtn.disabled = false;
  }
}

connectBtn.addEventListener("click", () => void connectWallet());
createSessionBtn.addEventListener("click", () => void createSession());

presetSelect.addEventListener("change", () => {
  const isCustom = presetSelect.value === "custom";
  customPolicyField.hidden = !isCustom;
  if (isCustom && !customPolicyInput.value.trim()) {
    customPolicyInput.value = DEFAULT_CUSTOM_POLICY;
  }
  void refreshPolicyPreview();
});

customPolicyInput.addEventListener("input", () => void refreshPolicyPreview());
confirmHighRiskInput.addEventListener("change", () => {
  createSessionBtn.disabled = latestSecurity.requiresConfirmation && !confirmHighRiskInput.checked;
});

if (params.get("preset")) {
  presetSelect.value = params.get("preset")!;
}
