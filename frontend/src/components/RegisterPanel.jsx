import { useState } from "react";
import { sha256File, uploadToPinata, decodeError } from "../lib/utils.js";
import {
  FileDrop,
  HashOutput,
  Result,
  inputClass,
  buttonClass,
  primaryButtonClass,
} from "./ui.jsx";

export default function RegisterPanel({ wallet }) {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState(null);
  const [pinataJwt, setPinataJwt] = useState("");
  const [cid, setCid] = useState("");
  const [registryNumber, setRegistryNumber] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  async function onFile(f) {
    setFile(f);
    setHash(await sha256File(f));
  }

  async function onUpload() {
    if (!pinataJwt) {
      setResult({ type: "error", node: "Provide a Pinata JWT or paste CID manually." });
      return;
    }
    setUploading(true);
    try {
      setCid(await uploadToPinata(file, pinataJwt));
      setResult({ type: "success", node: "File uploaded to IPFS." });
    } catch (err) {
      setResult({ type: "error", node: `IPFS upload error: ${err.message}` });
    } finally {
      setUploading(false);
    }
  }

  async function onRegister() {
    if (!hash) return setResult({ type: "error", node: "Select a file first." });
    if (!registryNumber.trim()) {
      return setResult({ type: "error", node: "Provide a land registry number." });
    }
    try {
      setResult({
        type: "pending",
        node: "Submit the transaction in MetaMask and wait for confirmation.",
      });
      const tx = await wallet.contract.registerDocument(
        hash,
        cid.trim(),
        registryNumber.trim(),
        description.trim(),
      );
      const receipt = await tx.wait();
      setResult({
        type: "success",
        node: (
          <>
            Document registered.
            <br />
            <strong>Hash:</strong> <code>{hash}</code>
            <br />
            <strong>Registry:</strong> {registryNumber}
            <br />
            <strong>Block:</strong> {receipt.blockNumber}
            <br />
            <strong>Tx:</strong>{" "}
            <a
              className="text-indigo-400 underline"
              href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tx.hash}
            </a>
          </>
        ),
      });
    } catch (err) {
      setResult({ type: "error", node: decodeError(err) });
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Document Registration (Notary only)</h2>
      <ol className="mb-4 list-decimal pl-5 text-sm text-slate-400">
        <li>Select a file. SHA-256 is calculated locally in your browser.</li>
        <li>Optionally upload file content to IPFS via Pinata or paste an existing CID.</li>
        <li>Provide a registry number and confirm the transaction in MetaMask.</li>
      </ol>

      <FileDrop label="Click or drop a file" onFile={onFile} />
      <HashOutput hash={hash} />

      <fieldset className="mb-4 rounded-lg border border-slate-600 p-4">
        <legend className="px-2 text-sm text-slate-400">IPFS Content</legend>
        <input
          type="password"
          className={inputClass}
          placeholder="Pinata JWT (optional for upload)"
          value={pinataJwt}
          onChange={(e) => setPinataJwt(e.target.value)}
        />
        <button
          className={`${buttonClass} mb-3`}
          onClick={onUpload}
          disabled={!file || uploading}
        >
          {uploading ? "Uploading..." : "Upload to IPFS (Pinata)"}
        </button>
        <input
          type="text"
          className={inputClass}
          placeholder="IPFS CID (auto-filled after upload or paste manually)"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
        />
      </fieldset>

      <input
        type="text"
        className={inputClass}
        placeholder="Land registry number, for example WA4M/00123456/7"
        value={registryNumber}
        onChange={(e) => setRegistryNumber(e.target.value)}
      />
      <input
        type="text"
        className={inputClass}
        placeholder="Description, for example Property Sale Deed"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button
        className={primaryButtonClass}
        onClick={onRegister}
        disabled={!wallet.isNotary || !hash}
      >
        Register Document On-chain
      </button>
      {!wallet.isNotary && wallet.connected && (
        <p className="mt-2 text-xs text-amber-400">
          Your address does not have the notary role.
        </p>
      )}
      {result && <Result type={result.type}>{result.node}</Result>}
    </section>
  );
}
