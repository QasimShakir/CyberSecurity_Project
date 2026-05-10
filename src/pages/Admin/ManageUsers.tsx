// ManageUsers.tsx — Admin user management page
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Search, Shield, ShieldOff, Trash2, Unlock,
  Users, RefreshCw, AlertTriangle, CheckCircle, X,
} from "lucide-react";
import axios from "axios";
import { AdminNav } from "./Dashboard";

// ── Types ──────────────────────────────────────────────────────────────────────
interface AppUser {
  id:                  string;
  username:            string;
  email:               string;
  role:                "reader" | "admin";
  createdAt:           string;
  failedLoginAttempts: number;
  isLocked:            boolean;
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
function ConfirmDialog({
  title, body, confirmLabel, danger, onConfirm, onCancel,
}: {
  title: string; body: string; confirmLabel: string;
  danger: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
      <div className="bg-parchment border border-dust rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className={`flex items-center gap-3 mb-4 ${danger ? "text-red-600" : "text-tan-oak"}`}>
          <AlertTriangle size={22} />
          <h3 className="font-serif font-bold text-xl text-dark-walnut">{title}</h3>
        </div>
        <p className="text-sm text-tan-oak mb-8 leading-relaxed">{body}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-6 py-3 rounded-lg font-bold text-sm text-tan-oak border border-dust hover:bg-warm-linen transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-8 py-3 rounded-lg font-bold text-sm text-white transition-all shadow-sm active:scale-95 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-library-green hover:bg-[#3D5A4C]"
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────
interface Toast { id: number; text: string; ok: boolean }
let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, ok = true) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, text, ok }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function ManageUsers() {
  const { token, user: currentUser } = useAuth();
  const { toasts, push } = useToast();

  const [users,      setUsers]      = useState<AppUser[]>([]);
  const [search,     setSearch]     = useState("");
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);

  // Confirm dialog state
  const [confirm, setConfirm] = useState<{
    title: string; body: string; label: string;
    danger: boolean; action: () => Promise<void>;
  } | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else        setRefreshing(true);
    try {
      const params: any = { page, limit: 20 };
      if (search.trim()) params.search = search.trim();
      const res = await axios.get("/api/admin/users", { headers, params });
      setUsers(res.data.users ?? []);
      setTotalPages(res.data.total_pages ?? 1);
      setTotal(res.data.total ?? 0);
    } catch (err: any) {
      push(err.response?.data?.error ?? "Failed to load users", false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, page, search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const delay = search ? 400 : 0;
    const t = setTimeout(() => fetchUsers(), delay);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const runConfirmed = async () => {
    if (!confirm) return;
    try {
      await confirm.action();
    } finally {
      setConfirm(null);
    }
  };

  const handleRoleChange = (u: AppUser, newRole: "reader" | "admin") => {
    const verb = newRole === "admin" ? "promote" : "demote";
    setConfirm({
      title:  `${newRole === "admin" ? "Promote" : "Demote"} user?`,
      body:   `Are you sure you want to ${verb} "${u.email}" to ${newRole}?`,
      label:  newRole === "admin" ? "Promote to Admin" : "Demote to Reader",
      danger: newRole !== "admin",
      action: async () => {
        await axios.patch(`/api/admin/users/${u.id}/role`, { role: newRole }, { headers });
        push(`${u.email} is now ${newRole}`, true);
        fetchUsers(true);
      },
    });
  };

  const handleDelete = (u: AppUser) => {
    setConfirm({
      title:  "Delete user account?",
      body:   `This will permanently delete "${u.email}" and all their reading progress. This cannot be undone.`,
      label:  "Delete Permanently",
      danger: true,
      action: async () => {
        await axios.delete(`/api/admin/users/${u.id}`, { headers });
        push(`${u.email} deleted`, true);
        fetchUsers(true);
      },
    });
  };

  const handleUnlock = async (u: AppUser) => {
    try {
      await axios.patch(`/api/admin/users/${u.id}/unlock`, {}, { headers });
      push(`${u.email} unlocked`, true);
      fetchUsers(true);
    } catch (err: any) {
      push(err.response?.data?.error ?? "Failed to unlock", false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-bold text-white
              ${t.ok ? "bg-library-green" : "bg-red-600"}`}>
            {t.ok ? <CheckCircle size={16} /> : <X size={16} />}
            {t.text}
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.label}
          danger={confirm.danger}
          onConfirm={runConfirmed}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-dust mb-2">The Shelf</p>
          <h1 className="text-4xl font-serif font-bold text-dark-walnut mb-3">Manage Users</h1>
          <p className="text-tan-oak font-medium italic">
            {loading ? "Loading…" : `${total.toLocaleString()} registered user${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-tan-oak border border-dust px-4 py-2.5 rounded-lg hover:bg-parchment transition-colors mt-2">
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <AdminNav active="users" />

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dust" size={17} />
        <input
          type="text"
          placeholder="Search by name or email…"
          className="w-full bg-parchment border border-dust rounded-lg pl-12 pr-10 py-3 text-sm focus:outline-none focus:border-tan-oak transition-colors text-dark-walnut placeholder:text-dust"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button onClick={() => { setSearch(""); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dust hover:text-tan-oak">
            <X size={15} />
          </button>
        )}
      </div>

      {/* User table */}
      <div className="bg-parchment border border-dust rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dust bg-warm-linen">
                <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-dust">User</th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-dust">Role</th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-dust">Joined</th>
                <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-dust">Status</th>
                <th className="text-right px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-dust">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dust">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-dust/20 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <Users size={36} className="text-dust mx-auto mb-3" strokeWidth={1} />
                    <p className="font-serif italic text-dust">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-warm-linen transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-dark-walnut">{u.username}</p>
                        <p className="text-xs text-dust mt-0.5">{u.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                          u.role === "admin"
                            ? "bg-aged-gold/10 text-aged-gold border-aged-gold/30"
                            : "bg-parchment text-dust border-dust"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-dust text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-4">
                        {u.isLocked ? (
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Locked</span>
                        ) : (
                          <span className="text-[10px] font-bold text-library-green uppercase tracking-widest">Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Unlock button (only for locked accounts) */}
                          {u.isLocked && (
                            <button
                              onClick={() => handleUnlock(u)}
                              title="Unlock account"
                              className="p-2 rounded-lg text-tan-oak hover:bg-warm-linen border border-dust transition-colors">
                              <Unlock size={15} />
                            </button>
                          )}

                          {/* Role toggle */}
                          {!isSelf && (
                            u.role === "reader" ? (
                              <button
                                onClick={() => handleRoleChange(u, "admin")}
                                title="Promote to admin"
                                className="p-2 rounded-lg text-aged-gold hover:bg-warm-linen border border-dust transition-colors">
                                <Shield size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRoleChange(u, "reader")}
                                title="Demote to reader"
                                className="p-2 rounded-lg text-tan-oak hover:bg-warm-linen border border-dust transition-colors">
                                <ShieldOff size={15} />
                              </button>
                            )
                          )}

                          {/* Delete (non-admin, non-self only) */}
                          {!isSelf && u.role !== "admin" && (
                            <button
                              onClick={() => handleDelete(u)}
                              title="Delete user"
                              className="p-2 rounded-lg text-red-400 hover:bg-red-50 border border-dust hover:border-red-200 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          )}

                          {isSelf && (
                            <span className="text-[10px] font-bold text-dust uppercase tracking-widest px-2">You</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-dust flex justify-between items-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-dust">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm font-bold text-tan-oak border border-dust rounded-lg hover:bg-warm-linen disabled:opacity-40 transition-colors">
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm font-bold text-tan-oak border border-dust rounded-lg hover:bg-warm-linen disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}