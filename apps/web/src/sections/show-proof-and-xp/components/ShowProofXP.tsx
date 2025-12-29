import React, { useState } from 'react';
import type { ShowProofAndXPProps, ShowProof } from '../types';
import ShowProofCard from './ShowProofCard';
import ShowProofDetail from './ShowProofDetail';
import XPDashboard from './XPDashboard';
import LotteryPanel from './LotteryPanel';
import UploadForm from './UploadForm';

type TabType = 'portfolio' | 'xp' | 'lottery' | 'upload';

const ShowProofXP: React.FC<ShowProofAndXPProps> = ({
  showProofs,
  technicianProfile,
  lotteryStatus,
  tierDefinitions,
  onUploadShowProof,
  onEditShowProof,
  onDeleteShowProof,
  onViewShowProofDetail,
  onViewLotteryRules,
  isUploadingShowProof = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [selectedShowProofId, setSelectedShowProofId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'xp' | 'rating'>('date');
  const [editingShowProof, setEditingShowProof] = useState<ShowProof | null>(null);

  const selectedShowProof = showProofs.find((sp) => sp.id === selectedShowProofId);

  const handleViewShowProof = (id: string) => {
    setSelectedShowProofId(id);
    onViewShowProofDetail(id);
  };

  const handleCloseDetail = () => {
    setSelectedShowProofId(null);
  };

  const handleEdit = (id: string) => {
    const showProof = showProofs.find((sp) => sp.id === id);
    if (showProof) {
      setEditingShowProof(showProof);
      setActiveTab('upload');
    }
  };

  const handleCancelEdit = () => {
    setEditingShowProof(null);
    setActiveTab('portfolio');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this show proof?')) {
      await onDeleteShowProof(id);
      handleCloseDetail();
    }
  };

  // Filter and sort show proofs
  const filteredShowProofs = showProofs.filter((sp) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'approved') return sp.status === 'approved';
    if (filterStatus === 'pending') return sp.status === 'pending_ai' || sp.status === 'pending_admin';
    return true;
  });

  const sortedShowProofs = [...filteredShowProofs].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    }
    if (sortBy === 'xp') {
      return (b.xpAwarded?.totalXp || 0) - (a.xpAwarded?.totalXp || 0);
    }
    if (sortBy === 'rating') {
      return (b.clientVerification.starRating || 0) - (a.clientVerification.starRating || 0);
    }
    return 0;
  });

  const tabs = [
    {
      id: 'portfolio' as TabType,
      label: 'Portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      count: showProofs.length,
    },
    {
      id: 'xp' as TabType,
      label: 'XP Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ),
      count: technicianProfile.totalXp,
    },
    {
      id: 'lottery' as TabType,
      label: 'Lottery',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h16v4H4V4zm0 6h16v10H4V10zm4 2v6h8v-6H8z" />
        </svg>
      ),
      count: lotteryStatus.currentTickets,
    },
    {
      id: 'upload' as TabType,
      label: 'Upload',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 rounded-xl p-6 sm:p-8 text-white shadow-lg overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-sm mb-2">
              Show Proof & XP
            </h1>
            <p className="text-amber-50 drop-shadow-sm">
              Build your portfolio, earn XP, and progress through tiers
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-8">
        <nav className="flex gap-2 overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-800 dark:text-amber-100'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {tab.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Filters & Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filter:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filterStatus === 'all'
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('approved')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filterStatus === 'approved'
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Approved
                  </button>
                  <button
                    onClick={() => setFilterStatus('pending')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      filterStatus === 'pending'
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Pending
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'xp' | 'rating')}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="date">Date</option>
                  <option value="xp">XP Earned</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {technicianProfile.totalShows}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Shows</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-100">
                  {technicianProfile.totalXp.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Total XP</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {technicianProfile.verifiedShows}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Verified</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  {technicianProfile.averageRating.toFixed(1)}
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Avg Rating</div>
              </div>
            </div>

            {/* Show Proof Grid */}
            {sortedShowProofs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedShowProofs.map((showProof) => (
                  <ShowProofCard
                    key={showProof.id}
                    showProof={showProof}
                    onView={handleViewShowProof}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    No show proofs found
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Upload your first show proof to start building your portfolio
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload Show Proof
                  </button>
                </div>

                {/* Sample Images Preview */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-950">
                  <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Get inspired by these examples:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <img
                        src="/images/show-proof/concert-event-samples.png"
                        alt="Concert event show proof examples"
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100 transition-opacity"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Concert & Event Photos
                      </p>
                    </div>
                    <div className="space-y-2">
                      <img
                        src="/images/show-proof/equipment-detail-samples.png"
                        alt="Equipment detail show proof examples"
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 opacity-75 hover:opacity-100 transition-opacity"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        Equipment Details
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* XP Dashboard Tab */}
        {activeTab === 'xp' && (
          <XPDashboard profile={technicianProfile} tierDefinitions={tierDefinitions} />
        )}

        {/* Lottery Tab */}
        {activeTab === 'lottery' && (
          <LotteryPanel lotteryStatus={lotteryStatus} onViewRules={onViewLotteryRules} />
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                {editingShowProof ? 'Update Show Proof' : 'Upload Show Proof'}
              </h2>
              <UploadForm
                onUpload={async (data) => {
                  if (editingShowProof) {
                    await onEditShowProof(editingShowProof.id, data);
                    setEditingShowProof(null);
                  } else {
                    await onUploadShowProof(data);
                  }
                  setActiveTab('portfolio');
                }}
                onCancel={() => {
                  setEditingShowProof(null);
                  setActiveTab('portfolio');
                }}
                isUploading={isUploadingShowProof}
                editingShowProof={editingShowProof || undefined}
                onCancelEdit={handleCancelEdit}
              />
            </div>

            {/* Example Show Proof Images */}
            {!editingShowProof && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                  What makes good show proof?
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Here are examples of high-quality show proof submissions:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <img
                      src="/images/show-proof/concert-event-samples.png"
                      alt="Concert event show proof examples"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Concert & Event Photos: Clear venue shots, stage setups, crowd views
                    </p>
                  </div>
                  <div className="space-y-2">
                    <img
                      src="/images/show-proof/equipment-detail-samples.png"
                      alt="Equipment detail show proof examples"
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Equipment Details: Close-ups of gear, technical setups, installations
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Show Proof Detail Modal */}
      {selectedShowProof && (
        <ShowProofDetail
          showProof={selectedShowProof}
          onEdit={() => handleEdit(selectedShowProof.id)}
          onDelete={() => handleDelete(selectedShowProof.id)}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default ShowProofXP;
