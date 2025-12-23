import { useState } from 'react'
import type {
  ProfileCompletionProps,
} from '../types'

export function ProfileCompletion({
  role,
  onCompleteProfile,
  onLogout,
  isLoading = false,
  error = null,
}: ProfileCompletionProps) {
  // Technician form state
  const [techName, setTechName] = useState('')
  const [techSkills, setTechSkills] = useState<string[]>([])
  const [techSkillInput, setTechSkillInput] = useState('')
  const [techLocation, setTechLocation] = useState('')
  const [techMinRate, setTechMinRate] = useState(50)
  const [techMaxRate, setTechMaxRate] = useState(150)
  const [techBio, setTechBio] = useState('')
  const [techProfilePhoto, setTechProfilePhoto] = useState('')
  const [techPortfolioLinks, setTechPortfolioLinks] = useState<string[]>([''])

  // Company form state
  const [companyName, setCompanyName] = useState('')
  const [companyIndustry, setCompanyIndustry] = useState('')
  const [companyLocation, setCompanyLocation] = useState('')
  const [companyHiringNeeds, setCompanyHiringNeeds] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyWebsite, setCompanyWebsite] = useState('')

  // UI state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = role === 'technician' ? 3 : 2

  const handleAddSkill = () => {
    if (techSkillInput.trim() && !techSkills.includes(techSkillInput.trim())) {
      setTechSkills([...techSkills, techSkillInput.trim()])
      setTechSkillInput('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setTechSkills(techSkills.filter(skill => skill !== skillToRemove))
  }

  const handleAddPortfolioLink = () => {
    setTechPortfolioLinks([...techPortfolioLinks, ''])
  }

  const handleRemovePortfolioLink = (index: number) => {
    setTechPortfolioLinks(techPortfolioLinks.filter((_, i) => i !== index))
  }

  const handlePortfolioLinkChange = (index: number, value: string) => {
    const updated = [...techPortfolioLinks]
    updated[index] = value
    setTechPortfolioLinks(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (role === 'technician') {
      const data = {
        name: techName,
        skills: techSkills,
        location: techLocation,
        hourlyRateRange: {
          min: techMinRate,
          max: techMaxRate,
        },
        bio: techBio,
        profilePhoto: techProfilePhoto || undefined,
        portfolioLinks: techPortfolioLinks.filter(link => link.trim() !== '').length > 0
          ? techPortfolioLinks.filter(link => link.trim() !== '')
          : undefined,
      }
      await onCompleteProfile(data)
    } else {
      const data = {
        companyName,
        industry: companyIndustry,
        location: companyLocation,
        typicalHiringNeeds: companyHiringNeeds,
        companyLogo: companyLogo || undefined,
        website: companyWebsite || undefined,
      }
      await onCompleteProfile(data)
    }
  }

  const canProceedToNextStep = () => {
    if (role === 'technician') {
      if (currentStep === 1) return techName.trim() !== '' && techLocation.trim() !== ''
      if (currentStep === 2) return techSkills.length > 0 && techMinRate < techMaxRate
      return techBio.trim() !== ''
    } else {
      if (currentStep === 1) return companyName.trim() !== '' && companyIndustry.trim() !== ''
      return companyLocation.trim() !== '' && companyHiringNeeds.trim() !== ''
    }
  }

  const industries = [
    'Live Events & Entertainment',
    'Corporate Events',
    'Theater & Performing Arts',
    'Houses of Worship',
    'Education',
    'Broadcast & Media',
    'Sports & Recreation',
    'Hospitality',
    'Other',
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Atmospheric visual */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-950 overflow-hidden">
        {/* Hero image background */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/hero/auth-hero.png)' }}
        />

        {/* Gradient mesh overlay */}
        <div
          className="absolute inset-0 opacity-40 mix-blend-overlay"
          style={{ backgroundImage: 'url(/images/patterns/gradient-mesh-dark.png)' }}
        />

        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/70 via-zinc-950/50 to-zinc-950/70" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23.693L4.2 15.3m15.6 0-.3 1.79a2.25 2.25 0 0 1-1.406 1.704l-1.878.626a9.02 9.02 0 0 1-5.732 0l-1.878-.626a2.25 2.25 0 0 1-1.406-1.704l-.3-1.79" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">ShowCore</span>
          </div>

          {/* Tagline */}
          <div className="max-w-md">
            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              {role === 'technician' ? (
                <>
                  Build your
                  <span className="block text-amber-400">professional profile.</span>
                </>
              ) : (
                <>
                  Tell us about
                  <span className="block text-amber-400">your company.</span>
                </>
              )}
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {role === 'technician'
                ? 'Help clients find you by showcasing your skills, experience, and availability.'
                : 'Help technicians understand your needs and build lasting partnerships.'}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-500 uppercase tracking-wider">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full flex-1 transition-all ${
                    index + 1 <= currentStep
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                      : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Profile completion form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white dark:bg-zinc-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23.693L4.2 15.3m15.6 0-.3 1.79a2.25 2.25 0 0 1-1.406 1.704l-1.878.626a9.02 9.02 0 0 1-5.732 0l-1.878-.626a2.25 2.25 0 0 1-1.406-1.704l-.3-1.79" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">ShowCore</span>
          </div>

          {/* Mobile progress */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Step {currentStep} of {totalSteps}
              </div>
            </div>
            <div className="flex gap-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full flex-1 transition-all ${
                    index + 1 <= currentStep
                      ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                      : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              Complete your profile
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400">
              {role === 'technician'
                ? 'Share your expertise and experience'
                : 'Help us understand your hiring needs'}
            </p>
          </div>

          {/* Logout link */}
          <div className="mb-6">
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Sign out
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error.message}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Technician Form */}
            {role === 'technician' && (
              <>
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Full Name <span className="text-amber-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={techName}
                        onChange={(e) => setTechName(e.target.value)}
                        placeholder="e.g., Sarah Chen"
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Location <span className="text-amber-500">*</span>
                      </label>
                      <input
                        id="location"
                        type="text"
                        value={techLocation}
                        onChange={(e) => setTechLocation(e.target.value)}
                        placeholder="e.g., Los Angeles, CA"
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label htmlFor="profilePhoto" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Profile Photo URL <span className="text-zinc-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        id="profilePhoto"
                        type="url"
                        value={techProfilePhoto}
                        onChange={(e) => setTechProfilePhoto(e.target.value)}
                        placeholder="https://..."
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Skills & Rates */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="skills" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Skills & Specializations <span className="text-amber-500">*</span>
                      </label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            id="skills"
                            type="text"
                            value={techSkillInput}
                            onChange={(e) => setTechSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddSkill()
                              }
                            }}
                            placeholder="e.g., Audio Engineering, Live Sound, etc."
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <button
                            type="button"
                            onClick={handleAddSkill}
                            disabled={isLoading || !techSkillInput.trim()}
                            className="px-5 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
                          </button>
                        </div>
                        {techSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {techSkills.map((skill, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm"
                              >
                                <span>{skill}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="hover:text-amber-900 dark:hover:text-amber-100"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                        Hourly Rate Range <span className="text-amber-500">*</span>
                      </label>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <label htmlFor="minRate" className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                              Minimum (${techMinRate}/hr)
                            </label>
                            <input
                              id="minRate"
                              type="range"
                              min="25"
                              max="300"
                              step="5"
                              value={techMinRate}
                              onChange={(e) => setTechMinRate(Number(e.target.value))}
                              disabled={isLoading}
                              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor="maxRate" className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                              Maximum (${techMaxRate}/hr)
                            </label>
                            <input
                              id="maxRate"
                              type="range"
                              min="25"
                              max="300"
                              step="5"
                              value={techMaxRate}
                              onChange={(e) => setTechMaxRate(Number(e.target.value))}
                              disabled={isLoading}
                              className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-sm text-amber-700 dark:text-amber-300 text-center font-medium">
                            ${techMinRate} - ${techMaxRate} per hour
                          </p>
                        </div>
                        {techMinRate >= techMaxRate && (
                          <p className="text-sm text-red-500">Maximum rate must be greater than minimum rate</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Bio & Portfolio */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Professional Bio <span className="text-amber-500">*</span>
                      </label>
                      <textarea
                        id="bio"
                        value={techBio}
                        onChange={(e) => setTechBio(e.target.value)}
                        placeholder="Tell clients about your experience, specializations, and what makes you unique..."
                        required
                        disabled={isLoading}
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        {techBio.length} characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Portfolio Links <span className="text-zinc-400 text-xs">(Optional)</span>
                      </label>
                      <div className="space-y-2">
                        {techPortfolioLinks.map((link, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="url"
                              value={link}
                              onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                              placeholder="https://..."
                              disabled={isLoading}
                              className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            {techPortfolioLinks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePortfolioLink(index)}
                                disabled={isLoading}
                                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-all"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        {techPortfolioLinks.length < 5 && (
                          <button
                            type="button"
                            onClick={handleAddPortfolioLink}
                            disabled={isLoading}
                            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add another link
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Company Form */}
            {role === 'company' && (
              <>
                {/* Step 1: Company Info */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Company Name <span className="text-amber-500">*</span>
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g., SoundStage Venues"
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label htmlFor="industry" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Industry <span className="text-amber-500">*</span>
                      </label>
                      <select
                        id="industry"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Select an industry...</option>
                        {industries.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="companyLogo" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Company Logo URL <span className="text-zinc-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        id="companyLogo"
                        type="url"
                        value={companyLogo}
                        onChange={(e) => setCompanyLogo(e.target.value)}
                        placeholder="https://..."
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Website <span className="text-zinc-400 text-xs">(Optional)</span>
                      </label>
                      <input
                        id="website"
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://..."
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Location & Hiring Needs */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="companyLocation" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Location <span className="text-amber-500">*</span>
                      </label>
                      <input
                        id="companyLocation"
                        type="text"
                        value={companyLocation}
                        onChange={(e) => setCompanyLocation(e.target.value)}
                        placeholder="e.g., New York, NY"
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label htmlFor="hiringNeeds" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Typical Hiring Needs <span className="text-amber-500">*</span>
                      </label>
                      <textarea
                        id="hiringNeeds"
                        value={companyHiringNeeds}
                        onChange={(e) => setCompanyHiringNeeds(e.target.value)}
                        placeholder="Describe the types of technicians you typically need, frequency of hiring, and any specific requirements..."
                        required
                        disabled={isLoading}
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                      />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        {companyHiringNeeds.length} characters
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={isLoading}
                  className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={isLoading || !canProceedToNextStep()}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !canProceedToNextStep()}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Completing profile...</span>
                    </>
                  ) : (
                    <span>Complete Profile</span>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
