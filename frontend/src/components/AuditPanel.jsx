import { useState } from "react";
import { decodeError, formatTimestamp, shortAddress } from "../lib/utils.js";
import { Result, inputClass, primaryButtonClass } from "./ui.jsx";

export default function AuditPanel({ wallet }) {
  const [registryNumber, setRegistryNumber] = useState("");
  const [entries, setEntries] = useState(null);
  const [result, setResult] = useState(null);

  async function onAudit() {
    const kw = registryNumber.trim();
    if (!kw) return setResult({ type: "error", node: "Provide a registry number." });
    try {
      setEntries(null);
      setResult({ type: "pending", node: "Loading history..." });
      const hashes = await wallet.readContract.getRegistryHistory(kw);
      if (hashes.length === 0) {
        return setResult({
          type: "warning",
          node: (
            <>
              No entries found for registry <strong>{kw}</strong>.
            </>
          ),
        });
      }
      const docs = await Promise.all(
        hashes.map((h) =>
          wallet.readContract
            .verifyDocument(h)
            .then((d) => ({ hash: h, ...d.toObject() })),
        ),
      );
      setEntries({ kw, docs });
      setResult(null);
    } catch (err) {
      setResult({ type: "error", node: decodeError(err) });
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">
        Registry Audit (full history)
      </h2>
      <input
        type="text"
        className={inputClass}
        placeholder="Land registry number, for example WA4M/00123456/7"
        value={registryNumber}
        onChange={(e) => setRegistryNumber(e.target.value)}
      />
      <button
        className={primaryButtonClass}
        onClick={onAudit}
        disabled={!wallet.connected}
      >
        Load History
      </button>

      {result && <Result type={result.type}>{result.node}</Result>}

      {entries && (
        <div className="mt-4 rounded-lg border border-emerald-400 bg-emerald-400/10 p-4 text-sm">
          <p className="mb-3">
            <strong>Registry {entries.kw}</strong> - {entries.docs.length} entrie(s)
          </p>
          <ol className="list-decimal space-y-3 pl-5">
            {entries.docs.map((d) => (
              <li key={d.hash} className="break-all">
                <code className="text-xs">{d.hash}</code>
                <br />
                {formatTimestamp(d.timestamp)} - {d.revoked ? "revoked" : "valid"} -{" "}
                {d.description || "no description"} - notary <code>{shortAddress(d.notary)}</code>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
