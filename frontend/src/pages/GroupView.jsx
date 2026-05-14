import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';

const GroupView = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionTitle, setSessionTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/groups/${groupId}`)
      .then((res) => setGroup(res.data.group))
      .catch(() => setError('Could not load group'))
      .finally(() => setLoading(false));
  }, [groupId]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      const res = await api.post(`/voting/groups/${groupId}/sessions`, { title: sessionTitle });
      navigate(`/sessions/${res.data.session.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-16 text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-16 text-red-400">{error}</div>
      </div>
    );
  }

  const activeSessions = group.sessions.filter((s) => s.status === 'ACTIVE');
  const closedSessions = group.sessions.filter((s) => s.status === 'CLOSED');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1"
        >
          ‹ Back
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">{group.name}</h2>
            <p className="text-xs text-gray-400 mt-1">
              Invite code:
              <span className="font-mono font-bold text-gray-600 ml-1 bg-gray-100 px-1.5 py-0.5 rounded">
                {group.inviteCode}
              </span>
            </p>
          </div>
          <Button size="sm" onClick={() => { setShowForm(true); setError(''); }}>
            + New Session
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">New Voting Session</p>
            <form onSubmit={handleCreateSession} className="flex gap-2">
              <input
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Friday Lunch"
                required
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nom-400"
              />
              <Button type="submit" size="sm" loading={creating}>Start</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </form>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </Card>
        )}

        <div className="mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Active Sessions ({activeSessions.length})
          </h3>
          {activeSessions.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No active sessions — start one!</p>
          ) : (
            <div className="space-y-2">
              {activeSessions.map((s) => (
                <Card key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{s.title}</p>
                      <p className="text-xs text-nom-500 font-medium mt-0.5">● Active</p>
                    </div>
                    <span className="text-gray-300">›</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {closedSessions.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Past Sessions
            </h3>
            <div className="space-y-2">
              {closedSessions.map((s) => (
                <Card key={s.id} onClick={() => navigate(`/sessions/${s.id}`)}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-500">{s.title}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">Closed</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Members ({group.members.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <span
                key={m.id}
                className="text-sm bg-white border border-gray-100 shadow-sm px-3 py-1.5 rounded-full font-medium text-gray-700 flex items-center gap-1.5"
              >
                {m.user.username}
                {m.role === 'ADMIN' && (
                  <span className="text-xs text-nom-500 font-bold">★</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupView;
