import type { TrustProfile as TrustProfileType } from '../types';
import { Shield, CheckCircle2, Clock, XCircle, AlertCircle, Upload } from 'lucide-react';

interface TrustProfileProps {
  trustProfile: TrustProfileType;
  isOwnProfile?: boolean;
  onUploadId?: () => void;
  onUploadInsurance?: () => void;
  onUploadCertification?: () => void;
  onInitiateBackgroundCheck?: () => void;
}

export default function TrustProfile({
  trustProfile,
  isOwnProfile = false,
  onUploadId,
  onUploadInsurance,
  onUploadCertification,
  onInitiateBackgroundCheck,
}: TrustProfileProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return 'text-white bg-green-600 dark:bg-green-700';
      case 'pending':
      case 'in_progress':
        return 'text-amber-800 dark:text-amber-100 bg-amber-100 dark:bg-amber-950';
      case 'expired':
      case 'rejected':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950';
      default:
        return 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'pending':
      case 'in_progress':
        return <Clock className="w-5 h-5" />;
      case 'expired':
      case 'rejected':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-amber-800 dark:text-amber-100" />
          <div>
            <div className="text-sm font-medium text-amber-800 dark:text-amber-100">
              Trust Score
            </div>
            <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
              {trustProfile.trustScore}/100
            </div>
          </div>
        </div>
        <div className="mt-4 h-3 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
            style={{ width: `${trustProfile.trustScore}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Verified ID
          </div>
          {isOwnProfile && trustProfile.verifiedId.status === 'not_submitted' && (
            <button
              onClick={onUploadId}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-100 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload ID
            </button>
          )}
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(trustProfile.verifiedId.status)}`}>
          {getStatusIcon(trustProfile.verifiedId.status)}
          <span className="font-medium capitalize">
            {trustProfile.verifiedId.status.replace('_', ' ')}
          </span>
        </div>
        {trustProfile.verifiedId.documentType && (
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Type: {trustProfile.verifiedId.documentType}
          </div>
        )}
        {trustProfile.verifiedId.verifiedAt && (
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Verified: {formatDate(trustProfile.verifiedId.verifiedAt)}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Insurance
          </div>
          {isOwnProfile && trustProfile.insurance.status === 'not_submitted' && (
            <button
              onClick={onUploadInsurance}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-100 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          )}
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(trustProfile.insurance.status)}`}>
          {getStatusIcon(trustProfile.insurance.status)}
          <span className="font-medium capitalize">
            {trustProfile.insurance.status.replace('_', ' ')}
          </span>
        </div>
        {trustProfile.insurance.provider && (
          <div className="mt-3 space-y-1 text-sm">
            <div className="text-zinc-600 dark:text-zinc-400">
              Provider: <span className="text-zinc-900 dark:text-zinc-100">{trustProfile.insurance.provider}</span>
            </div>
            <div className="text-zinc-600 dark:text-zinc-400">
              Coverage: <span className="text-zinc-900 dark:text-zinc-100">
                ${trustProfile.insurance.coverageAmount?.toLocaleString()}
              </span>
            </div>
            {trustProfile.insurance.expiresAt && (
              <div className={`${isExpiringSoon(trustProfile.insurance.expiresAt) ? 'text-amber-800 dark:text-amber-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                Expires: {formatDate(trustProfile.insurance.expiresAt)}
                {isExpiringSoon(trustProfile.insurance.expiresAt) && (
                  <span className="ml-2 text-xs">(Expiring Soon)</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Certifications
          </div>
          {isOwnProfile && (
            <button
              onClick={onUploadCertification}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Add
            </button>
          )}
        </div>
        {trustProfile.certifications.length === 0 ? (
          <div className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
            No certifications added yet
          </div>
        ) : (
          <div className="space-y-3">
            {trustProfile.certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                      {cert.name}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {cert.issuingOrganization}
                    </div>
                    {cert.issuedAt && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                        Issued: {formatDate(cert.issuedAt)}
                        {cert.expiresAt && ` • Expires: ${formatDate(cert.expiresAt)}`}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(cert.status)}`}>
                    {getStatusIcon(cert.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Background Check
        </div>
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex gap-2 text-xs text-blue-700 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>{trustProfile.backgroundCheck.disclaimer}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor(trustProfile.backgroundCheck.status)}`}>
          {getStatusIcon(trustProfile.backgroundCheck.status)}
          <span className="font-medium capitalize">
            {trustProfile.backgroundCheck.status.replace('_', ' ')}
          </span>
        </div>
        {trustProfile.backgroundCheck.provider && (
          <div className="mt-3 space-y-1 text-sm">
            <div className="text-zinc-600 dark:text-zinc-400">
              Provider: <span className="text-zinc-900 dark:text-zinc-100">{trustProfile.backgroundCheck.provider}</span>
            </div>
            {trustProfile.backgroundCheck.completedAt && (
              <div className="text-zinc-600 dark:text-zinc-400">
                Completed: {formatDate(trustProfile.backgroundCheck.completedAt)}
              </div>
            )}
            {trustProfile.backgroundCheck.expiresAt && (
              <div className={`${isExpiringSoon(trustProfile.backgroundCheck.expiresAt) ? 'text-amber-800 dark:text-amber-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                Expires: {formatDate(trustProfile.backgroundCheck.expiresAt)}
              </div>
            )}
          </div>
        )}
        {isOwnProfile && trustProfile.backgroundCheck.status === 'not_submitted' && (
          <button
            onClick={onInitiateBackgroundCheck}
            className="mt-4 w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
          >
            Initiate Background Check
          </button>
        )}
      </div>
    </div>
  );
}
