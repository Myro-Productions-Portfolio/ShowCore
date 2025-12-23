import type { SuggestedAction, QuickAction } from '../../../../shell/components/AIAssistant'

export interface AIResponse {
  message: string
  suggestedActions: SuggestedAction[]
  quickReplies: string[]
}

export interface AIContextualData {
  dashboard: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  discovery: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  bookings: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  'show-proof': {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  reviews: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  analytics: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  settings: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  help: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
  fallback: {
    responses: AIResponse[]
    quickActions: QuickAction[]
  }
}

// Contextual AI responses and actions for different pages
const contextualData: AIContextualData = {
  dashboard: {
    responses: [
      {
        message: "Welcome to your ShowCore dashboard! I can help you get started with onboarding tasks, understand your stats, or navigate to different sections of the platform.",
        suggestedActions: [
          {
            id: 'complete-profile',
            label: 'Complete Your Profile',
            type: 'navigate',
            url: '/settings',
            description: 'Set up your profile information'
          },
          {
            id: 'find-technicians',
            label: 'Find Technicians',
            type: 'navigate',
            url: '/discovery',
            description: 'Browse available technicians'
          }
        ],
        quickReplies: ['How do I get started?', 'What should I do first?', 'Show me my progress']
      },
      {
        message: "Your dashboard shows your onboarding progress, recent activity, and key stats. Complete the highlighted tasks to unlock more features and improve your profile visibility.",
        suggestedActions: [
          {
            id: 'verify-id',
            label: 'Verify Your Identity',
            type: 'navigate',
            url: '/settings?section=security',
            description: 'Complete identity verification'
          },
          {
            id: 'add-payment',
            label: 'Add Payment Method',
            type: 'navigate',
            url: '/settings?section=payment',
            description: 'Set up your payment information'
          }
        ],
        quickReplies: ['What are these tasks?', 'Why do I need to verify?', 'How do payments work?']
      }
    ],
    quickActions: [
      {
        id: 'getting-started',
        label: 'Getting Started',
        icon: 'play',
        prompt: 'How do I get started on ShowCore?',
        category: 'onboarding'
      },
      {
        id: 'complete-profile',
        label: 'Complete Profile',
        icon: 'user',
        prompt: 'Help me complete my profile',
        category: 'tasks'
      },
      {
        id: 'dashboard-help',
        label: 'Dashboard Help',
        icon: 'help',
        prompt: 'What does my dashboard show?',
        category: 'help'
      },
      {
        id: 'next-steps',
        label: 'What\'s Next?',
        icon: 'arrow-right',
        prompt: 'What should I do next?',
        category: 'onboarding'
      }
    ]
  },
  discovery: {
    responses: [
      {
        message: "I can help you find the perfect technicians for your project! Use the filters to narrow down by skills, location, availability, and ratings. You can view profiles and request bookings directly from here.",
        suggestedActions: [
          {
            id: 'filter-help',
            label: 'How to Use Filters',
            type: 'modal',
            description: 'Learn about search filters'
          },
          {
            id: 'booking-process',
            label: 'Booking Process',
            type: 'navigate',
            url: '/help',
            description: 'Learn how bookings work'
          }
        ],
        quickReplies: ['How do I find technicians?', 'What do the ratings mean?', 'How do I book someone?']
      },
      {
        message: "Looking at technician profiles? Check their tier level, show proof, reviews, and availability. Higher tier technicians have more experience and verified skills.",
        suggestedActions: [
          {
            id: 'create-booking',
            label: 'Create a Booking',
            type: 'navigate',
            url: '/bookings?action=create',
            description: 'Start a new booking request'
          },
          {
            id: 'save-technician',
            label: 'Save for Later',
            type: 'inline',
            description: 'Save technician to your favorites'
          }
        ],
        quickReplies: ['What are tiers?', 'How do I save technicians?', 'What\'s show proof?']
      }
    ],
    quickActions: [
      {
        id: 'find-technicians',
        label: 'Find Technicians',
        icon: 'search',
        prompt: 'How do I find the right technicians?',
        category: 'help'
      },
      {
        id: 'booking-help',
        label: 'Booking Help',
        icon: 'calendar',
        prompt: 'How does the booking process work?',
        category: 'help'
      },
      {
        id: 'filter-tips',
        label: 'Filter Tips',
        icon: 'filter',
        prompt: 'How do I use the search filters?',
        category: 'help'
      },
      {
        id: 'tier-system',
        label: 'Tier System',
        icon: 'star',
        prompt: 'What do the tier levels mean?',
        category: 'help'
      }
    ]
  },
  bookings: {
    responses: [
      {
        message: "Your bookings hub! Here you can manage all your booking requests, track their status, communicate with technicians, and handle payments. I can help you understand the booking process or troubleshoot any issues.",
        suggestedActions: [
          {
            id: 'create-booking',
            label: 'Create New Booking',
            type: 'navigate',
            url: '/bookings?action=create',
            description: 'Start a new booking request'
          },
          {
            id: 'booking-status',
            label: 'Booking Status Guide',
            type: 'modal',
            description: 'Understand booking statuses'
          }
        ],
        quickReplies: ['How do I create a booking?', 'What do the statuses mean?', 'How do I message technicians?']
      },
      {
        message: "Having trouble with a booking? I can help you understand the different statuses, guide you through communication, or help resolve any disputes that might arise.",
        suggestedActions: [
          {
            id: 'dispute-help',
            label: 'Dispute Resolution',
            type: 'navigate',
            url: '/help',
            description: 'Learn about dispute process'
          },
          {
            id: 'payment-help',
            label: 'Payment Issues',
            type: 'navigate',
            url: '/settings?section=payment',
            description: 'Check payment settings'
          }
        ],
        quickReplies: ['I have a dispute', 'Payment not working', 'Technician not responding']
      }
    ],
    quickActions: [
      {
        id: 'create-booking',
        label: 'Create Booking',
        icon: 'plus',
        prompt: 'How do I create a new booking?',
        category: 'tasks'
      },
      {
        id: 'booking-status',
        label: 'Booking Status',
        icon: 'clock',
        prompt: 'What do the booking statuses mean?',
        category: 'help'
      },
      {
        id: 'messaging-help',
        label: 'Messaging',
        icon: 'message-circle',
        prompt: 'How do I message technicians?',
        category: 'help'
      },
      {
        id: 'payment-help',
        label: 'Payment Help',
        icon: 'credit-card',
        prompt: 'Help with payments',
        category: 'help'
      }
    ]
  },
  'show-proof': {
    responses: [
      {
        message: "Show Proof is how technicians demonstrate their skills and build their reputation. You can upload photos, videos, and documents from your events to earn XP and advance your tier level.",
        suggestedActions: [
          {
            id: 'upload-proof',
            label: 'Upload Show Proof',
            type: 'modal',
            description: 'Add new show proof'
          },
          {
            id: 'xp-system',
            label: 'Learn About XP',
            type: 'navigate',
            url: '/help',
            description: 'Understand the XP system'
          }
        ],
        quickReplies: ['How do I upload proof?', 'What earns XP?', 'How do tiers work?']
      },
      {
        message: "Quality show proof helps you stand out to potential clients. Include clear photos, detailed descriptions, and relevant event information. Higher quality submissions earn more XP!",
        suggestedActions: [
          {
            id: 'proof-guidelines',
            label: 'Proof Guidelines',
            type: 'modal',
            description: 'Best practices for show proof'
          },
          {
            id: 'tier-benefits',
            label: 'Tier Benefits',
            type: 'navigate',
            url: '/help',
            description: 'See what each tier unlocks'
          }
        ],
        quickReplies: ['What makes good proof?', 'How much XP do I need?', 'Can I edit my proof?']
      }
    ],
    quickActions: [
      {
        id: 'upload-proof',
        label: 'Upload Proof',
        icon: 'upload',
        prompt: 'How do I upload show proof?',
        category: 'tasks'
      },
      {
        id: 'xp-help',
        label: 'XP System',
        icon: 'zap',
        prompt: 'How does the XP system work?',
        category: 'help'
      },
      {
        id: 'tier-help',
        label: 'Tier System',
        icon: 'star',
        prompt: 'What are the different tiers?',
        category: 'help'
      },
      {
        id: 'proof-tips',
        label: 'Proof Tips',
        icon: 'camera',
        prompt: 'Tips for better show proof',
        category: 'help'
      }
    ]
  },
  reviews: {
    responses: [
      {
        message: "The review system helps build trust in our community. You can leave reviews after completed bookings, respond to reviews you receive, and report any inappropriate content.",
        suggestedActions: [
          {
            id: 'leave-review',
            label: 'Leave a Review',
            type: 'navigate',
            url: '/bookings',
            description: 'Review a completed booking'
          },
          {
            id: 'review-guidelines',
            label: 'Review Guidelines',
            type: 'modal',
            description: 'Learn about fair reviews'
          }
        ],
        quickReplies: ['How do I leave a review?', 'Can I respond to reviews?', 'How do I report a review?']
      },
      {
        message: "Reviews should be honest, constructive, and professional. Focus on the work quality, communication, and professionalism. Both technicians and companies can leave reviews for each other.",
        suggestedActions: [
          {
            id: 'dispute-review',
            label: 'Dispute a Review',
            type: 'navigate',
            url: '/help',
            description: 'Learn about review disputes'
          },
          {
            id: 'improve-rating',
            label: 'Improve Your Rating',
            type: 'modal',
            description: 'Tips for better reviews'
          }
        ],
        quickReplies: ['How do I dispute a review?', 'Why is my rating low?', 'Can reviews be removed?']
      }
    ],
    quickActions: [
      {
        id: 'leave-review',
        label: 'Leave Review',
        icon: 'star',
        prompt: 'How do I leave a review?',
        category: 'tasks'
      },
      {
        id: 'review-guidelines',
        label: 'Review Rules',
        icon: 'shield',
        prompt: 'What are the review guidelines?',
        category: 'help'
      },
      {
        id: 'dispute-help',
        label: 'Dispute Review',
        icon: 'flag',
        prompt: 'How do I dispute a review?',
        category: 'help'
      },
      {
        id: 'rating-help',
        label: 'Rating Help',
        icon: 'trending-up',
        prompt: 'How can I improve my rating?',
        category: 'help'
      }
    ]
  },
  analytics: {
    responses: [
      {
        message: "Your analytics dashboard shows key metrics about your ShowCore activity. Track your earnings, booking trends, performance metrics, and market insights to grow your business.",
        suggestedActions: [
          {
            id: 'export-data',
            label: 'Export Data',
            type: 'modal',
            description: 'Download your analytics data'
          },
          {
            id: 'market-insights',
            label: 'Market Insights',
            type: 'modal',
            description: 'Understand market trends'
          }
        ],
        quickReplies: ['What do these metrics mean?', 'How do I export data?', 'What are market rates?']
      },
      {
        message: "Use the date range picker to view different time periods, and switch between chart types to visualize your data differently. The market analytics help you price competitively.",
        suggestedActions: [
          {
            id: 'pricing-guide',
            label: 'Pricing Guide',
            type: 'navigate',
            url: '/help',
            description: 'Learn about competitive pricing'
          },
          {
            id: 'performance-tips',
            label: 'Performance Tips',
            type: 'modal',
            description: 'Improve your metrics'
          }
        ],
        quickReplies: ['How should I price my services?', 'Why are my bookings low?', 'What affects my ranking?']
      }
    ],
    quickActions: [
      {
        id: 'metrics-help',
        label: 'Metrics Help',
        icon: 'bar-chart',
        prompt: 'What do these metrics mean?',
        category: 'help'
      },
      {
        id: 'pricing-help',
        label: 'Pricing Guide',
        icon: 'dollar-sign',
        prompt: 'How should I price my services?',
        category: 'help'
      },
      {
        id: 'export-data',
        label: 'Export Data',
        icon: 'download',
        prompt: 'How do I export my data?',
        category: 'tasks'
      },
      {
        id: 'market-trends',
        label: 'Market Trends',
        icon: 'trending-up',
        prompt: 'Show me market trends',
        category: 'help'
      }
    ]
  },
  settings: {
    responses: [
      {
        message: "Your settings hub! Here you can manage your profile, account security, payment methods, notifications, and privacy preferences. I can guide you through any configuration changes.",
        suggestedActions: [
          {
            id: 'complete-profile',
            label: 'Complete Profile',
            type: 'inline',
            description: 'Fill out missing profile information'
          },
          {
            id: 'security-setup',
            label: 'Security Setup',
            type: 'navigate',
            url: '/settings?section=security',
            description: 'Set up two-factor authentication'
          }
        ],
        quickReplies: ['How do I change my password?', 'How do I add a payment method?', 'How do I verify my identity?']
      },
      {
        message: "Keep your account secure with strong passwords, two-factor authentication, and identity verification. Complete profile information helps you get more bookings!",
        suggestedActions: [
          {
            id: 'payment-setup',
            label: 'Payment Setup',
            type: 'navigate',
            url: '/settings?section=payment',
            description: 'Add payment methods'
          },
          {
            id: 'notification-prefs',
            label: 'Notifications',
            type: 'navigate',
            url: '/settings?section=notifications',
            description: 'Manage notification preferences'
          }
        ],
        quickReplies: ['How do I get paid?', 'Too many notifications', 'Privacy settings']
      }
    ],
    quickActions: [
      {
        id: 'profile-help',
        label: 'Profile Help',
        icon: 'user',
        prompt: 'Help me complete my profile',
        category: 'tasks'
      },
      {
        id: 'security-help',
        label: 'Security Help',
        icon: 'shield',
        prompt: 'How do I secure my account?',
        category: 'help'
      },
      {
        id: 'payment-help',
        label: 'Payment Help',
        icon: 'credit-card',
        prompt: 'How do I set up payments?',
        category: 'tasks'
      },
      {
        id: 'notification-help',
        label: 'Notifications',
        icon: 'bell',
        prompt: 'Manage my notifications',
        category: 'tasks'
      }
    ]
  },
  help: {
    responses: [
      {
        message: "Welcome to the ShowCore help center! I can answer questions about any feature, guide you through processes, or help you find the information you need. What would you like to know?",
        suggestedActions: [
          {
            id: 'getting-started',
            label: 'Getting Started Guide',
            type: 'navigate',
            url: '/help?section=getting-started',
            description: 'New user guide'
          },
          {
            id: 'contact-support',
            label: 'Contact Support',
            type: 'external',
            url: 'mailto:support@showcore.com',
            description: 'Get human help'
          }
        ],
        quickReplies: ['How do I get started?', 'I need human help', 'Common questions']
      },
      {
        message: "Can't find what you're looking for? Try searching the help articles, or contact our support team directly. I'm also here to answer any questions about ShowCore features!",
        suggestedActions: [
          {
            id: 'search-help',
            label: 'Search Help Articles',
            type: 'inline',
            description: 'Find specific help topics'
          },
          {
            id: 'feature-tour',
            label: 'Feature Tour',
            type: 'modal',
            description: 'Overview of all features'
          }
        ],
        quickReplies: ['Show me around', 'I have a specific question', 'Report a bug']
      }
    ],
    quickActions: [
      {
        id: 'getting-started',
        label: 'Getting Started',
        icon: 'play',
        prompt: 'I\'m new to ShowCore, help me get started',
        category: 'onboarding'
      },
      {
        id: 'feature-tour',
        label: 'Feature Tour',
        icon: 'map',
        prompt: 'Show me around the platform',
        category: 'help'
      },
      {
        id: 'contact-support',
        label: 'Contact Support',
        icon: 'mail',
        prompt: 'I need to contact human support',
        category: 'help'
      },
      {
        id: 'common-questions',
        label: 'FAQ',
        icon: 'help-circle',
        prompt: 'Show me common questions',
        category: 'help'
      }
    ]
  },
  fallback: {
    responses: [
      {
        message: "I'm here to help you with ShowCore! I can assist with navigation, explain features, help with onboarding tasks, or answer questions about bookings, reviews, and more.",
        suggestedActions: [
          {
            id: 'dashboard',
            label: 'Go to Dashboard',
            type: 'navigate',
            url: '/',
            description: 'View your main dashboard'
          },
          {
            id: 'help-center',
            label: 'Help Center',
            type: 'navigate',
            url: '/help',
            description: 'Browse help articles'
          }
        ],
        quickReplies: ['What can you help with?', 'Show me around', 'I have a question']
      },
      {
        message: "I can help you with any aspect of ShowCore - from getting started to managing bookings, understanding the XP system, or troubleshooting issues. What would you like to know?",
        suggestedActions: [
          {
            id: 'getting-started',
            label: 'Getting Started',
            type: 'navigate',
            url: '/',
            description: 'New user onboarding'
          },
          {
            id: 'find-technicians',
            label: 'Find Technicians',
            type: 'navigate',
            url: '/discovery',
            description: 'Browse available technicians'
          }
        ],
        quickReplies: ['How do I get started?', 'Find technicians', 'Manage bookings']
      }
    ],
    quickActions: [
      {
        id: 'help-overview',
        label: 'What can you do?',
        icon: 'help-circle',
        prompt: 'What can you help me with?',
        category: 'help'
      },
      {
        id: 'navigation-help',
        label: 'Show me around',
        icon: 'map',
        prompt: 'Help me navigate ShowCore',
        category: 'navigation'
      },
      {
        id: 'getting-started',
        label: 'Getting Started',
        icon: 'play',
        prompt: 'I\'m new here, help me get started',
        category: 'onboarding'
      },
      {
        id: 'common-tasks',
        label: 'Common Tasks',
        icon: 'list',
        prompt: 'What are the most common tasks?',
        category: 'help'
      }
    ]
  }
}

/**
 * Get contextual AI response based on user message, current page, and user role
 */
export function getAIResponse(
  message: string, 
  currentPage: string, 
  userRole: 'technician' | 'company'
): AIResponse {
  // Normalize the current page to match our context keys
  const normalizedPage = currentPage.replace('/', '') || 'dashboard'
  const pageKey = normalizedPage as keyof AIContextualData
  
  // Get page-specific context or fallback to general responses
  const pageContext = contextualData[pageKey] || contextualData.fallback
  
  // Simple keyword matching to select appropriate response
  const lowerMessage = message.toLowerCase()
  
  // Look for specific keywords to provide targeted responses
  if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('new')) {
    return pageContext.responses[0] || contextualData.fallback.responses[0]
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
    return pageContext.responses[1] || pageContext.responses[0] || contextualData.fallback.responses[0]
  }
  
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('trouble')) {
    return pageContext.responses[1] || contextualData.fallback.responses[1]
  }
  
  // Default to first response for the page
  // userRole is available for future role-specific response customization
  console.log(`AI response for ${userRole} on ${currentPage}:`, message)
  return pageContext.responses[0] || contextualData.fallback.responses[0]
}

