import type { Booking, User } from '../types';

interface BookingCardProps {
  booking: Booking;
  client?: User;
  technician?: User;
  unreadCount?: number;
  currentUserRole: 'client' | 'technician';
  onClick?: () => void;
  onMessage?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'in-progress':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'completed':
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-300';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

export function BookingCard({
  booking,
  client,
  technician,
  unreadCount = 0,
  currentUserRole,
  onClick,
  onMessage,
  onAccept,
  onDecline,
}: BookingCardProps) {
  const otherUser = currentUserRole === 'client' ? technician : client;
  const showActions = booking.status === 'pending' && currentUserRole === 'technician';

  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer hover:shadow-md"
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          {otherUser && (
            <img
              src={otherUser.avatar}
              alt={otherUser.name}
              className="w-12 h-12 rounded-full flex-shrink-0 ring-2 ring-zinc-100 dark:ring-zinc-800"
            />
          )}

          {/* User & Title Info */}
          <div className="flex-1 min-w-0">
            {otherUser && (
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {otherUser.name}
                </span>
                {booking.bookingType === 'open' && (
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
                    Open
                  </span>
                )}
              </div>
            )}
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg leading-tight truncate">
              {booking.title}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              {booking.serviceType}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('-', ' ')}
          </span>
          {unreadCount > 0 && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-xs font-medium">{unreadCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        {/* Date */}
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="min-w-0">
            <div className="text-zinc-600 dark:text-zinc-400 truncate">
              {formatDate(booking.startDate)}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-zinc-600 dark:text-zinc-400">
            {booking.estimatedDuration} hrs
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 col-span-2">
          <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="text-zinc-600 dark:text-zinc-400 line-clamp-1 flex-1">
            {booking.location}
          </div>
        </div>
      </div>

      {/* Rate & Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ${booking.agreedRate || booking.budgetMax || 0}
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">/hr</span>
          {booking.budgetMin && booking.budgetMax && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500 ml-2">
              (${booking.budgetMin}-${booking.budgetMax})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Message Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMessage?.();
            }}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
            aria-label="Message"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>

          {/* Accept/Decline for pending bookings */}
          {showActions && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept?.();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Accept
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecline?.();
                }}
                className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg transition-colors"
              >
                Decline
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
