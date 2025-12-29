import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type {
  UserManagementProps,
  AccountStatus,
  AdminNote,
} from '../types';

export function UserManagement({
  users,
  filters,
  onSearch,
  onFilter,
  onViewUser,
  onSuspendUser,
  onUnsuspendUser,
  onVerifyCredentials,
  onAddNote,
  isLoading = false,
}: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState<string | null>(null);
  const [showNoteModal, setShowNoteModal] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7 days');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<AdminNote['category']>('general');

  const itemsPerPage = 25;
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((u) => u.id)));
    }
  };

  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'suspended':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending_verification':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'banned':
        return 'bg-red-600/20 text-red-300 border-red-600/30';
      case 'deactivated':
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const handleSuspendUser = async (userId: string) => {
    await onSuspendUser(userId, suspendReason, suspendDuration);
    setShowSuspendModal(null);
    setSuspendReason('');
    setSuspendDuration('7 days');
  };

  const handleAddNote = async (userId: string) => {
    await onAddNote(userId, noteContent, noteCategory);
    setShowNoteModal(null);
    setNoteContent('');
    setNoteCategory('general');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          User Management
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {users.length} total users
        </p>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 dark:text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search users by name, email, or ID..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Role Filter */}
            <select
              value={filters.role || ''}
              onChange={(e) => onFilter({ ...filters, role: e.target.value as any })}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <option value="">All Roles</option>
              <option value="technician">Technicians</option>
              <option value="company">Companies</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.accountStatus?.[0] || ''}
              onChange={(e) =>
                onFilter({
                  ...filters,
                  accountStatus: e.target.value ? [e.target.value as AccountStatus] : undefined,
                })
              }
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="banned">Banned</option>
              <option value="deactivated">Deactivated</option>
            </select>

            {/* Location Filter */}
            <input
              type="text"
              value={filters.location || ''}
              onChange={(e) => onFilter({ ...filters, location: e.target.value })}
              placeholder="Location"
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            />

            {/* Clear Filters */}
            <button
              onClick={() => onFilter({})}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filters.role || filters.accountStatus || filters.location) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.role && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-md border border-amber-500/30">
                Role: {filters.role}
                <button
                  onClick={() => onFilter({ ...filters, role: undefined })}
                  className="hover:text-amber-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.accountStatus && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-md border border-amber-500/30">
                Status: {filters.accountStatus[0]}
                <button
                  onClick={() => onFilter({ ...filters, accountStatus: undefined })}
                  className="hover:text-amber-200"
                >
                  ×
                </button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-md border border-amber-500/30">
                Location: {filters.location}
                <button
                  onClick={() => onFilter({ ...filters, location: undefined })}
                  className="hover:text-amber-200"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedUsers.size > 0 && (
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm text-white bg-amber-600 hover:bg-amber-500 rounded-md transition-colors">
                Export Selected
              </button>
              <button className="px-3 py-1.5 text-sm text-white bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-md transition-colors">
                Bulk Action
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table - Hidden on Mobile */}
      <div className="hidden lg:block flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-amber-500 focus:ring-2 focus:ring-amber-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Verification
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Bookings
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Flags
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Financial
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-50 dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-500">
                  Loading users...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-500">
                  No users found
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50 transition-colors">
                  {/* Checkbox */}
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-amber-500 focus:ring-2 focus:ring-amber-500"
                    />
                  </td>

                  {/* User Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-900 dark:text-white overflow-hidden">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-zinc-900 dark:text-white truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                          {user.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      {user.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(user.accountStatus)}`}>
                      {user.accountStatus.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Verification Badges */}
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      {user.verificationStatus.emailVerified && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Email Verified">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </span>
                      )}
                      {user.verificationStatus.phoneVerified && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Phone Verified">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        </span>
                      )}
                      {user.verificationStatus.credentialsVerified && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Credentials Verified">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      {user.verificationStatus.insuranceVerified && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Insurance Verified">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Bookings */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-900 dark:text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {user.totalBookings}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      {user.completionRate}% complete
                    </div>
                  </td>

                  {/* Rating */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm text-zinc-900 dark:text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {user.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      {user.totalReviews} reviews
                    </div>
                  </td>

                  {/* Flags */}
                  <td className="px-6 py-4">
                    <span className={`text-sm ${user.flagCount > 0 ? 'text-red-400' : 'text-zinc-500 dark:text-zinc-500'}`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {user.flagCount}
                    </span>
                  </td>

                  {/* Financial */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-900 dark:text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      ${user.role === 'technician' ? user.totalEarnings?.toLocaleString() : user.totalSpent?.toLocaleString()}
                    </div>
                    {user.role === 'technician' && user.pendingPayouts && user.pendingPayouts > 0 && (
                      <div className="text-xs text-amber-400">
                        ${user.pendingPayouts.toLocaleString()} pending
                      </div>
                    )}
                  </td>

                  {/* Last Active */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-600 dark:text-zinc-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {new Date(user.lastActive).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                        className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openDropdown === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                onViewUser(user.id);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                            >
                              View Details
                            </button>
                            {user.accountStatus === 'suspended' ? (
                              <button
                                onClick={() => {
                                  onUnsuspendUser(user.id);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                style={{ fontFamily: 'DM Sans, sans-serif' }}
                              >
                                Unsuspend User
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setShowSuspendModal(user.id);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                style={{ fontFamily: 'DM Sans, sans-serif' }}
                              >
                                Suspend User
                              </button>
                            )}
                            {!user.verificationStatus.credentialsVerified && user.role === 'technician' && (
                              <button
                                onClick={() => {
                                  onVerifyCredentials(user.id);
                                  setOpenDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                style={{ fontFamily: 'DM Sans, sans-serif' }}
                              >
                                Verify Credentials
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setShowNoteModal(user.id);
                                setOpenDropdown(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                              style={{ fontFamily: 'DM Sans, sans-serif' }}
                            >
                              Add Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout - Hidden on Desktop */}
      <div className="lg:hidden flex-1 overflow-auto px-4 py-4">
        {isLoading ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-500">
            Loading users...
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-500">
            No users found
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
              >
                {/* Header: Avatar, Name, Email, Checkbox */}
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="mt-1 w-4 h-4 rounded border-zinc-400 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-amber-500 focus:ring-2 focus:ring-amber-500 flex-shrink-0"
                  />
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-900 dark:text-white overflow-hidden flex-shrink-0">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 dark:text-white truncate" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {user.name}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                    className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {/* Dropdown Menu for Mobile */}
                  {openDropdown === user.id && (
                    <div className="absolute right-4 mt-8 w-48 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg z-10">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            onViewUser(user.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          View Details
                        </button>
                        {user.accountStatus === 'suspended' ? (
                          <button
                            onClick={() => {
                              onUnsuspendUser(user.id);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            Unsuspend User
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setShowSuspendModal(user.id);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            Suspend User
                          </button>
                        )}
                        {!user.verificationStatus.credentialsVerified && user.role === 'technician' && (
                          <button
                            onClick={() => {
                              onVerifyCredentials(user.id);
                              setOpenDropdown(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            style={{ fontFamily: 'DM Sans, sans-serif' }}
                          >
                            Verify Credentials
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShowNoteModal(user.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                          style={{ fontFamily: 'DM Sans, sans-serif' }}
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Badges Row: Role and Status */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    {user.role}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(user.accountStatus)}`}>
                    {user.accountStatus.replace('_', ' ')}
                  </span>
                </div>

                {/* Verification Badges */}
                <div className="flex gap-1.5 mb-3">
                  {user.verificationStatus.emailVerified && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Email Verified">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </span>
                  )}
                  {user.verificationStatus.phoneVerified && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Phone Verified">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </span>
                  )}
                  {user.verificationStatus.credentialsVerified && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Credentials Verified">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                  {user.verificationStatus.insuranceVerified && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500/20 text-green-400" title="Insurance Verified">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Bookings */}
                  <div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Bookings</div>
                    <div className="text-zinc-900 dark:text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {user.totalBookings}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      {user.completionRate}% complete
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Rating</div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-zinc-900 dark:text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                        {user.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500">
                      {user.totalReviews} reviews
                    </div>
                  </div>

                  {/* Flags */}
                  <div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">Flags</div>
                    <span className={`text-sm ${user.flagCount > 0 ? 'text-red-400' : 'text-zinc-500 dark:text-zinc-500'}`} style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      {user.flagCount}
                    </span>
                  </div>

                  {/* Financial */}
                  <div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mb-1">
                      {user.role === 'technician' ? 'Earnings' : 'Spent'}
                    </div>
                    <div className="text-zinc-900 dark:text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                      ${user.role === 'technician' ? user.totalEarnings?.toLocaleString() : user.totalSpent?.toLocaleString()}
                    </div>
                    {user.role === 'technician' && user.pendingPayouts && user.pendingPayouts > 0 && (
                      <div className="text-xs text-amber-400">
                        ${user.pendingPayouts.toLocaleString()} pending
                      </div>
                    )}
                  </div>
                </div>

                {/* Last Active */}
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-500">
                    Last active: <span className="text-zinc-600 dark:text-zinc-400">{new Date(user.lastActive).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-600 dark:text-zinc-400" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, users.length)} of {users.length} users
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                    style={{ fontFamily: 'DM Sans, sans-serif' }}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Suspend User Modal */}
      <Modal
        isOpen={!!showSuspendModal}
        onClose={() => {
          setShowSuspendModal(null);
          setSuspendReason('');
          setSuspendDuration('7 days');
        }}
        ariaLabel="Suspend User"
        className="w-full max-w-md mx-4"
      >
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Suspend User
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Reason
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter suspension reason..."
                rows={3}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Duration
              </label>
              <select
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <option value="7 days">7 days</option>
                <option value="14 days">14 days</option>
                <option value="30 days">30 days</option>
                <option value="permanent">Permanent</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => showSuspendModal && handleSuspendUser(showSuspendModal)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Suspend
            </button>
            <button
              onClick={() => {
                setShowSuspendModal(null);
                setSuspendReason('');
                setSuspendDuration('7 days');
              }}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={!!showNoteModal}
        onClose={() => {
          setShowNoteModal(null);
          setNoteContent('');
          setNoteCategory('general');
        }}
        ariaLabel="Add Admin Note"
        className="w-full max-w-md mx-4"
      >
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg w-full p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4" style={{ fontFamily: 'DM Sans, sans-serif' }}>
            Add Admin Note
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Category
              </label>
              <select
                value={noteCategory}
                onChange={(e) => setNoteCategory(e.target.value as AdminNote['category'])}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                <option value="general">General</option>
                <option value="warning">Warning</option>
                <option value="positive">Positive</option>
                <option value="investigation">Investigation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
                Note
              </label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter admin note..."
                rows={4}
                className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => showNoteModal && handleAddNote(showNoteModal)}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Add Note
            </button>
            <button
              onClick={() => {
                setShowNoteModal(null);
                setNoteContent('');
                setNoteCategory('general');
              }}
              className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg transition-colors"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Click Outside Handler for Dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}
