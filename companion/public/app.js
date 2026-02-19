const form = document.getElementById("bootstrap-form");
const callbackInput = document.getElementById("callback-url");
const chainIdInput = document.getElementById("chain-id");
const policyPresetInput = document.getElementById("policy-preset");
const handoffSessionIdInput = document.getElementById("handoff-session-id");
const customPolicyField = document.getElementById("custom-policy-field");
const customPolicyInput = document.getElementById("custom-policy");
const policyPreview = document.getElementById("policy-preview");
const policyRiskLevel = document.getElementById("policy-risk-level");
const policyRiskReasons = document.getElementById("policy-risk-reasons");
const confirmHighRiskInput = document.getElementById("confirm-high-risk");
const confirmHighRiskWrapper = document.getElementById("confirm-high-risk-wrapper");
const policyPreviewError = document.getElementById("policy-preview-error");
const loginLink = document.getElementById("start-login-link");

const DEFAULT_CUSTOM_POLICY = JSON.stringify(
  {
    expiresInSeconds: 900,
    sessionConfig: {
      feeLimit: "1000000000000000",
      maxValuePerUse: "1000000000000000",
      callPolicies: [],
      transferPolicies: [],
    },
  },
  null,
  2,
);

let previewRequestId = 0;
let latestSecurity = { requiresConfirmation: false, level: "low", reasons: [] };

function hydrateFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const callbackUrl = params.get("callbackUrl");
  const chainId = params.get("chainId");
  const handoffSessionId = params.get("handoffSessionId");
  const preset = params.get("preset");

  if (callbackUrl) {
    callbackInput.value = callbackUrl;
  }
  if (chainId) {
    chainIdInput.value = chainId;
  }
  if (handoffSessionId) {
    handoffSessionIdInput.value = handoffSessionId;
  }
  if (preset) {
    policyPresetInput.value = preset;
  }
}

function readCustomPolicy() {
  if (policyPresetInput.value !== "custom") {
    return "";
  }

  const trimmed = customPolicyInput.value.trim();
  return trimmed || DEFAULT_CUSTOM_POLICY;
}

function buildAuthStartPath(callbackUrl, chainId, preset, customPolicy) {
  const params = new URLSearchParams();
  params.set("callbackUrl", callbackUrl.trim());
  params.set("chainId", chainId.trim());
  params.set("preset", preset);

  if (preset === "custom" && customPolicy.trim()) {
    params.set("customPolicy", customPolicy);
  }

  if (handoffSessionIdInput.value.trim()) {
    params.set("handoffSessionId", handoffSessionIdInput.value.trim());
  }
  if (latestSecurity.requiresConfirmation && confirmHighRiskInput.checked) {
    params.set("confirmHighRisk", "true");
  }

  return `/auth/start?${params.toString()}`;
}

function buildPolicyPreviewPath(preset, customPolicy) {
  const params = new URLSearchParams();
  params.set("preset", preset);

  if (preset === "custom" && customPolicy.trim()) {
    params.set("customPolicy", customPolicy);
  }

  return `/policy/preview?${params.toString()}`;
}

function toggleCustomMode() {
  const isCustom = policyPresetInput.value === "custom";
  customPolicyField.hidden = !isCustom;
  if (isCustom && !customPolicyInput.value.trim()) {
    customPolicyInput.value = DEFAULT_CUSTOM_POLICY;
  }
}

function renderRisk(security) {
  latestSecurity = security || { requiresConfirmation: false, level: "low", reasons: [] };
  policyRiskLevel.textContent = `Risk level: ${latestSecurity.level}`;
  policyRiskReasons.innerHTML = "";
  for (const reason of latestSecurity.reasons || []) {
    const li = document.createElement("li");
    li.textContent = reason;
    policyRiskReasons.appendChild(li);
  }

  confirmHighRiskWrapper.hidden = !latestSecurity.requiresConfirmation;
  if (!latestSecurity.requiresConfirmation) {
    confirmHighRiskInput.checked = false;
  }
}

async function refreshPolicyPreview(preset, customPolicy) {
  const requestId = ++previewRequestId;
  const previewPath = buildPolicyPreviewPath(preset, customPolicy);

  try {
    const response = await fetch(previewPath);
    const responseBody = await response.text();

    if (requestId !== previewRequestId) {
      return;
    }

    if (!response.ok) {
      policyPreview.textContent = "";
      policyPreviewError.hidden = false;
      policyPreviewError.textContent = responseBody || "Policy preview failed.";
      return;
    }

    const parsed = JSON.parse(responseBody);
    policyPreview.textContent = JSON.stringify(parsed.policyPayload, null, 2);
    renderRisk(parsed.security || { requiresConfirmation: false, level: "low", reasons: [] });
    policyPreviewError.hidden = true;
    policyPreviewError.textContent = "";
  } catch (error) {
    if (requestId !== previewRequestId) {
      return;
    }

    policyPreview.textContent = "";
    renderRisk({ requiresConfirmation: false, level: "low", reasons: [] });
    policyPreviewError.hidden = false;
    policyPreviewError.textContent = `Policy preview failed: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function updatePreview() {
  toggleCustomMode();
  const customPolicy = readCustomPolicy();
  const href = buildAuthStartPath(callbackInput.value, chainIdInput.value, policyPresetInput.value, customPolicy);
  loginLink.href = href;
  loginLink.textContent = href;
  await refreshPolicyPreview(policyPresetInput.value, customPolicy);
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  await updatePreview();

  if (!policyPreviewError.hidden) {
    return;
  }
  if (latestSecurity.requiresConfirmation && !confirmHighRiskInput.checked) {
    policyPreviewError.hidden = false;
    policyPreviewError.textContent = "High-risk policy requires explicit confirmation before starting wallet login.";
    return;
  }

  window.location.href = loginLink.href;
});

callbackInput.addEventListener("input", () => {
  void updatePreview();
});

chainIdInput.addEventListener("input", () => {
  void updatePreview();
});

policyPresetInput.addEventListener("change", () => {
  void updatePreview();
});

customPolicyInput.addEventListener("input", () => {
  void updatePreview();
});

handoffSessionIdInput.addEventListener("input", () => {
  void updatePreview();
});

confirmHighRiskInput.addEventListener("change", () => {
  void updatePreview();
});

hydrateFromQuery();
void updatePreview();