/**
 * Get quick actions for the current page context
 */
export function getQuickActions(currentPage: string): QuickAction[] {
  const normalizedPage = currentPage.replace('/', '') || 'dashboard'
  const pageKey = normalizedPage as keyof AIContextualData
  
  const pageContext = contextualData[pageKey] || contextualData.fallback
  return pageContext.quickActions
}

/**
 * Get a contextual greeting message for new conversations
 */
export function getGreetingMessage(currentPage: string, userRole: 'technician' | 'company'): string {
  const normalizedPage = currentPage.replace('/', '') || 'dashboard'
  
  const greetings = {
    dashboard: `Welcome to your ShowCore dashboard! I can help you complete onboarding tasks, understand your stats, or navigate to different features.`,
    discovery: `Looking for technicians? I can help you search effectively, understand profiles, and guide you through the booking process.`,
    bookings: `Managing your bookings? I can help you understand statuses, communicate with ${userRole === 'company' ? 'technicians' : 'clients'}, and resolve any issues.`,
    'show-proof': userRole === 'technician' 
      ? `Ready to showcase your work? I can help you upload show proof, understand the XP system, and advance your tier level.`
      : `Reviewing show proof? I can help you understand what to look for and how the verification system works.`,
    reviews: `Need help with reviews? I can guide you through leaving reviews, responding to feedback, or handling disputes.`,
    analytics: `Exploring your analytics? I can help you understand the metrics, export data, and use insights to grow your business.`,
    settings: `Configuring your account? I can help you complete your profile, set up security, manage payments, and adjust preferences.`,
    help: `Welcome to the help center! I can answer questions about any ShowCore feature or guide you to the right resources.`
  }
  
  return greetings[normalizedPage as keyof typeof greetings] || greetings.dashboard
}