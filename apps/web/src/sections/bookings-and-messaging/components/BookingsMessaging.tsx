import { useState, useMemo } from 'react';
import type {
  BookingsMessagingProps,
  BookingStatus,
} from '../types';
import { BookingCard } from './BookingCard';
import { BookingDetail } from './BookingDetail';
import { CalendarView } from './CalendarView';

export function BookingsMessaging({
  currentUserId,
  currentUserRole,
  bookings,
  users,
  contracts,
  deposits,
  timeEntries,
  invoices,
  messages,
  selectedBookingId,
  view = 'list',
  statusFilter = 'all',
  onCancelBooking,
  onSignContract,
  onSubmitDeposit,
  onApproveTimeEntry,
  onDisputeTimeEntry,
  onPayInvoice,
  onSendMessage,
  onSelectBooking,
  onChangeView,
  onFilterByStatus,
  onSearchBookings,
}: BookingsMessagingProps) {
  const [localView, setLocalView] = useState<'list' | 'calendar'>(view);
  const [localStatusFilter, setLocalStatusFilter] = useState<BookingStatus | 'all'>(statusFilter);
  const [localSelectedBookingId, setLocalSelectedBookingId] = useState<string | undefined>(selectedBookingId);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangeView = (newView: 'list' | 'calendar') => {
    setLocalView(newView);
    onChangeView?.(newView);
  };

  const handleFilterByStatus = (status: BookingStatus | 'all') => {
    setLocalStatusFilter(status);
    onFilterByStatus?.(status);
  };

  const handleSelectBooking = (bookingId: string) => {
    setLocalSelectedBookingId(bookingId);
    onSelectBooking?.(bookingId);
  };

  const handleCloseDetail = () => {
    setLocalSelectedBookingId(undefined);
    onSelectBooking?.('');
  };

  // Filter and search bookings
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Filter by status
    if (localStatusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status === localStatusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.serviceType.toLowerCase().includes(query) ||
          b.location.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [bookings, localStatusFilter, searchQuery]);

  // Get user by ID
  const getUserById = (id: string) => users.find((u) => u.id === id);

  // Get unread message count for a booking
  const getUnreadCount = (bookingId: string) => {
    return messages.filter(
      (m) => m.bookingId === bookingId && !m.read && m.recipientId === currentUserId
    ).length;
  };

  // Selected booking data
  const selectedBooking = localSelectedBookingId
    ? bookings.find((b) => b.id === localSelectedBookingId)
    : undefined;

  const selectedBookingMessages = selectedBooking
    ? messages.filter((m) => m.bookingId === selectedBooking.id)
    : [];

  const selectedBookingContract = selectedBooking
    ? contracts.find((c) => c.bookingId === selectedBooking.id)
    : undefined;

  const selectedBookingDeposit = selectedBooking
    ? deposits.find((d) => d.bookingId === selectedBooking.id)
    : undefined;

  const selectedBookingTimeEntries = selectedBooking
    ? timeEntries.filter((t) => t.bookingId === selectedBooking.id)
    : [];

  const selectedBookingInvoices = selectedBooking
    ? invoices.filter((i) => i.bookingId === selectedBooking.id)
    : [];

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      'in-progress': bookings.filter((b) => b.status === 'in-progress').length,
      completed: bookings.filter((b) => b.status === 'completed').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    };
  }, [bookings]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 rounded-xl p-6 sm:p-8 text-white shadow-lg overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-sm mb-2">
                    Bookings & Messaging
                  </h1>
                  <p className="text-amber-50 drop-shadow-sm">
                    Manage your bookings, track progress, and communicate with{' '}
                    {currentUserRole === 'client' ? 'technicians' : 'clients'}
                  </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm p-1 rounded-lg">
                  <button
                    onClick={() => handleChangeView('list')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      localView === 'list'
                        ? 'bg-white text-amber-800 shadow-sm'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </button>
                  <button
                    onClick={() => handleChangeView('calendar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      localView === 'calendar'
                        ? 'bg-white text-amber-800 shadow-sm'
                        : 'text-white hover:bg-white/20'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        {localView === 'list' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {(['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleFilterByStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  localStatusFilter === status
                    ? 'bg-amber-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {status === 'all' && 'All'}
                {status === 'pending' && 'Pending'}
                {status === 'confirmed' && 'Confirmed'}
                {status === 'in-progress' && 'In Progress'}
                {status === 'completed' && 'Completed'}
                {status === 'cancelled' && 'Cancelled'}
                <span className="ml-2 text-xs opacity-75">
                  ({statusCounts[status]})
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        {localView === 'list' && (
          <div className="mt-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearchBookings?.(e.target.value);
                }}
                placeholder="Search bookings by title, service type, or location..."
                className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-amber-400 dark:focus:border-amber-600 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {localView === 'list' ? (
          <div>
            {filteredBookings.length > 0 ? (
              <div className="grid gap-4">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    client={getUserById(booking.clientId)}
                    technician={booking.technicianId ? getUserById(booking.technicianId) : undefined}
                    unreadCount={getUnreadCount(booking.id)}
                    currentUserRole={currentUserRole}
                    onClick={() => handleSelectBooking(booking.id)}
                    onMessage={() => {
                      handleSelectBooking(booking.id);
                      // Switch to messages tab would happen in detail view
                    }}
                    onAccept={() => console.log('Accept booking', booking.id)}
                    onDecline={() => console.log('Decline booking', booking.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  No bookings found
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try adjusting your search or filter criteria'
                    : `You don't have any ${localStatusFilter === 'all' ? '' : localStatusFilter + ' '}bookings yet`}
                </p>
              </div>
            )}
          </div>
        ) : (
          <CalendarView
            bookings={bookings}
            users={users}
            currentUserId={currentUserId}
            onSelectBooking={handleSelectBooking}
          />
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetail
          booking={selectedBooking}
          client={getUserById(selectedBooking.clientId)}
          technician={selectedBooking.technicianId ? getUserById(selectedBooking.technicianId) : undefined}
          contract={selectedBookingContract}
          deposit={selectedBookingDeposit}
          timeEntries={selectedBookingTimeEntries}
          invoices={selectedBookingInvoices}
          messages={selectedBookingMessages}
          users={users}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          onClose={handleCloseDetail}
          onSignContract={() => {
            if (selectedBookingContract) {
              onSignContract?.(selectedBookingContract.id);
            }
          }}
          onSubmitDeposit={() => {
            if (selectedBookingDeposit) {
              onSubmitDeposit?.(selectedBookingDeposit.id, 'credit_card');
            }
          }}
          onApproveTimeEntry={(timeEntryId: string) => onApproveTimeEntry?.(timeEntryId)}
          onDisputeTimeEntry={(timeEntryId: string) => onDisputeTimeEntry?.(timeEntryId, 'Needs clarification')}
          onPayInvoice={(invoiceId: string) => onPayInvoice?.(invoiceId, 'credit_card')}
          onSendMessage={(content: string) => onSendMessage?.(selectedBooking.id, { content })}
          onCancelBooking={() => {
            onCancelBooking?.(selectedBooking.id, 'Change of plans');
            handleCloseDetail();
          }}
        />
      )}
    </div>
  );
}
