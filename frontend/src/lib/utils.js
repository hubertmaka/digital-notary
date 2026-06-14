export async function sha256File(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return (
    "0x" +
    [...new Uint8Array(digest)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export async function uploadToPinata(file, jwt) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Pinata: HTTP ${res.status}`);
  const data = await res.json();
  return data.IpfsHash;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () =>
      reject(new Error("Could not convert file to base64."));
    reader.readAsDataURL(file);
  });
}

export async function uploadRegistryPayloadToPinata(file, registryNumber, jwt) {
  const trimmedRegistryNumber = registryNumber.trim();
  const documentBase64 = await fileToBase64(file);
  const payload = {
    pinataMetadata: {
      name: trimmedRegistryNumber,
    },
    pinataContent: {
      registryNumber: trimmedRegistryNumber,
      documentBase64,
    },
  };

  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let details = "";
    try {
      const body = await res.json();
      const reason = body?.error?.reason;
      const message = body?.error?.details || body?.error?.message;
      details = [reason, message].filter(Boolean).join(" - ");
    } catch {
      // Ignore JSON parse errors and fall back to status-only message.
    }
    throw new Error(
      `Pinata: HTTP ${res.status}${details ? ` (${details})` : ""}`,
    );
  }
  const data = await res.json();
  return data.IpfsHash;
}

const ERROR_MAP = {
  NotAdmin: "Admin permissions required.",
  NotNotary: "Notary permissions required.",
  DocumentAlreadyRegistered: "This document is already registered.",
  DocumentNotFound: "Document not found in the registry.",
  DocumentAlreadyRevoked: "This record is already revoked.",
  AlreadyNotary: "This address already has the notary role.",
  NotANotary: "This address does not have the notary role.",
  EmptyRegistryNumber: "Registry number cannot be empty.",
  ZeroHash: "Document hash cannot be empty.",
};

export function decodeError(err) {
  const msg = err?.shortMessage || err?.message || String(err);
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (msg.includes(key)) return friendly;
  }
  return msg;
}

export function formatTimestamp(ts) {
  return new Date(Number(ts) * 1000).toLocaleString("en-US");
}

export function shortAddress(addr) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
