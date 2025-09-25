"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type BankingDetails = {
  bankName: string;
  accountNumber: string;
  accountType: string;
  branchCode: string;
  accountHolderName: string;
};

const BANKS = [
  'Absa Group Limited',
  'First National Bank',
  'Nedbank Limited',
  'Capitec Bank Limited',
  'African Bank Limited',
  'JPMorgan Chase',
  'Standard Bank of South Africa',
  'Bank of India',
  'United Bank for Africa'
];

export default function BankingDetailsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [details, setDetails] = useState<BankingDetails>({
    bankName: "",
    accountNumber: "",
    accountType: "",
    branchCode: "",
    accountHolderName: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/payouts");
        if (!res.ok) throw new Error("Failed to load banking details");
        const data = await res.json();
        const b = data?.bankingDetails || {};
        setDetails({
          bankName: b.bankName || "",
          accountNumber: b.accountNumber || "",
          accountType: b.accountType || "",
          branchCode: b.branchCode || "",
          accountHolderName: b.accountHolderName || "",
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDetails((d) => ({ ...d, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/business/banking-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Failed to save banking details");
      }
  setSuccess("Banking details updated successfully.");
  setTimeout(() => router.push("/dashboard/business/wallet"), 800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-1">Banking details</h1>
      <p className="text-gray-600 mb-6">Add or update your account to receive payouts.</p>

      {loading ? (
        <div className="p-4 border rounded">Loading…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4 bg-white p-4 border rounded">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 rounded bg-green-50 text-green-700 text-sm">{success}</div>
          )}

          <div>
            <label htmlFor="bankName" className="block text-sm font-medium mb-1">Bank name</label>
            <select
              id="bankName"
              name="bankName"
              value={details.bankName}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select bank</option>
              {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium mb-1">Account number</label>
            <input
              id="accountNumber"
              type="text"
              name="accountNumber"
              value={details.accountNumber}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="accountType" className="block text-sm font-medium mb-1">Account type</label>
            <select
              id="accountType"
              name="accountType"
              value={details.accountType}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Select type</option>
              <option value="cheque">Cheque</option>
              <option value="savings">Savings</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div>
            <label htmlFor="branchCode" className="block text-sm font-medium mb-1">Branch code</label>
            <input
              id="branchCode"
              type="text"
              name="branchCode"
              value={details.branchCode}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="accountHolderName" className="block text-sm font-medium mb-1">Account holder name</label>
            <input
              id="accountHolderName"
              type="text"
              name="accountHolderName"
              value={details.accountHolderName}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save details"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
