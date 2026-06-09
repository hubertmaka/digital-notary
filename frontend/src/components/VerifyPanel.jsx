import { useState } from "react";
import { ethers } from "ethers";
import { sha256File, decodeError, formatTimestamp } from "../lib/utils.js";
import { IPFS_GATEWAY } from "../config.js";
import {
  FileDrop,
  HashOutput,
  Result,
  inputClass,
  primaryButtonClass,
} from "./ui.jsx";

export default function VerifyPanel({ wallet }) {
  const [hash, setHash] = useState(null);
  const [manualHash, setManualHash] = useState("");
  const [result, setResult] = useState(null);

  async function onFile(f) {
    const h = await sha256File(f);
    setHash(h);
    setManualHash("");
  }

  function onManualHash(value) {
    setManualHash(value);
    if (ethers.isHexString(value.trim(), 32)) setHash(value.trim());
  }

  async function onVerify() {
    if (!hash) return setResult({ type: "error", node: "Select a file or paste a hash." });
    try {
      setResult({ type: "pending", node: "Reading on-chain data..." });
      const d = await wallet.readContract.verifyDocument(hash);
      if (!d.exists) {
        return setResult({
          type: "error",
          node: (
            <>
              Document not found in the registry.
            </>
          ),
        });
      }
      setResult({
        type: d.revoked ? "warning" : "success",
        node: (
          <>
            Status:{" "}
            {d.revoked ? (
              <span className="font-bold text-red-400">
                REVOKED (reason: {d.revokeReason})
              </span>
            ) : (
              <span className="font-bold text-emerald-400">VALID</span>
            )}
            <br />
            <strong>Registration Date:</strong> {formatTimestamp(d.timestamp)}
            <br />
            <strong>Notary:</strong> <code>{d.notary}</code>
            <br />
            <strong>Registry Number:</strong> {d.registryNumber}
            <br />
            <strong>Description:</strong> {d.description || "-"}
            <br />
            <strong>IPFS Content:</strong>{" "}
            {d.ipfsCid ? (
              <a
                className="text-indigo-400 underline"
                href={`${IPFS_GATEWAY}${encodeURIComponent(d.ipfsCid)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {d.ipfsCid}
              </a>
            ) : (
              "-"
            )}
          </>
        ),
      });
    } catch (err) {
      setResult({ type: "error", node: decodeError(err) });
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">
        Document Verification (public read)
      </h2>
      <p className="mb-4 text-sm text-slate-400">
        Select a file to calculate SHA-256 locally and compare it with the on-chain record.
      </p>

      <FileDrop label="Click or drop a file for verification" onFile={onFile} />
      <HashOutput hash={hash} />

      <p className="mb-2 text-center text-xs text-slate-500">
        or paste a hash manually
      </p>
      <input
        type="text"
        className={inputClass}
        placeholder="0x... (32-byte hex)"
        value={manualHash}
        onChange={(e) => onManualHash(e.target.value)}
      />

      <button
        className={primaryButtonClass}
        onClick={onVerify}
        disabled={!wallet.connected || !hash}
      >
        Verify On-chain
      </button>
      {result && <Result type={result.type}>{result.node}</Result>}
    </section>
  );
}
