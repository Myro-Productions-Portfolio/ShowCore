import React, { useState, useRef, useEffect } from 'react';
import type { ShowProofUploadProps, EventType, ComplexityLevel, PrivacyLevel } from '../types';

const UploadForm: React.FC<ShowProofUploadProps> = ({
  onUpload,
  onCancel,
  isUploading,
  editingShowProof,
  onCancelEdit
}) => {
  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    eventType: 'concert' as EventType,
    eventDate: '',
    role: '',
    description: '',
    complexity: 'standard' as ComplexityLevel,
    privacy: 'public' as PrivacyLevel,
  });

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingShowProof) {
      setFormData({
        title: editingShowProof.title,
        venue: editingShowProof.venue,
        eventType: editingShowProof.eventType,
        eventDate: editingShowProof.eventDate,
        role: editingShowProof.role,
        description: editingShowProof.description,
        complexity: editingShowProof.complexity,
        privacy: editingShowProof.privacy,
      });
      setExistingMediaUrls(editingShowProof.mediaUrls);
      setMediaFiles([]);
      setPreviewUrls([]);
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        venue: '',
        eventType: 'concert',
        eventDate: '',
        role: '',
        description: '',
        complexity: 'standard',
        privacy: 'public',
      });
      setExistingMediaUrls([]);
      setMediaFiles([]);
      setPreviewUrls([]);
    }
  }, [editingShowProof]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setMediaFiles((prev) => [...prev, ...newFiles]);
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index: number) => {
    setExistingMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpload({ ...formData, mediaFiles });
  };

  const isFormValid = formData.title && formData.venue && formData.eventDate && formData.role && (mediaFiles.length > 0 || existingMediaUrls.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Photos & Videos *
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${
            isDragging
              ? 'border-amber-500 bg-amber-500/5 dark:bg-amber-500/10'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-amber-500/50 dark:hover:border-amber-500/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-600 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              PNG, JPG, MP4 up to 50MB each
            </p>
          </div>
        </div>

        {/* Existing Media Previews (when editing) */}
        {existingMediaUrls.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Current Media</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {existingMediaUrls.map((url, index) => (
                <div key={`existing-${index}`} className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden group">
                  <img src={url} alt={`Existing ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExistingMedia(index);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New File Previews */}
        {previewUrls.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {editingShowProof ? 'New Media to Add' : 'Preview'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {previewUrls.map((url, index) => (
                <div key={`new-${index}`} className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden group">
                  <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Show Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="e.g., Glastonbury Festival 2024 - Main Stage Audio"
          className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          required
        />
      </div>

      {/* Venue & Event Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="venue" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Venue *
          </label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            placeholder="e.g., Royal Albert Hall"
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="eventType" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Event Type *
          </label>
          <select
            id="eventType"
            name="eventType"
            value={formData.eventType}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          >
            <option value="concert">Concert</option>
            <option value="festival">Festival</option>
            <option value="corporate">Corporate</option>
            <option value="theater">Theater</option>
            <option value="wedding">Wedding</option>
            <option value="conference">Conference</option>
          </select>
        </div>
      </div>

      {/* Event Date & Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="eventDate" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Event Date *
          </label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleInputChange}
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Your Role *
          </label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            placeholder="e.g., FOH Audio Engineer"
            className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          placeholder="Describe your work, equipment used, challenges overcome, etc."
          className="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Complexity & Privacy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Complexity Level
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-amber-500 dark:hover:border-amber-500 transition-colors">
              <input
                type="radio"
                name="complexity"
                value="standard"
                checked={formData.complexity === 'standard'}
                onChange={handleInputChange}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Standard</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Base XP (75)</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-amber-500 dark:hover:border-amber-500 transition-colors">
              <input
                type="radio"
                name="complexity"
                value="complex"
                checked={formData.complexity === 'complex'}
                onChange={handleInputChange}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  Complex
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 text-amber-800 dark:text-amber-100 text-xs rounded">
                    +50 XP
                  </span>
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Large scale or high-complexity production</div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            Privacy Setting
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-amber-500 dark:hover:border-amber-500 transition-colors">
              <input
                type="radio"
                name="privacy"
                value="public"
                checked={formData.privacy === 'public'}
                onChange={handleInputChange}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Public</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Visible to everyone</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-amber-500 dark:hover:border-amber-500 transition-colors">
              <input
                type="radio"
                name="privacy"
                value="clients_only"
                checked={formData.privacy === 'clients_only'}
                onChange={handleInputChange}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Clients Only</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Only verified clients</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-amber-500 dark:hover:border-amber-500 transition-colors">
              <input
                type="radio"
                name="privacy"
                value="private"
                checked={formData.privacy === 'private'}
                onChange={handleInputChange}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Private</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">Only you</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="submit"
          disabled={!isFormValid || isUploading}
          className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {editingShowProof ? 'Updating...' : 'Uploading...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editingShowProof ? "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"} />
              </svg>
              {editingShowProof ? 'Update Show Proof' : 'Upload Show Proof'}
            </>
          )}
        </button>
        {editingShowProof && onCancelEdit ? (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isUploading}
            className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg transition-colors"
          >
            Cancel Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            disabled={isUploading}
            className="px-6 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-700 dark:text-zinc-300 font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default UploadForm;
