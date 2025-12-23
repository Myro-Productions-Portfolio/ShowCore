import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, 
  Mail, 
  MessageCircle, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  User,
  Camera,
  Calendar,
  CreditCard,
  TrendingUp,
  Plus,
  Receipt,
  Users,
  BarChart3,
  MessageSquare,
  Star,
  Settings,
  Bell,
  Book,
  FileText,
  HelpCircle
} from 'lucide-react'
import helpData from './help-data.json'

// Icon mapping for help topics
const iconMap = {
  User,
  Camera,
  Calendar,
  CreditCard,
  TrendingUp,
  Search,
  Plus,
  Receipt,
  Users,
  BarChart3,
  MessageSquare,
  Star,
  Settings,
  Bell
}

interface HelpPageProps {
  userRole?: 'technician' | 'company'
}

export default function HelpPage({ userRole = 'technician' }: HelpPageProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)

  // Get unique categories from FAQ items
  const categories = useMemo(() => {
    const cats = Array.from(new Set(helpData.faqItems.map(item => item.category)))
    return ['all', ...cats]
  }, [])

  // Filter FAQ items based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = helpData.faqItems

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    return filtered
  }, [searchQuery, selectedCategory])

  // Get help topics based on user role
  const roleBasedTopics = useMemo(() => {
    return [
      ...helpData.helpTopics[userRole],
      ...helpData.helpTopics.common
    ]
  }, [userRole])

  const handleFAQToggle = (faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId)
  }

  const isInternalLink = (href: string) => {
    return href.startsWith('/') && !href.startsWith('/docs/')
  }

  const handleLinkClick = (href: string) => {
    if (isInternalLink(href)) {
      navigate(href)
    } else {
      window.open(href, '_blank')
    }
  }

  const getStatusIcon = () => {
    switch (helpData.platformStatus.status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'outage':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />
    }
  }

  const getStatusColor = () => {
    switch (helpData.platformStatus.status) {
      case 'operational':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'outage':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
          Help Center
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Find answers to common questions, get support, and learn how to make the most of ShowCore
        </p>
      </div>

      {/* Platform Status */}
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold">Platform Status</h3>
            <p className="text-sm">{helpData.platformStatus.message}</p>
            <p className="text-xs opacity-75">
              Last updated: {new Date(helpData.platformStatus.lastUpdated).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Quick Links for {userRole === 'technician' ? 'Technicians' : 'Companies'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roleBasedTopics.map((topic) => {
            const IconComponent = iconMap[topic.icon as keyof typeof iconMap]
            const isInternal = isInternalLink(topic.href)
            
            return (
              <div
                key={topic.id}
                onClick={() => handleLinkClick(topic.href)}
                className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  {IconComponent && (
                    <IconComponent className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5 group-hover:scale-110 transition-transform" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {topic.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {topic.description}
                    </p>
                  </div>
                  {!isInternal && (
                    <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 mt-0.5" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Frequently Asked Questions
        </h2>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
              <p className="text-zinc-600 dark:text-zinc-400">
                No FAQs found matching your search criteria.
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <button
                  onClick={() => handleFAQToggle(faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {faq.question}
                    </h3>
                    <span className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                      {faq.category}
                    </span>
                  </div>
                  <div className={`transform transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-4 pb-4">
                    <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Support Contact */}
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Need More Help?
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email Support */}
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-lg">
            <Mail className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Email Support</h3>
              <a 
                href={`mailto:${helpData.supportContact.email}`}
                className="text-amber-600 dark:text-amber-400 hover:underline"
              >
                {helpData.supportContact.email}
              </a>
            </div>
          </div>

          {/* Live Chat */}
          {helpData.supportContact.chatEnabled && (
            <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-lg">
              <MessageCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Live Chat</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {helpData.supportContact.chatHours}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documentation Links */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Documentation & Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => handleLinkClick('/docs/getting-started')}
            className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors group cursor-pointer"
          >
            <Book className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Getting Started Guide
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Complete guide for new users
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
          </div>

          <div
            onClick={() => handleLinkClick('/docs/api')}
            className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-600 transition-colors group cursor-pointer"
          >
            <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                API Documentation
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Developer resources and API reference
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
          </div>
        </div>
      </div>
    </div>
  )
}