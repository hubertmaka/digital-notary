import { useState } from "react";
import { useWallet } from "./hooks/useWallet.js";
import { shortAddress } from "./lib/utils.js";
import { CONTRACT_ADDRESS } from "./config.js";
import RegisterPanel from "./components/RegisterPanel.jsx";
import VerifyPanel from "./components/VerifyPanel.jsx";
import AuditPanel from "./components/AuditPanel.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

const TABS = [
  { id: "register", label: "Register" },
  { id: "verify", label: "Verify" },
  { id: "audit", label: "Registry Audit" },
  { id: "admin", label: "Administration" },
];

export default function App() {
  const wallet = useWallet();
  const [tab, setTab] = useState("register");

  const roleBadge =
    wallet.isAdmin && wallet.isNotary
      ? "ADMIN + NOTARY"
      : wallet.isAdmin
      ? "ADMIN"
      : wallet.isNotary
      ? "NOTARY"
      : wallet.connected
      ? "VIEWER"
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-slate-200">
      <header className="border-b border-slate-700 px-6 pt-8 pb-4 text-center">
        <h1 className="text-3xl font-bold">Digital Notary</h1>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={wallet.connect}
            className="rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm transition-colors hover:border-indigo-500"
          >
            {wallet.connected
              ? "Reconnect / Change account"
              : "Connect MetaMask"}
          </button>
          {wallet.connected && (
            <button
              onClick={wallet.disconnect}
              className="rounded-lg border border-rose-500/60 bg-rose-500/10 px-5 py-2.5 text-sm transition-colors hover:border-rose-400"
            >
              Disconnect
            </button>
          )}
          <span className="text-sm text-slate-400">
            {wallet.connected
              ? shortAddress(wallet.address)
              : "Wallet not connected"}
          </span>
          {roleBadge && (
            <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
              {roleBadge}
            </span>
          )}
        </div>
        {wallet.error && (
          <p className="mt-2 text-sm text-red-400">{wallet.error}</p>
        )}
      </header>

      <nav className="flex flex-wrap justify-center gap-2 p-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-600 text-slate-400 hover:border-indigo-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-12">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
          {tab === "register" && <RegisterPanel wallet={wallet} />}
          {tab === "verify" && <VerifyPanel wallet={wallet} />}
          {tab === "audit" && <AuditPanel wallet={wallet} />}
          {tab === "admin" && <AdminPanel wallet={wallet} />}
        </div>
      </main>

      <footer className="border-t border-slate-700 p-5 text-center text-xs text-slate-400">
        Contract: <code>{CONTRACT_ADDRESS}</code>
      </footer>
    </div>
  );
}
