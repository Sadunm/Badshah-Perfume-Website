import React, { useState, useEffect } from 'react';
import { CustomRequest } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { subscribeToRealtimeTable } from '../../services/supabase.ts';
import {
  Sparkles,
  Phone,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  Search,
  MessageCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const AdminCustomRequests: React.FC = () => {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetCustomRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load custom requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const unsubscribe = subscribeToRealtimeTable<CustomRequest>('custom_requests', (payload) => {
      if (payload.eventType === 'INSERT') {
        setRequests((prev) => [payload.new, ...prev.filter((r) => r.id !== payload.new.id)]);
      } else if (payload.eventType === 'UPDATE') {
        setRequests((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
      } else if (payload.eventType === 'DELETE') {
        setRequests((prev) => prev.filter((r) => r.id !== payload.old.id));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStatusChange = async (
    id: string,
    newStatus: 'Pending' | 'Contacted' | 'Fulfilled' | 'Cancelled'
  ) => {
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    try {
      await api.adminUpdateCustomRequestStatus(id, newStatus);
      setMessage(`Status updated to "${newStatus}"`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(`Failed to update status: ${err.message}`);
      fetchRequests();
    }
  };

  const handleDelete = async (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    setDeletingId(null);
    try {
      await api.adminDeleteCustomRequest(id);
      setMessage('Custom perfume request deleted successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setError(`Failed to delete request: ${err.message}`);
      fetchRequests();
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.customerName.toLowerCase().includes(q) ||
      r.customerPhone.includes(q) ||
      r.perfumeName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: CustomRequest['status']) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/50">
            Pending
          </span>
        );
      case 'Contacted':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-950/70 text-blue-300 border border-blue-800/50">
            Contacted
          </span>
        );
      case 'Fulfilled':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50">
            Fulfilled
          </span>
        );
      case 'Cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-red-950/70 text-red-300 border border-red-800/50">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#10b981]" />
            <span>Custom Perfume Requests</span>
          </h1>
          <p className="text-xs text-[#80808a] mt-1">
            Review customer requests when an item was not in stock or requested via custom formulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#a1a1aa]">Total Requests:</span>
          <span className="px-2.5 py-1 rounded-lg bg-[#181822] text-[#10b981] font-bold text-xs border border-[#262635]">
            {requests.length}
          </span>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['All', 'Pending', 'Contacted', 'Fulfilled', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-[#10b981] text-black font-bold'
                  : 'bg-[#14141a] text-[#a1a1aa] hover:text-white'
              }`}
            >
              {st} ({st === 'All' ? requests.length : requests.filter((r) => r.status === st).length})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#71717a]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, perfume, phone..."
            className="w-full pl-9 pr-4 py-2 bg-[#121217] border border-[#23232c] rounded-lg text-xs text-white placeholder-[#71717a] focus:outline-none focus:border-[#10b981]"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-[#0f0f13] border border-[#1f1f26] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14141b] text-[#71717a] uppercase tracking-wider font-semibold border-b border-[#1c1c24]">
              <tr>
                <th className="py-3 px-4">Requested Perfume</th>
                <th className="py-3 px-4">Volume (ML)</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181820]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#71717a]">
                    Loading custom requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#71717a]">
                    <div className="space-y-1">
                      <Sparkles className="w-8 h-8 text-[#10b981] mx-auto opacity-30" />
                      <p className="font-semibold text-white">No custom requests found</p>
                      <p className="text-[11px] text-[#71717a]">
                        When customers request custom perfumes from storefront, they will appear here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-[#121217] transition-colors">
                    <td className="py-3 px-4 font-serif font-bold text-white text-sm">
                      {req.perfumeName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#181822] text-[#10b981] border border-[#272738]">
                        {req.volumeMl} ML
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{req.customerName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#71717a]">
                        <Phone className="w-3 h-3 text-[#10b981]" />
                        <span>{req.customerPhone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#a1a1aa]">
                      {new Date(req.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-[#a1a1aa] max-w-xs truncate">
                      {req.notes || <span className="text-[#555] italic">None</span>}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleStatusChange(req.id, e.target.value as any)
                        }
                        className="px-2.5 py-1 rounded bg-[#181822] border border-[#272738] text-xs font-semibold text-white focus:outline-none focus:border-[#10b981]"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* WhatsApp Contact */}
                        <a
                          href={`https://wa.me/${req.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hello ${req.customerName}, regarding your custom perfume request for "${req.perfumeName}" (${req.volumeMl}ml) at Badshah Premium Perfume...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>

                        {/* Call Customer */}
                        <a
                          href={`tel:${req.customerPhone}`}
                          className="p-1.5 rounded-lg bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 transition-colors"
                          title="Call Customer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>

                        {/* Delete with inline confirmation */}
                        {deletingId === req.id ? (
                          <div className="flex items-center gap-1 bg-[#1a1a24] p-1 rounded-lg border border-red-800/40">
                            <span className="text-[10px] text-red-400">Del?</span>
                            <button
                              onClick={() => handleDelete(req.id)}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-1.5 py-0.5 rounded text-[10px] text-[#71717a]"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(req.id)}
                            className="p-1.5 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-[#1a1a24] transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
