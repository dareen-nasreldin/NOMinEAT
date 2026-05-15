import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import Navbar from '../components/Navbar';
import Card from '../components/Card';
import Button from '../components/Button';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TYPE_LABELS = { RESTAURANT: '🍽️', GENRE: '🌮', LOCATION: '📍' };

const GripIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
    <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
    <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
  </svg>
);

const SortableOption = ({ opt, idx, isActive, isWinner, voteLoading, onVote }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: opt.id,
    disabled: !isActive,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        zIndex: isDragging ? 50 : 'auto',
      }}
    >
      <Card>
        <div className="flex items-center gap-3">
          {isActive ? (
            <button
              {...attributes}
              {...listeners}
              className="text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none p-1 -ml-1 rounded-lg shrink-0"
              tabIndex={-1}
            >
              <GripIcon />
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}

          <span className="text-base w-7 text-center font-bold text-gray-300 shrink-0">
            {isWinner ? '🏆' : `#${idx + 1}`}
          </span>

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
        </div>
      </Card>
    </div>
  );
};

// FSM: toggling the same value un-votes (returns 0); switching flips the vote.
const nextVote = (current, target) => (current === target ? 0 : target);

// Sort options for a user's personal view during active session.
// Upvoted (1) first, neutral (null) middle, downvoted (-1) last.
const sortByMyVote = (options) =>
  [...options].sort((a, b) => (b.myVote ?? 0) - (a.myVote ?? 0));

// Sort by combined score for the closed results view.
const sortByScore = (options) =>
  [...options].sort((a, b) => b.score - a.score);

const VotingRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [orderedOptions, setOrderedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nomForm, setNomForm] = useState({ name: '', type: 'RESTAURANT' });
  const [nomLoading, setNomLoading] = useState(false);
  const [showNomForm, setShowNomForm] = useState(false);
  const [closing, setClosing] = useState(false);
  const [voteLoading, setVoteLoading] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // preserveOrder=true: update option data in-place without resetting the list order.
  // Used after voting so the user's drag arrangement stays intact.
  // preserveOrder=false: re-sort from scratch (initial load, new nominee, session close).
  const fetchSession = async (preserveOrder = false) => {
    const res = await api.get(`/voting/sessions/${sessionId}`);
    const data = res.data.session;
    setSession(data);

    const incoming = data.options || [];

    if (preserveOrder) {
      setOrderedOptions((prev) => {
        const map = Object.fromEntries(incoming.map((o) => [o.id, o]));
        const updated = prev.map((o) => map[o.id] ?? o).filter((o) => map[o.id]);
        const newOnes = incoming.filter((o) => !prev.find((p) => p.id === o.id));
        return [...updated, ...newOnes];
      });
    } else {
      const sorted =
        data.status === 'CLOSED' ? sortByScore(incoming) : sortByMyVote(incoming);
      setOrderedOptions(sorted);
    }
  };

  useEffect(() => {
    fetchSession(false)
      .catch(() => setError('Could not load session'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setOrderedOptions((items) =>
      arrayMove(
        items,
        items.findIndex((i) => i.id === active.id),
        items.findIndex((i) => i.id === over.id),
      )
    );
  };

  const handleVote = async (optionId, value) => {
    // Optimistic update: flip the button color immediately, no waiting for the server.
    setOrderedOptions((prev) =>
      prev.map((o) => (o.id === optionId ? { ...o, myVote: value === 0 ? null : value } : o))
    );
    setVoteLoading((v) => ({ ...v, [optionId]: true }));
    try {
      await api.post(`/voting/sessions/${sessionId}/options/${optionId}/vote`, { value });
      await fetchSession(true);
    } catch (err) {
      // Revert to true server state on failure.
      await fetchSession(true);
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
      // New item arrived — re-sort so it appears in the right place.
      await fetchSession(false);
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
      // Session closed — re-sort by combined score to reveal winner.
      await fetchSession(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to close session');
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
              {TYPE_LABELS[winner.type]} {winner.type.charAt(0) + winner.type.slice(1).toLowerCase()}
            </p>
          </Card>
        )}

        {isActive && orderedOptions.length > 1 && (
          <p className="text-xs text-gray-400 text-center mb-3">
            Drag ⠿ to reorder · 👍👎 to vote (tap again to undo)
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={orderedOptions.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                {orderedOptions.map((opt, idx) => (
                  <SortableOption
                    key={opt.id}
                    opt={opt}
                    idx={idx}
                    isActive={isActive}
                    isWinner={!isActive && idx === 0}
                    voteLoading={voteLoading}
                    onVote={handleVote}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>
    </div>
  );
};

export default VotingRoom;
