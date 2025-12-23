import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Star, 
  MapPin, 
  BadgeCheck, 
  Shield, 
  Bookmark, 
  MessageCircle, 
  Calendar,
  Award,
  DollarSign,
  Clock,
  Users,
  ArrowLeft
} from 'lucide-react'
import data from '@/sections/technician-discovery/data.json'
import type { Technician } from '@/sections/technician-discovery/types'

export function TechnicianProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    if (id) {
      const foundTechnician = (data.technicians as Technician[]).find(t => t.id === id)
      if (foundTechnician) {
        setTechnician(foundTechnician)
        setIsBookmarked(foundTechnician.isBookmarked)
      }
    }
  }, [id])

  const handleRequestBooking = () => {
    if (technician) {
      navigate(`/bookings?action=create&technician=${technician.id}`)
    }
  }

  const handleSendMessage = () => {
    if (technician) {
      navigate(`/bookings?action=message&technician=${technician.id}`)
    }
  }

  const handleSaveTechnician = () => {
    setIsBookmarked(!isBookmarked)
    // In a real app, this would update the backend
  }

  if (!technician) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Technician not found</h2>
          <p className="text-zinc-400 mb-4">The technician you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/discovery')}
            className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors"
          >
            Back to Discovery
          </button>
        </div>
      </div>
    )
  }

  const tierColors = {
    Beginner: 'text-green-400 bg-green-400/10 border-green-400/20',
    Experienced: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    Advanced: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    Pro: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
  }

  const getAvatarUrl = (id: string): string => {
    const avatars = [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face'
    ]
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return avatars[Math.abs(hash) % avatars.length]
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/discovery')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Discovery
          </button>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative">
                <img
                  src={getAvatarUrl(technician.id)}
                  alt={technician.name}
                  className="w-32 h-32 rounded-xl object-cover"
                />
                <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-full text-xs font-medium border ${tierColors[technician.tier]}`}>
                  {technician.tier}
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="text-2xl font-bold text-white">{technician.name}</h1>
                  <button
                    onClick={handleSaveTechnician}
                    className={`p-2 rounded-lg transition-colors ${
                      isBookmarked
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-800 text-zinc-400 hover:text-amber-400'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-current" />
                    <span className="text-white font-medium">{technician.averageRating}</span>
                    <span className="text-zinc-400">({technician.reviewCount} reviews)</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-zinc-400">
                    <MapPin className="w-4 h-4" />
                    <span>{technician.location.city}, {technician.location.state}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {technician.verificationStatus === 'verified' && (
                    <div className="flex items-center gap-1 text-green-400">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="text-sm">ID Verified</span>
                    </div>
                  )}
                  
                  {technician.insuranceStatus === 'verified' && (
                    <div className="flex items-center gap-1 text-blue-400">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Insured</span>
                    </div>
                  )}
                </div>

                <p className="text-zinc-300 leading-relaxed">{technician.bio}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 lg:w-64">
              <button
                onClick={handleRequestBooking}
                className="w-full px-6 py-3 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors"
              >
                Request Booking
              </button>
              
              <button
                onClick={handleSendMessage}
                className="w-full px-6 py-3 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Skills */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-semibold text-white mb-4">Skills & Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {technician.skills.map((skill, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1 ${
                      skill.verified
                        ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {skill.verified && <BadgeCheck className="w-3 h-3" />}
                    {skill.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-green-400/10 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Completed corporate event in Los Angeles</p>
                    <p className="text-zinc-400 text-xs">2 days ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-blue-400/10 rounded-full flex items-center justify-center">
                    <BadgeCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Skill verification completed: DiGiCo</p>
                    <p className="text-zinc-400 text-xs">1 week ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                  <div className="w-8 h-8 bg-amber-400/10 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm">Received 5-star review from client</p>
                    <p className="text-zinc-400 text-xs">2 weeks ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <DollarSign className="w-4 h-4" />
                    <span>Hourly Rate</span>
                  </div>
                  <span className="text-white font-medium">${technician.hourlyRate}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Award className="w-4 h-4" />
                    <span>XP Points</span>
                  </div>
                  <span className="text-white font-medium">{technician.xp.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Users className="w-4 h-4" />
                    <span>Reviews</span>
                  </div>
                  <span className="text-white font-medium">{technician.reviewCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <MapPin className="w-4 h-4" />
                    <span>Distance</span>
                  </div>
                  <span className="text-white font-medium">{technician.location.distance} mi</span>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Availability</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-zinc-300">Available this week</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-400">Usually responds within 2 hours</span>
                </div>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleRequestBooking}
                  className="w-full px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Request Booking
                </button>
                
                <button
                  onClick={handleSendMessage}
                  className="w-full px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Message
                </button>
                
                <button
                  onClick={() => navigate('/reviews')}
                  className="w-full px-4 py-2 bg-zinc-800 text-white font-medium rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  View Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}