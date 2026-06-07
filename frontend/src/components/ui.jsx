const STYLES = {
  success: "border-emerald-400 bg-emerald-400/10",
  error: "border-red-400 bg-red-400/10",
  warning: "border-amber-400 bg-amber-400/10",
  pending: "border-indigo-400 bg-indigo-400/10",
};

export function Result({ type, children }) {
  if (!type) return null;
  return (
    <div
      className={`mt-4 rounded-lg border p-4 text-sm leading-relaxed break-all ${STYLES[type]}`}
    >
      {children}
    </div>
  );
}

export function FileDrop({ label, onFile }) {
  return (
    <label className="mb-4 block cursor-pointer rounded-xl border-2 border-dashed border-slate-600 p-6 text-center text-slate-400 transition-colors hover:border-indigo-500">
      <input
        type="file"
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />
      <span>{label}</span>
    </label>
  );
}

export function HashOutput({ hash }) {
  return (
    <div className="mb-4 text-sm">
      <span className="mb-1 block text-slate-400">SHA-256 (off-chain):</span>
      <code className="break-all text-emerald-400">{hash || "-"}</code>
    </div>
  );
}

export const inputClass =
  "mb-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none";

export const buttonClass =
  "rounded-lg border border-slate-600 bg-slate-800 px-5 py-2.5 text-sm text-slate-200 transition-colors hover:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-45";

export const primaryButtonClass =
  "w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45";
