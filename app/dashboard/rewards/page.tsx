"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, Award, TrendingUp, Gift, Star, Clock, Shield } from "lucide-react";

interface RewardSummary {
  tier: string;
  totalPoints: number;
  reliabilityScore: number;
  onTimeReturns: number;
  completedRentals: number;
  pointsToNextTier: number;
  nextTier: string;
}

interface PointsHistory {
  id: string;
  amount: number;
  reason: string;
  type: string;
  createdAt: string;
}

interface Discount {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  discountPercent: number;
  isUsed: boolean;
  expiresAt: string;
}

const TIER_COLORS: Record<string, string> = {
  bronze: "from-amber-700 to-yellow-700",
  silver: "from-gray-400 to-gray-500",
  gold: "from-yellow-500 to-amber-500",
  platinum: "from-purple-500 to-indigo-500",
};

export default function RewardsPage() {
  const { user } = useUser();
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, historyRes, discountsRes] = await Promise.all([
        fetch("/api/rewards"),
        fetch("/api/rewards?type=history&limit=20"),
        fetch("/api/rewards?type=discounts"),
      ]);

      if (summaryRes.ok) setSummary(await summaryRes.json());
      if (historyRes.ok) {
        const h = await historyRes.json();
        setHistory(h.history || []);
      }
      if (discountsRes.ok) {
        const d = await discountsRes.json();
        setDiscounts(d.discounts || []);
      }
    } catch (err) {
      console.error("rewards error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
        <p className="text-gray-400 text-sm">Loading rewards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rewards</h1>
        <p className="text-gray-500 text-sm mt-1">Earn points and unlock perks</p>
      </div>

      {/* Tier Card */}
      <div className={`bg-gradient-to-r ${TIER_COLORS[summary?.tier || "bronze"] || "from-orange-500 to-amber-500"} rounded-2xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium uppercase tracking-wider">Your Tier</p>
            <h2 className="text-3xl font-bold mt-1 capitalize">{summary?.tier || "Bronze"}</h2>
          </div>
          <Award className="w-12 h-12 text-white/30" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Total Points", value: summary?.totalPoints ?? 0, icon: Star },
            { label: "Reliability", value: `${summary?.reliabilityScore ?? 0}%`, icon: Shield },
            { label: "On-Time Returns", value: summary?.onTimeReturns ?? 0, icon: Clock },
            { label: "Completed", value: summary?.completedRentals ?? 0, icon: TrendingUp },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <Icon className="w-4 h-4 text-white/60 mb-1" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-white/70">{stat.label}</p>
              </div>
            );
          })}
        </div>
        {summary?.nextTier && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-white/80">
              {summary.pointsToNextTier > 0
                ? `${summary.pointsToNextTier} points until ${summary.nextTier}`
                : `You reached ${summary.nextTier}!`}
            </p>
          </div>
        )}
      </div>

      {/* Discounts */}
      {discounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Available Discounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {discounts.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.description}</p>
                  <p className="text-xs text-orange-600 font-medium mt-1">{d.pointsCost} points &middot; {d.discountPercent}% off</p>
                </div>
                {d.isUsed && (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Used</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        {history.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
            <TrendingUp className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">No points activity yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{entry.reason}</p>
                  <p className="text-xs text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-semibold ${entry.type === "earned" ? "text-green-600" : "text-red-500"}`}>
                  {entry.type === "earned" ? "+" : "-"}{entry.amount} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}