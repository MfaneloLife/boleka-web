"use client";

import { useState, useEffect } from "react";
import { Check, X, Loader2, Landmark } from "lucide-react";

// South African banks with branch codes
const SA_BANKS = [
  { name: "ABSA", universalCode: "632005" },
  { name: "African Bank", universalCode: "430000" },
  { name: "Bank of Athens", universalCode: "410506" },
  { name: "Bidvest Bank", universalCode: "462005" },
  { name: "Capitec Bank", universalCode: "470010" },
  { name: "Discovery Bank", universalCode: "679000" },
  { name: "First National Bank (FNB)", universalCode: "250655" },
  { name: "Investec Bank", universalCode: "580105" },
  { name: "Mercantile Bank", universalCode: "450905" },
  { name: "Nedbank", universalCode: "198765" },
  { name: "SA Post Bank (Postbank)", universalCode: "460005" },
  { name: "Standard Bank", universalCode: "051001" },
  { name: "TymeBank", universalCode: "678910" },
  { name: "UBank", universalCode: "471001" },
];

interface BankAccount {
  id: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: "cheque" | "savings" | "transmission";
  verified: boolean;
}

export default function BankingDetailsForm({ onSaved }: { onSaved?: () => void }) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    bankName: "Standard Bank",
    accountHolder: "",
    accountNumber: "",
    branchCode: "051001",
    accountType: "savings" as "cheque" | "savings" | "transmission",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wallet/banking");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleBankChange = (bankName: string) => {
    const bank = SA_BANKS.find(b => b.name === bankName);
    setForm(p => ({
      ...p,
      bankName,
      branchCode: bank?.universalCode || p.branchCode,
    }));
  };

  const validateAccount = (): string | null => {
    if (!form.accountHolder.trim()) return "Account holder name is required";
    if (!form.accountNumber.trim()) return "Account number is required";
    if (form.accountNumber.replace(/\D/g, "").length < 7) return "Account number seems too short";
    if (!form.branchCode.trim()) return "Branch code is required";
    return null;
  };

  const handleSave = async () => {
    const validationError = validateAccount();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/wallet/banking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save bank details");
      }

      const data = await res.json();
      setSuccess("Bank account saved successfully!");
      setShowForm(false);
      setForm({
        bankName: "Standard Bank",
        accountHolder: "",
        accountNumber: "",
        branchCode: "051001",
        accountType: "savings",
      });
      fetchAccounts();
      onSaved?.();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm("Remove this bank account?")) return;
    try {
      await fetch(`/api/wallet/banking?id=${accountId}`, { method: "DELETE" });
      fetchAccounts();
    } catch {
      setError("Failed to remove account");
    }
  };

  const selectedBank = SA_BANKS.find(b => b.name === form.bankName);

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-900">Bank Account for Payouts</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-orange-600 hover:text-orange-700 transition"
        >
          {showForm ? "Cancel" : accounts.length > 0 ? "+ Add Another" : "+ Add Account"}
        </button>
      </div>

      {/* Success/Error messages */}
      {success && (
        <div className="mx-5 mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}
      {error && (
        <div className="mx-5 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <X className="w-4 h-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Existing accounts */}
      {accounts.length > 0 && (
        <div className="px-5 py-3 space-y-3">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Landmark className="w-4 h-4 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{acc.bankName}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {acc.accountType} • •••{acc.accountNumber.slice(-4)} • {acc.accountHolder}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {acc.verified ? (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">Verified</span>
                ) : (
                  <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">Pending</span>
                )}
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="px-5 py-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-orange-500" />
        </div>
      )}

      {!loading && accounts.length === 0 && !showForm && (
        <div className="px-5 py-8 text-center">
          <Landmark className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No bank account added</p>
          <p className="text-xs text-gray-400 mt-1">Add your bank details to receive payouts via EFT</p>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="px-5 py-4 space-y-3 border-t border-gray-100">
          <div>
            <label className="text-xs font-medium text-gray-600">Bank</label>
            <select
              value={form.bankName}
              onChange={e => handleBankChange(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
            >
              {SA_BANKS.map(bank => (
                <option key={bank.name} value={bank.name}>{bank.name}</option>
              ))}
            </select>
            {selectedBank && (
              <p className="mt-1 text-xs text-gray-400">Universal branch code: {selectedBank.universalCode}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Account Holder Name</label>
            <input
              type="text"
              value={form.accountHolder}
              onChange={e => setForm(p => ({ ...p, accountHolder: e.target.value }))}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
              placeholder="Name as it appears on the account"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600">Account Number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={16}
                value={form.accountNumber}
                onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value.replace(/\D/g, "") }))}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                placeholder="7-16 digits"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Branch Code</label>
              <input
                type="text"
                value={form.branchCode}
                onChange={e => setForm(p => ({ ...p, branchCode: e.target.value }))}
                className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none"
                placeholder="Branch code"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600">Account Type</label>
            <select
              value={form.accountType}
              onChange={e => setForm(p => ({ ...p, accountType: e.target.value as typeof form.accountType }))}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-400 outline-none bg-white"
            >
              <option value="cheque">Cheque / Current</option>
              <option value="savings">Savings</option>
              <option value="transmission">Transmission</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:from-orange-600 hover:to-amber-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Bank Account"}
          </button>
        </div>
      )}
    </div>
  );
}