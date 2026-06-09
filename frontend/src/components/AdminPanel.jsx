import { useState } from "react";
import { ethers } from "ethers";
import { decodeError } from "../lib/utils.js";
import { Result, inputClass, buttonClass } from "./ui.jsx";

export default function AdminPanel({ wallet }) {
  const [notaryAddress, setNotaryAddress] = useState("");
  const [adminResult, setAdminResult] = useState(null);
  const [revokeHash, setRevokeHash] = useState("");
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeResult, setRevokeResult] = useState(null);

  async function manageNotary(action) {
    const addr = notaryAddress.trim();
    if (!ethers.isAddress(addr)) {
      return setAdminResult({ type: "error", node: "Invalid Ethereum address." });
    }
    try {
      if (action === "check") {
        const isNotary = await wallet.readContract.isNotary(addr);
        return setAdminResult({
          type: "success",
          node: isNotary ? (
            <>
              <code>{addr}</code> has notary permissions.
            </>
          ) : (
            <>
              <code>{addr}</code> does not have notary permissions.
            </>
          ),
        });
      }
      setAdminResult({ type: "pending", node: "Confirm transaction in MetaMask..." });
      const tx =
        action === "add"
          ? await wallet.contract.addNotary(addr)
          : await wallet.contract.removeNotary(addr);
      await tx.wait();
      setAdminResult({
        type: "success",
        node: (
          <>
            {action === "add" ? "Granted" : "Removed"} notary permissions for <code>{addr}</code>
          </>
        ),
      });
    } catch (err) {
      setAdminResult({ type: "error", node: decodeError(err) });
    }
  }

  async function onRevoke() {
    const hash = revokeHash.trim();
    if (!ethers.isHexString(hash, 32)) {
      return setRevokeResult({ type: "error", node: "Provide a valid hash (0x + 64 hex chars)." });
    }
    try {
      setRevokeResult({ type: "pending", node: "Confirm transaction in MetaMask..." });
      const tx = await wallet.contract.revokeDocument(hash, revokeReason.trim());
      await tx.wait();
      setRevokeResult({
        type: "success",
        node: (
          <>
            Entry revoked: <code>{hash}</code>
          </>
        ),
      });
    } catch (err) {
      setRevokeResult({ type: "error", node: decodeError(err) });
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">
        Notary Role Management (Admin only)
      </h2>
      <input
        type="text"
        className={inputClass}
        placeholder="Notary address 0x..."
        value={notaryAddress}
        onChange={(e) => setNotaryAddress(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass}
          onClick={() => manageNotary("add")}
          disabled={!wallet.isAdmin}
        >
          Grant Role
        </button>
        <button
          className={buttonClass}
          onClick={() => manageNotary("remove")}
          disabled={!wallet.isAdmin}
        >
          Remove Role
        </button>
        <button
          className={buttonClass}
          onClick={() => manageNotary("check")}
          disabled={!wallet.connected}
        >
          Check Role
        </button>
      </div>
      {adminResult && <Result type={adminResult.type}>{adminResult.node}</Result>}

      <h3 className="mt-8 mb-3 text-lg font-semibold">
        Revoke Entry (Notary only)
      </h3>
      <input
        type="text"
        className={inputClass}
        placeholder="Document hash 0x..."
        value={revokeHash}
        onChange={(e) => setRevokeHash(e.target.value)}
      />
      <input
        type="text"
        className={inputClass}
        placeholder="Revoke reason"
        value={revokeReason}
        onChange={(e) => setRevokeReason(e.target.value)}
      />
      <button
        className={buttonClass}
        onClick={onRevoke}
        disabled={!wallet.isNotary}
      >
        Revoke Entry
      </button>
      {revokeResult && <Result type={revokeResult.type}>{revokeResult.node}</Result>}
    </section>
  );
}
