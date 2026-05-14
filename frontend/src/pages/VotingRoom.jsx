import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';

const TYPE_LABELS = { RESTAURANT: '🍽️', GENRE: '🌮', LOCATION: '📍' };

const VotingRoom = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nomForm, setNomForm] = useState({ name: '', type: 'RESTAURANT' });
  const [nomLoading, setNomLoading] = useState(false);
  const [showNomForm, setShowNomForm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [voteLoading, setVoteLoading] = useState({});

  const fetchSession = () =>
    api.get(`/voting/sessions/${sessionId}`)
      .then((res) => setSession(res.data.session))
      .catch(() => setError('Could not load session'));

  useEffect(() => {
    fetchSession().finally(() => setLoading(false));
  }, [sessionId]);

  const handleVote = async (optionId, value) => {
    setVoteLoading((v) => ({ ...v, [optionId]: true }));
    try {
      await api.post(`/voting/sessions/${sessionId}/options/${optionId}/vote`, { value });
      await fetchSession();
    } catch (err) {
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
      setError(err.response?.data?.error || 'Failed to close session');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-16 text-gray-400">Loading session...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-16 text-red-400">{error}</div>
      </div>
    );
  }

  const isActive = session.status === 'ACTIVE';
  const sorted = [...(session.options || [])].sort((a, b) => b.score - a.score);
  const winner = session.status === 'CLOSED' && sorted[0];

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

        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{session.title}</h2>
            <span className={`text-xs font-semibold ${isActive ? 'text-nom-500' : 'text-gray-400'}`}>
              {isActive ? '● Active' : '✓ Closed'}
            </span>
          </div>
          {isActive && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { setShowNomForm(true); setError(''); }}>
                + NOMinate
              </Button>
              <Button variant="danger" size="sm" loading={closing} onClick={handleCloseSession}>
                Close
              </Button>
            </div>
          )}
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

        {winner && (
          <Card className="mb-6 bg-gradient-to-r from-nom-500 to-orange-400 border-0 text-white">
            <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">🏆 Top NOM — Winner!</p>
            <p className="text-2xl font-extrabold">{winner.name}</p>
            <p className="text-sm opacity-80 mt-1">
              {TYPE_LABELS[winner.type]} {winner.score > 0 ? `+${winner.score}` : winner.score} votes
            </p>
          </Card>
        )}

        <div className="space-y-3">
          {sorted.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">🤔</p>
              <p className="text-gray-500 font-semibold">No NOMinees yet!</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to NOMinate a spot.</p>
            </div>
          ) : (
            sorted.map((opt, idx) => (
              <Card key={opt.id}>
                <div className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center font-bold text-gray-300">
                    {idx === 0 && session.status === 'CLOSED' ? '🏆' : `#${idx + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{opt.name}</p>
                    <p className="text-xs text-gray-400">
                      {TYPE_LABELS[opt.type]} {opt.type.charAt(0) + opt.type.slice(1).toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {isActive && (
                      <button
                        onClick={() => handleVote(opt.id, opt.myVote === 1 ? -1 : 1)}
                        disabled={voteLoading[opt.id]}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 ${
                          opt.myVote === 1
                            ? 'bg-nom-500 text-white'
                            : 'bg-gray-100 hover:bg-nom-100 text-gray-500'
                        }`}
                      >
                        ▲
                      </button>
                    )}
                    <span
                      className={`w-10 text-center font-extrabold text-sm ${
                        opt.score > 0 ? 'text-nom-600' : opt.score < 0 ? 'text-red-400' : 'text-gray-400'
                      }`}
                    >
                      {opt.score > 0 ? `+${opt.score}` : opt.score}
                    </span>
                    {isActive && (
                      <button
                        onClick={() => handleVote(opt.id, opt.myVote === -1 ? 1 : -1)}
                        disabled={voteLoading[opt.id]}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 ${
                          opt.myVote === -1
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 hover:bg-red-100 text-gray-500'
                        }`}
                      >
                        ▼
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default VotingRoom;
