import { useState } from "react";
import {
  sha256File,
  uploadRegistryPayloadToPinata,
  decodeError,
} from "../lib/utils.js";
import {
  FileDrop,
  HashOutput,
  Result,
  inputClass,
  primaryButtonClass,
} from "./ui.jsx";

export default function RegisterPanel({ wallet }) {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState(null);
  const [pinataJwt, setPinataJwt] = useState(
    import.meta.env.VITE_PINATA_JWT || "",
  );
  const [cid, setCid] = useState("");
  const [registryNumber, setRegistryNumber] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  async function onFile(f) {
    setFile(f);
    setHash(await sha256File(f));
  }

  async function onRegister() {
    if (!hash)
      return setResult({ type: "error", node: "Select a file first." });
    if (!registryNumber.trim()) {
      return setResult({
        type: "error",
        node: "Provide a land registry number.",
      });
    }
    try {
      let resolvedCid = cid.trim();

      if (pinataJwt && file && !resolvedCid) {
        setUploading(true);
        setResult({
          type: "pending",
          node: "Uploading JSON payload to Pinata before on-chain registration...",
        });
        resolvedCid = await uploadRegistryPayloadToPinata(
          file,
          registryNumber.trim(),
          pinataJwt,
        );
        setCid(resolvedCid);
      }

      setResult({
        type: "pending",
        node: "Submit the transaction in MetaMask and wait for confirmation.",
      });
      const tx = await wallet.contract.registerDocument(
        hash,
        resolvedCid,
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
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">
        Document Registration (Notary only)
      </h2>
      <ol className="mb-4 list-decimal pl-5 text-sm text-slate-400">
        <li>Select a file. SHA-256 is calculated locally in your browser.</li>
        <li>
          If JWT is provided, JSON sent to Pinata is auto-built as{" "}
          {"{ registryNumber, documentBase64 }"}.
        </li>
        <li>
          File name in Pinata is set from typed registryNumber. Upload happens
          only during Register Document.
        </li>
      </ol>

      <FileDrop label="Click or drop a file" onFile={onFile} />
      <HashOutput hash={hash} />

      <fieldset className="mb-4 rounded-lg border border-slate-600 p-4">
        <legend className="px-2 text-sm text-slate-400">IPFS Content</legend>
        <input
          type="password"
          className={inputClass}
          placeholder="Pinata JWT (optional, can come from VITE_PINATA_JWT)"
          value={pinataJwt}
          onChange={(e) => setPinataJwt(e.target.value)}
        />
      </fieldset>

      <input
        type="text"
        className={inputClass}
        placeholder="Land registry number, for example WA4M/00123456/7"
        value={registryNumber}
        onChange={(e) => {
          setRegistryNumber(e.target.value);
          setCid("");
        }}
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
        disabled={!wallet.isNotary || !hash || uploading}
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
