import React, { useState, useEffect } from 'react';
import { BroadcastNotification } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Bell,
  Mail,
  Send,
  Radio,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Users,
  Smartphone,
} from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [broadcastType, setBroadcastType] = useState<'PUSH' | 'EMAIL' | 'BOTH'>('BOTH');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetBroadcasts();
      setBroadcasts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load broadcast history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and message content are required.');
      return;
    }

    setSending(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.adminSendBroadcast({
        title: title.trim(),
        body: body.trim(),
        link: link.trim() || undefined,
        type: broadcastType,
      });

      setMessage(res.message);
      setTitle('');
      setBody('');
      setLink('');
      fetchBroadcasts();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5">
          <Bell className="w-6 h-6 text-[#10b981]" />
          <span>Customer Push & Email Broadcasts</span>
        </h1>
        <p className="text-xs text-[#80808a] mt-1">
          Compose promotional announcements, discount alerts, or royal restock updates to reach your subscribed customers.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Broadcast Composer */}
      <div className="rounded-2xl bg-[#0f0f14] border border-[#22222e] p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#10b981]">
          <Send className="w-4 h-4" />
          <span>Compose New Broadcast</span>
        </div>

        <form onSubmit={handleSend} className="space-y-5">
          {/* Target Audience Options */}
          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-2">
              Broadcast Delivery Channel
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  broadcastType === 'BOTH'
                    ? 'bg-[#10b981]/10 border-[#10b981] text-white'
                    : 'bg-[#14141c] border-[#252535] text-[#80808a] hover:border-[#353545]'
                }`}
              >
                <input
                  type="radio"
                  name="broadcastType"
                  value="BOTH"
                  checked={broadcastType === 'BOTH'}
                  onChange={() => setBroadcastType('BOTH')}
                  className="hidden"
                />
                <Radio className="w-4 h-4 text-[#10b981]" />
                <div>
                  <div className="text-xs font-bold text-white">All Channels (Push + Email)</div>
                  <div className="text-[10px] text-[#80808a]">Maximum reach across all devices</div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  broadcastType === 'PUSH'
                    ? 'bg-[#10b981]/10 border-[#10b981] text-white'
                    : 'bg-[#14141c] border-[#252535] text-[#80808a] hover:border-[#353545]'
                }`}
              >
                <input
                  type="radio"
                  name="broadcastType"
                  value="PUSH"
                  checked={broadcastType === 'PUSH'}
                  onChange={() => setBroadcastType('PUSH')}
                  className="hidden"
                />
                <Smartphone className="w-4 h-4 text-[#10b981]" />
                <div>
                  <div className="text-xs font-bold text-white">Web Push Notifications</div>
                  <div className="text-[10px] text-[#80808a]">Instant alert to browser & mobile</div>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${
                  broadcastType === 'EMAIL'
                    ? 'bg-[#10b981]/10 border-[#10b981] text-white'
                    : 'bg-[#14141c] border-[#252535] text-[#80808a] hover:border-[#353545]'
                }`}
              >
                <input
                  type="radio"
                  name="broadcastType"
                  value="EMAIL"
                  checked={broadcastType === 'EMAIL'}
                  onChange={() => setBroadcastType('EMAIL')}
                  className="hidden"
                />
                <Mail className="w-4 h-4 text-[#10b981]" />
                <div>
                  <div className="text-xs font-bold text-white">Customer Email Broadcast</div>
                  <div className="text-[10px] text-[#80808a]">Sent to registered emails</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
              Notification Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: রয়্যাল ঈদুল ফিতর স্পেশাল কালেকশন লাইভ!"
              className="w-full px-4 py-2.5 rounded-xl bg-[#14141c] border border-[#262638] text-white text-sm focus:border-[#10b981] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
              Message Body *
            </label>
            <textarea
              rows={3}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="যেমন: আমাদের নতুন এক্সক্লুসিভ কম্বোডিয়ান উদ এবং সুলতান ব্লেন্ড সীমিত পরিমাণে স্টকে এসেছে। অর্ডার করুন বিনামূল্যে ভেলভেট পাউচ সহ।"
              className="w-full px-4 py-2.5 rounded-xl bg-[#14141c] border border-[#262638] text-white text-sm focus:border-[#10b981] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#a1a1aa] mb-1.5">
              Action / Link URL (Optional)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /#collections or https://badshahperfume.com"
              className="w-full px-4 py-2.5 rounded-xl bg-[#14141c] border border-[#262638] text-white text-sm focus:border-[#10b981] focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="px-6 py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-[#10b981] to-[#059669] text-[#0a0a0d] hover:brightness-110 active:scale-[0.99] transition-all flex items-center gap-2 shadow-lg shadow-[#10b981]/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Broadcast...' : 'Send Broadcast Now'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#10b981]" />
          <span>Broadcast Transmission Log</span>
        </h3>

        <div className="bg-[#0f0f13] border border-[#1f1f26] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14141b] text-[#71717a] uppercase tracking-wider font-semibold border-b border-[#1c1c24]">
                <tr>
                  <th className="py-3 px-4">Title & Message</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Recipients</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181820]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#71717a]">
                      Loading broadcast history...
                    </td>
                  </tr>
                ) : broadcasts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[#71717a]">
                      <div className="space-y-1">
                        <Bell className="w-8 h-8 text-[#10b981] mx-auto opacity-30" />
                        <p className="font-semibold text-white">No broadcasts sent yet</p>
                        <p className="text-[11px] text-[#71717a]">
                          Announcements dispatched to customers will be logged here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  broadcasts.map((b) => (
                    <tr key={b.id} className="hover:bg-[#121217] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{b.title}</div>
                        <div className="text-xs text-[#80808a] line-clamp-1 mt-0.5">{b.body}</div>
                        {b.link && (
                          <span className="text-[10px] text-[#10b981] block mt-0.5">{b.link}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#181822] text-[#10b981] border border-[#272738]">
                          {b.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#a1a1aa] font-mono">
                        {b.recipientCount} device(s)
                      </td>
                      <td className="py-3 px-4 text-[#71717a]">
                        {new Date(b.sentAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Delivered</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
