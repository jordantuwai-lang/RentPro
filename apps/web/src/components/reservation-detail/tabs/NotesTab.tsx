'use client';
import { useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { inp } from '../shared/styles';

export function NotesTab({ reservationId }: { reservationId: string }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const authorName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Staff';

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['reservation-notes', reservationId],
    queryFn: async () => {
      const token = await getToken();
      const res = await api.get(`/reservations/${reservationId}/notes`, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return api.post(`/reservations/${reservationId}/notes`, { note: noteText, authorName }, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      setNoteText('');
      queryClient.invalidateQueries({ queryKey: ['reservation-notes', reservationId] });
    },
  });

  return (
    <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Notes</h3>

      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Log a call attempt, update, or any relevant note..."
          style={{ ...inp, height: '90px', resize: 'vertical' }}
        />
        <button
          onClick={() => { if (noteText.trim()) addNote.mutate(); }}
          disabled={!noteText.trim() || addNote.isPending}
          style={{ marginTop: '8px', padding: '8px 20px', borderRadius: '8px', border: 'none', background: noteText.trim() ? '#01ae42' : '#e2e8f0', color: noteText.trim() ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: noteText.trim() ? 'pointer' : 'not-allowed' }}>
          {addNote.isPending ? 'Saving...' : 'Add Note'}
        </button>
      </div>

      {isLoading ? (
        <div style={{ color: '#94a3b8', fontSize: '13px' }}>Loading notes...</div>
      ) : notes.length === 0 ? (
        <div style={{ color: '#94a3b8', fontSize: '13px' }}>No notes yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notes.map((n: any) => (
            <div key={n.id} style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 14px', borderLeft: '3px solid #01ae42' }}>
              <div style={{ fontSize: '13px', color: '#0f172a', lineHeight: 1.5, marginBottom: '6px' }}>{n.note}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                {n.authorName} · {new Date(n.createdAt).toLocaleString('en-AU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
