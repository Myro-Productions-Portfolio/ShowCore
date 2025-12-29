import { useState } from 'react';
import type { DisputeCategory } from '../types';
import { AlertCircle, Upload, Send } from 'lucide-react';

interface DisputeFlowProps {
  bookingId?: string;
  onSubmit?: (dispute: {
    bookingId: string;
    category: DisputeCategory;
    description: string;
    evidenceFiles?: File[];
  }) => void;
  onCancel?: () => void;
}

export default function DisputeFlow({ bookingId = '', onSubmit, onCancel }: DisputeFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(bookingId);
  const [category, setCategory] = useState<DisputeCategory>('other');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  const categories: { value: DisputeCategory; label: string }[] = [
    { value: 'inaccurate_venue_information', label: 'Inaccurate Venue Information' },
    { value: 'no_show', label: 'No Show' },
    { value: 'non_payment', label: 'Non-Payment' },
    { value: 'equipment_damage', label: 'Equipment Damage' },
    { value: 'late_arrival', label: 'Late Arrival' },
    { value: 'poor_quality_work', label: 'Poor Quality Work' },
    { value: 'safety_violation', label: 'Safety Violation' },
    { value: 'contract_breach', label: 'Contract Breach' },
    { value: 'other', label: 'Other' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEvidenceFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        bookingId: selectedBooking,
        category,
        description,
        evidenceFiles,
      });
    }
  };

  const canProceedFromStep1 = selectedBooking.trim().length > 0;
  const canProceedFromStep2 = category && description.trim().length >= 50;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step >= s
                    ? 'bg-amber-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                    step > s
                      ? 'bg-amber-500'
                      : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
          <span>Select Booking</span>
          <span>Describe Issue</span>
          <span>Upload Evidence</span>
          <span>Review & Submit</span>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Select Booking
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Which booking is this dispute related to?
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Booking ID
              </label>
              <input
                type="text"
                value={selectedBooking}
                onChange={(e) => setSelectedBooking(e.target.value)}
                placeholder="Enter booking ID (e.g., bkg_123)"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedFromStep1}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Describe the Issue
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Provide details about what went wrong.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Issue Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description (minimum 50 characters)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide a detailed description of the issue..."
                rows={6}
                className="w-full px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {description.length}/50 characters minimum
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedFromStep2}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Upload Evidence
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Upload any supporting documents, photos, or files (optional).
              </p>
            </div>
            <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-zinc-400 dark:text-zinc-500 mx-auto mb-3" />
              <label className="block">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-amber-800 dark:text-amber-100 hover:text-amber-900 dark:hover:text-amber-50 cursor-pointer font-medium">
                  Choose files
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400"> or drag and drop</span>
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                PDF, PNG, JPG, or DOC (max 10MB each)
              </p>
            </div>
            {evidenceFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Selected files ({evidenceFiles.length}):
                </div>
                {evidenceFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm"
                  >
                    <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300">
                      {file.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Review & Submit
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Please review your dispute before submitting.
              </p>
            </div>
            <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Booking ID</div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">{selectedBooking}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Category</div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {categories.find(c => c.value === category)?.label}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Description</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">{description}</div>
              </div>
              {evidenceFiles.length > 0 && (
                <div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Evidence Files</div>
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    {evidenceFiles.length} file(s) attached
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex gap-2 text-xs text-amber-800 dark:text-amber-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Your dispute will initially enter self-resolution, where you'll have a chance to
                  work directly with the other party. If unresolved, you can escalate to mediation
                  or arbitration.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors font-medium"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <Send className="w-4 h-4" />
                Submit Dispute
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
