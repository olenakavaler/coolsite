import Link from 'next/link';
import { Calendar, Users, Lock } from 'lucide-react';

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  startsAt: Date;
  capacity: number;
  coverImage?: string | null;
  visibility: string;
  token?: string | null;
  attendeesCount: number;
  ownerName: string;
}

export function EventCard({
  id,
  title,
  description,
  startsAt,
  capacity,
  coverImage,
  visibility,
  token,
  attendeesCount,
  ownerName,
}: EventCardProps) {
  const href = visibility === 'PRIVATE' && token ? `/e/${token}` : `/events/${id}`;
  const seatsLeft = Math.max(0, capacity - attendeesCount);
  const formattedDate = new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(startsAt));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="relative h-48 w-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl select-none">🎉</span>
        )}
        {visibility === 'PRIVATE' && (
          <span className="absolute top-3 right-3 bg-gray-900/80 backdrop-blur text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
            <Lock className="w-3 h-3" /> Приватна
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
            <time dateTime={new Date(startsAt).toISOString()}>{formattedDate}</time>
          </div>

          <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-2 hover:text-indigo-600 transition-colors">
            <Link href={href}>{title}</Link>
          </h3>

          <p className="text-gray-600 text-sm line-clamp-2 mb-4 whitespace-pre-wrap">
            {description}
          </p>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            {seatsLeft > 0 ? (
              <span className="text-green-600 font-medium">
                Залишилось {seatsLeft} з {capacity}
              </span>
            ) : (
              <span className="text-red-500 font-medium">Місць немає</span>
            )}
          </span>

          <span className="truncate max-w-[120px] text-gray-400">
            від {ownerName}
          </span>
        </div>
      </div>
    </div>
  );
}
