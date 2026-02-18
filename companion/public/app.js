const form = document.getElementById("bootstrap-form");
const callbackInput = document.getElementById("callback-url");
const chainIdInput = document.getElementById("chain-id");
const loginLink = document.getElementById("start-login-link");

function buildAuthStartPath(callbackUrl, chainId) {
  const params = new URLSearchParams();
  params.set("callbackUrl", callbackUrl.trim());
  params.set("chainId", chainId.trim());
  return `/auth/start?${params.toString()}`;
}

function updatePreview() {
  const href = buildAuthStartPath(callbackInput.value, chainIdInput.value);
  loginLink.href = href;
  loginLink.textContent = href;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const href = buildAuthStartPath(callbackInput.value, chainIdInput.value);
  window.location.href = href;
});

callbackInput.addEventListener("input", updatePreview);
chainIdInput.addEventListener("input", updatePreview);

updatePreview();
