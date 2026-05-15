import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';

const TYPE_LABELS = { RESTAURANT: '🍽️', GENRE: '🌮', LOCATION: '📍' };

// FSM: toggling the same value un-votes (returns 0); switching flips the vote.
const nextVote = (current, target) => (current === target ? 0 : target);

const sortByMyVote = (options) =>
  [...options].sort((a, b) => (b.myVote ?? 0) - (a.myVote ?? 0));

const sortByScore = (options) =>
  [...options].sort((a, b) => b.score - a.score);

const OptionCard = ({ opt, isActive, isWinner, rank, voteLoading, onVote }) => (
  <Card>
    <div className="flex items-center gap-3">
      {isWinner ? (
        <span className="text-base w-7 text-center shrink-0">🏆</span>
      ) : !isActive ? (
        <span className="text-sm font-bold text-gray-300 w-7 text-center shrink-0">#{rank}</span>
      ) : null}

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 truncate">{opt.name}</p>
        <p className="text-xs text-gray-400">
          {TYPE_LABELS[opt.type]} {opt.type.charAt(0) + opt.type.slice(1).toLowerCase()}
        </p>
      </div>

      {isActive && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onVote(opt.id, nextVote(opt.myVote, 1))}
            disabled={!!voteLoading[opt.id]}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90 disabled:opacity-50 disabled:active:scale-100 ${
              opt.myVote === 1
                ? 'bg-nom-500 shadow-sm'
                : 'bg-gray-100 hover:bg-nom-100'
            }`}
          >
            👍
          </button>
          <button
            onClick={() => onVote(opt.id, nextVote(opt.myVote, -1))}
            disabled={!!voteLoading[opt.id]}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all active:scale-90 disabled:opacity-50 disabled:active:scale-100 ${
              opt.myVote === -1
                ? 'bg-red-500 shadow-sm'
                : 'bg-gray-100 hover:bg-red-200'
            }`}
          >
            👎
          </button>
        </div>
      )}

      {!isActive && (
        <span className={`text-sm font-bold shrink-0 tabular-nums ${opt.score >= 0 ? 'text-nom-500' : 'text-red-400'}`}>
          {opt.score > 0 ? '+' : ''}{opt.score}
        </span>
      )}
    </div>
  </Card>
);

const VotingRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [orderedOptions, setOrderedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nomForm, setNomForm] = useState({ name: '', type: 'RESTAURANT' });
  const [nomLoading, setNomLoading] = useState(false);
  const [showNomForm, setShowNomForm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [voteLoading, setVoteLoading] = useState({});

  const applySession = (data) => {
    setSession(data);
    const incoming = data.options || [];
    setOrderedOptions(data.status === 'CLOSED' ? sortByScore(incoming) : sortByMyVote(incoming));
  };

  const fetchSession = async () => {
    const res = await api.get(`/voting/sessions/${sessionId}`);
    applySession(res.data.session);
  };

  useEffect(() => {
    fetchSession()
      .catch(() => setError('Could not load session'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Poll every 3 s while ACTIVE so all clients instantly see when the host ends the session.
  useEffect(() => {
    if (!session || session.status !== 'ACTIVE') return;
    const id = setInterval(async () => {
      try {
        const res = await api.get(`/voting/sessions/${sessionId}`);
        const data = res.data.session;
        setSession(data);
        const incoming = data.options || [];
        setOrderedOptions(data.status === 'CLOSED' ? sortByScore(incoming) : sortByMyVote(incoming));
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [sessionId, session?.status]);

  const handleVote = async (optionId, value) => {
    // Optimistic update: flip button color immediately.
    setOrderedOptions((prev) =>
      prev.map((o) => (o.id === optionId ? { ...o, myVote: value === 0 ? null : value } : o))
    );
    setVoteLoading((v) => ({ ...v, [optionId]: true }));
    try {
      await api.post(`/voting/sessions/${sessionId}/options/${optionId}/vote`, { value });
      await fetchSession();
    } catch (err) {
      await fetchSession();
      setError(err.response?.data?.error || 'Vote failed');
    } finally {
      setVoteLoading((v) => ({ ...v, [optionId]: false }));
    }
  };

  const handleNominate = async (e) => {
    e.preventDefault();
    setNomLoading(true);
    setError('');
    try {
      await api.post(`/voting/sessions/${sessionId}/nominate`, nomForm);
      setNomForm({ name: '', type: 'RESTAURANT' });
      setShowNomForm(false);
      await fetchSession();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to NOMinate');
    } finally {
      setNomLoading(false);
    }
  };

  const handleCloseSession = async () => {
    setClosing(true);
    try {
      await api.patch(`/voting/sessions/${sessionId}/close`);
      await fetchSession();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to end session');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50"><Navbar />
        <div className="text-center py-16 text-gray-400">Loading session...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50"><Navbar />
        <div className="text-center py-16 text-red-400">{error}</div>
      </div>
    );
  }

  const isActive = session.status === 'ACTIVE';
  const isHost = user?.id === session.hostId;
  const winner = !isActive && orderedOptions[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/groups/${session.group.id}`)}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
        >
          ‹ {session.group.name}
        </button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{session.title}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-xs font-semibold ${isActive ? 'text-nom-500' : 'text-gray-400'}`}>
                {isActive ? '● Active' : '✓ Closed'}
              </span>
              {session.host && (
                <span className="text-xs text-gray-400">
                  · 👑 {session.host.username}{isHost ? ' (you)' : ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            {isActive && (
              <Button size="sm" onClick={() => { setShowNomForm(true); setError(''); }}>
                + NOMinate
              </Button>
            )}
            {isActive && isHost && (
              <Button variant="danger" size="sm" loading={closing} onClick={handleCloseSession}>
                End Session
              </Button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}

        {showNomForm && isActive && (
          <Card className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">NOMinate a Spot</p>
            <form onSubmit={handleNominate} className="space-y-3">
              <input
                value={nomForm.name}
                onChange={(e) => setNomForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Chipotle, Italian, Downtown..."
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-nom-400"
              />
              <div className="flex gap-2">
                {['RESTAURANT', 'GENRE', 'LOCATION'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNomForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      nomForm.type === t
                        ? 'bg-nom-500 text-white border-nom-500'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-nom-300'
                    }`}
                  >
                    {TYPE_LABELS[t]} {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="full" loading={nomLoading}>Submit NOMination</Button>
                <Button type="button" variant="ghost" size="md" onClick={() => setShowNomForm(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {!isActive && (
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">
            — Final Results —
          </p>
        )}

        {winner && (
          <Card className="mb-6 bg-gradient-to-r from-nom-500 to-orange-400 border-0 text-white">
            <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">🏆 Top NOM — Winner!</p>
            <p className="text-2xl font-extrabold">{winner.name}</p>
            <p className="text-sm opacity-80 mt-1">
              {TYPE_LABELS[winner.type]} {winner.type.charAt(0) + winner.type.slice(1).toLowerCase()}
            </p>
          </Card>
        )}

        {isActive && (
          <p className="text-xs text-gray-400 text-center mb-3">
            👍👎 to vote · tap again to undo
          </p>
        )}

        <div className="space-y-3">
          {orderedOptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🤔</p>
              <p className="text-gray-500 font-semibold">No NOMinees yet!</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to NOMinate a spot.</p>
            </div>
          ) : (
            orderedOptions.map((opt, idx) => (
              <OptionCard
                key={opt.id}
                opt={opt}
                isActive={isActive}
                isWinner={!isActive && idx === 0}
                rank={idx + 1}
                voteLoading={voteLoading}
                onVote={handleVote}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default VotingRoom;
