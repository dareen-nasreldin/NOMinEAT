import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/groups')
      .then((res) => setGroups(res.data.groups))
      .catch(() => setError('Failed to load your groups'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post('/groups', { name: groupName });
      setGroups((g) => [res.data.group, ...g]);
      setGroupName('');
      setShowCreate(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post('/groups/join', { inviteCode });
      setGroups((g) => [res.data.group, ...g]);
      setInviteCode('');
      setShowJoin(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join group');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">Your Groups</h2>
            <p className="text-sm text-gray-500 mt-0.5">Pick a squad and start NOMinating</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}>
              Join
            </Button>
            <Button size="sm" onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}>
              + Create
            </Button>
          </div>
        </div>

        {(showCreate || showJoin) && (
          <Card className="mb-4">
            {showCreate && (
              <form onSubmit={handleCreateGroup} className="flex gap-2">
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group name..."
                  required
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nom-400"
                />
                <Button type="submit" size="sm" loading={actionLoading}>Create</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              </form>
            )}
            {showJoin && (
              <form onSubmit={handleJoinGroup} className="flex gap-2">
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Invite code..."
                  required
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-nom-400"
                />
                <Button type="submit" size="sm" loading={actionLoading}>Join</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowJoin(false)}>Cancel</Button>
              </form>
            )}
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </Card>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading your groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🍔</p>
            <p className="text-gray-600 font-semibold">No groups yet!</p>
            <p className="text-gray-400 text-sm mt-1">Create one or join with an invite code.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <Card key={group.id} onClick={() => navigate(`/groups/${group.id}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                      {group.sessions?.length > 0 && (
                        <span className="ml-2 text-nom-500 font-semibold">
                          • {group.sessions.length} active session{group.sessions.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-mono">
                      {group.inviteCode}
                    </span>
                    <span className="text-gray-300">›</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
