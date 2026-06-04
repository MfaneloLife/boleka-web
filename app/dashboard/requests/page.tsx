"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Loader2,
  MessageSquare,
  ClipboardList,
  ArrowLeftRight,
  ImageIcon,
  Check,
  X,
} from "lucide-react";

interface Request {
  id: string;
  status: string;
  item: { id: string; title: string; imageUrls: string[] };
  requester: { id: string; name: string; image: string | null };
  owner: { id: string; name: string; image: string | null };
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  _count: { messages: number };
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function RequestsPage() {
  const { user } = useUser();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const type = filter === "all" ? null : filter;
      const res = await fetch(
        `/api/requests${type ? `?type=${type}` : ""}`
      );
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error("requests error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, user]);

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept request");
      }
      setActionMessage({ type: "success", text: "Request accepted!" });
      fetchRequests();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to accept request",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to decline request");
      }
      setActionMessage({ type: "success", text: "Request declined." });
      fetchRequests();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to decline request",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your rental requests
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { key: "all", label: "All" },
          { key: "sent", label: "Sent" },
          { key: "received", label: "Received" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              filter === tab.key
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {actionMessage && (
        <div
          className={`px-4 py-2 rounded-lg text-sm ${
            actionMessage.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-3" />
          <p className="text-gray-400 text-sm">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <ArrowLeftRight className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h2 className="text-lg font-semibold text-gray-900">
            No requests yet
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filter === "sent"
              ? "You haven't sent any requests."
              : filter === "received"
              ? "No one has requested your items yet."
              : "No requests to show."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const isSender = req.requester.id === user?.id;
            const otherPerson = isSender ? req.owner : req.requester;
            const isPendingReceived =
              !isSender && req.status === "PENDING";

            return (
              <div
                key={req.id}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
              >
                {/* Clickable area: item thumbnail + info navigates to conversation */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Link
                    href={`/messages/${req.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    {/* Item thumbnail */}
                    <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {req.item.imageUrls?.[0] ? (
                        <img
                          src={req.item.imageUrls[0]}
                          alt={req.item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {req.item.title}
                        </p>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            STATUS_STYLES[req.status] ||
                            "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {isSender ? "You →" : "← You"}{" "}
                        {otherPerson.name || "Unknown"}
                      </p>
                      {req.lastMessage && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {req.lastMessage.content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <MessageSquare className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {req._count?.messages || 0} messages
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Accept/Decline buttons for received PENDING requests */}
                {isPendingReceived && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition disabled:opacity-50"
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={actionLoading === req.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition disabled:opacity-50"
                    >
                      {actionLoading === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}