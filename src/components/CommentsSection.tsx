'use client';

import { useState, useTransition } from 'react';
import { addComment, deleteComment } from '@/app/actions/comments';
import { useToast } from '@/app/providers';
import { Trash2 } from 'lucide-react';

interface CommentItem {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
  };
}

interface CommentsSectionProps {
  eventId: string;
  token?: string | null;
  comments: CommentItem[];
  currentUserId?: string | null;
  isOwner: boolean;
}

export function CommentsSection({
  eventId,
  token,
  comments,
  currentUserId,
  isOwner,
}: CommentsSectionProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const formData = new FormData();
    formData.append('content', content);

    startTransition(async () => {
      const res = await addComment(eventId, token, null, formData);
      if (res?.error) {
        addToast(res.error, 'error');
      } else {
        setContent('');
        addToast('Коментар додано', 'success');
      }
    });
  };

  const handleDelete = (commentId: string) => {
    if (!confirm('Видалити цей коментар?')) return;

    startTransition(async () => {
      const res = await deleteComment(commentId, eventId, token);
      if (res?.error) {
        addToast(res.error, 'error');
      } else {
        addToast('Коментар видалено', 'info');
      }
    });
  };

  return (
    <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Коментарі ({comments.length})
      </h2>

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Напишіть коментар..."
              maxLength={1000}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
              <span>Plain text з підтримкою переносів рядків</span>
              <span>{content.length}/1000</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Надсилання...' : 'Додати коментар'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-8 bg-gray-50 p-4 rounded-lg">
          Увійдіть, щоб залишати коментарі.
        </p>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Поки що немає коментарів. Будьте першим!
          </p>
        ) : (
          comments.map((comment) => {
            const canDelete =
              currentUserId &&
              (comment.user.id === currentUserId || isOwner);

            const formattedDate = new Intl.DateTimeFormat('uk-UA', {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(new Date(comment.createdAt));

            return (
              <div
                key={comment.id}
                className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formattedDate}
                    </span>
                  </div>

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={isPending}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                      title="Видалити коментар"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
