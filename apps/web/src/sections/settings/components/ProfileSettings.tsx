import { useState, useRef } from 'react'
import type {
  ProfileSettingsProps,
  TechnicianSettingsProfile,
  CompanySettingsProfile,
  TechnicianProfileUpdateData,
  CompanyProfileUpdateData,
} from '../types'

export function ProfileSettings({
  profile,
  onUpdateProfile,
  onUploadPhoto,
  isLoading = false,
  error = null,
}: ProfileSettingsProps) {
  const isTechnician = profile.role === 'technician'
  const techProfile = isTechnician ? (profile as TechnicianSettingsProfile) : null
  const companyProfile = !isTechnician ? (profile as CompanySettingsProfile) : null

  // Form state
  const [formData, setFormData] = useState<TechnicianProfileUpdateData | CompanyProfileUpdateData>(
    isTechnician && techProfile
      ? {
          name: techProfile.name,
          bio: techProfile.bio,
          location: techProfile.location,
          phone: techProfile.phone,
          skills: techProfile.skills,
          hourlyRateRange: techProfile.hourlyRateRange,
          portfolioLinks: techProfile.portfolioLinks,
          timezone: techProfile.timezone,
          profileVisibility: techProfile.profileVisibility,
        }
      : companyProfile
      ? {
          companyName: companyProfile.companyName,
          industry: companyProfile.industry,
          location: companyProfile.location,
          phone: companyProfile.phone,
          website: companyProfile.website,
          hiringNeeds: companyProfile.hiringNeeds,
        }
      : ({} as any)
  )

  const [skillInput, setSkillInput] = useState('')
  const [portfolioInput, setPortfolioInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddSkill = () => {
    if (!isTechnician || !skillInput.trim()) return
    const techData = formData as TechnicianProfileUpdateData
    if (!techData.skills.includes(skillInput.trim())) {
      handleInputChange('skills', [...techData.skills, skillInput.trim()])
    }
    setSkillInput('')
  }

  const handleRemoveSkill = (skill: string) => {
    if (!isTechnician) return
    const techData = formData as TechnicianProfileUpdateData
    handleInputChange(
      'skills',
      techData.skills.filter((s) => s !== skill)
    )
  }

  const handleAddPortfolioLink = () => {
    if (!isTechnician || !portfolioInput.trim()) return
    const techData = formData as TechnicianProfileUpdateData
    if (!techData.portfolioLinks.includes(portfolioInput.trim())) {
      handleInputChange('portfolioLinks', [...techData.portfolioLinks, portfolioInput.trim()])
    }
    setPortfolioInput('')
  }

  const handleRemovePortfolioLink = (link: string) => {
    if (!isTechnician) return
    const techData = formData as TechnicianProfileUpdateData
    handleInputChange(
      'portfolioLinks',
      techData.portfolioLinks.filter((l) => l !== link)
    )
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      await onUploadPhoto(file)
      setSuccessMessage('Photo uploaded successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSuccessMessage(null)

    try {
      await onUpdateProfile(formData)
      setSuccessMessage('Profile updated successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Profile update failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          {isTechnician ? 'Profile Settings' : 'Company Profile'}
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage your {isTechnician ? 'professional' : 'company'} information and public profile.
        </p>
      </div>

      {/* Role badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
        {isTechnician ? (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Technician{techProfile && ` • ${techProfile.tier}`}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Company{companyProfile && ` • ${companyProfile.subscriptionTier} Plan`}</span>
          </>
        )}
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Photo/Logo upload */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            {isTechnician ? 'Profile Photo' : 'Company Logo'}
          </h3>
          <div className="flex items-center gap-6">
            {/* Current photo/logo */}
            <div className="relative">
              {isTechnician && techProfile?.profilePhoto ? (
                <img
                  src={techProfile.profilePhoto}
                  alt={techProfile.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700"
                />
              ) : companyProfile?.companyLogo ? (
                <img
                  src={companyProfile.companyLogo}
                  alt={companyProfile.companyName}
                  className="w-24 h-24 rounded-xl object-cover border-2 border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className={`w-24 h-24 ${isTechnician ? 'rounded-full' : 'rounded-xl'} bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 flex items-center justify-center`}>
                  <svg className="w-12 h-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isTechnician ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    )}
                  </svg>
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload button */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto || isLoading}
                className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingPhoto ? 'Uploading...' : 'Upload new photo'}
              </button>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
        </div>

        {/* Basic information */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
            Basic Information
          </h3>
          <div className="space-y-5">
            {/* Name / Company name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                {isTechnician ? 'Full Name' : 'Company Name'}
              </label>
              <input
                type="text"
                value={isTechnician ? (formData as TechnicianProfileUpdateData).name : (formData as CompanyProfileUpdateData).companyName}
                onChange={(e) => handleInputChange(isTechnician ? 'name' : 'companyName', e.target.value)}
                disabled={isLoading || isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading || isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State"
                disabled={isLoading || isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />
            </div>

            {/* Company-specific: Industry */}
            {!isTechnician && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Industry
                </label>
                <select
                  value={(formData as CompanyProfileUpdateData).industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  disabled={isLoading || isSubmitting}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">Select industry</option>
                  <option value="Live Events & Entertainment">Live Events & Entertainment</option>
                  <option value="Corporate Events">Corporate Events</option>
                  <option value="Theater & Performing Arts">Theater & Performing Arts</option>
                  <option value="Houses of Worship">Houses of Worship</option>
                  <option value="Broadcast & Media">Broadcast & Media</option>
                  <option value="Education">Education</option>
                  <option value="Hospitality & Hotels">Hospitality & Hotels</option>
                  <option value="Sports & Recreation">Sports & Recreation</option>
                </select>
              </div>
            )}

            {/* Company-specific: Website */}
            {!isTechnician && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={(formData as CompanyProfileUpdateData).website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                  disabled={isLoading || isSubmitting}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </div>

        {/* Technician-specific: Professional Details */}
        {isTechnician && (
          <>
            {/* Bio */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
                Professional Bio
              </h3>
              <textarea
                value={(formData as TechnicianProfileUpdateData).bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell clients about your experience, specializations, and what makes you stand out..."
                rows={5}
                disabled={isLoading || isSubmitting}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                required
              />
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                {(formData as TechnicianProfileUpdateData).bio.length} / 500 characters
              </p>
            </div>

            {/* Skills */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Skills</h3>

              {/* Skill input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add a skill (e.g., Audio Engineering)"
                  disabled={isLoading || isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={isLoading || isSubmitting || !skillInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* Skills tags */}
              <div className="flex flex-wrap gap-2">
                {(formData as TechnicianProfileUpdateData).skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      disabled={isLoading || isSubmitting}
                      className="hover:text-amber-900 dark:hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Hourly rate */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
                Hourly Rate Range
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Minimum Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">$</span>
                    <input
                      type="number"
                      value={(formData as TechnicianProfileUpdateData).hourlyRateRange.min}
                      onChange={(e) =>
                        handleInputChange('hourlyRateRange', {
                          ...(formData as TechnicianProfileUpdateData).hourlyRateRange,
                          min: parseInt(e.target.value) || 0,
                        })
                      }
                      min="25"
                      max="500"
                      disabled={isLoading || isSubmitting}
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Maximum Rate
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400">$</span>
                    <input
                      type="number"
                      value={(formData as TechnicianProfileUpdateData).hourlyRateRange.max}
                      onChange={(e) =>
                        handleInputChange('hourlyRateRange', {
                          ...(formData as TechnicianProfileUpdateData).hourlyRateRange,
                          max: parseInt(e.target.value) || 0,
                        })
                      }
                      min="25"
                      max="500"
                      disabled={isLoading || isSubmitting}
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio links */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
                Portfolio Links
              </h3>

              {/* Link input */}
              <div className="flex gap-2 mb-4">
                <input
                  type="url"
                  value={portfolioInput}
                  onChange={(e) => setPortfolioInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPortfolioLink())}
                  placeholder="https://yourportfolio.com"
                  disabled={isLoading || isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={handleAddPortfolioLink}
                  disabled={isLoading || isSubmitting || !portfolioInput.trim()}
                  className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* Portfolio links list */}
              <div className="space-y-2">
                {(formData as TechnicianProfileUpdateData).portfolioLinks.map((link) => (
                  <div
                    key={link}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  >
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 truncate"
                    >
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioLink(link)}
                      disabled={isLoading || isSubmitting}
                      className="ml-3 p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Timezone & Visibility */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
                Preferences
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={(formData as TechnicianProfileUpdateData).timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    disabled={isLoading || isSubmitting}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Phoenix">Arizona Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/Anchorage">Alaska Time</option>
                    <option value="Pacific/Honolulu">Hawaii Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={(formData as TechnicianProfileUpdateData).profileVisibility}
                    onChange={(e) => handleInputChange('profileVisibility', e.target.value as 'public' | 'private')}
                    disabled={isLoading || isSubmitting}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="public">Public - Searchable by companies</option>
                    <option value="private">Private - Only accessible via bookings</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Company-specific: Hiring Needs */}
        {!isTechnician && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">
              Hiring Needs
            </h3>
            <textarea
              value={(formData as CompanyProfileUpdateData).hiringNeeds}
              onChange={(e) => handleInputChange('hiringNeeds', e.target.value)}
              placeholder="Describe your typical technician requirements, skills needed, event types, etc..."
              rows={5}
              disabled={isLoading || isSubmitting}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              required
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            disabled={isLoading || isSubmitting}
            className="px-6 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
