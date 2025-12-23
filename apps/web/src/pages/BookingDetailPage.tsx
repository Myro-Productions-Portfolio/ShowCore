import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  MessageCircle,
  Phone,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Download,
  Send
} from 'lucide-react'
import data from '@/sections/bookings-and-messaging/data.json'
import type { Booking, User as BookingUser, Message, Contract, TimeEntry, Invoice } from '@/sections/bookings-and-messaging/types'

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [client, setClient] = useState<BookingUser | null>(null)
  const [technician, setTechnician] = useState<BookingUser | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [contract, setContract] = useState<Contract | null>(null)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'time' | 'invoices'>('overview')

  useEffect(() => {
    if (id) {
      const foundBooking = data.bookings.find(b => b.id === id)
      if (foundBooking) {
        setBooking(foundBooking as Booking)
        
        // Find related data
        const clientUser = data.users.find(u => u.id === foundBooking.clientId)
        const technicianUser = foundBooking.technicianId 
          ? data.users.find(u => u.id === foundBooking.technicianId)
          : null
        
        setClient(clientUser as BookingUser || null)
        setTechnician(technicianUser as BookingUser || null)
        
        // Find messages for this booking
        const bookingMessages = data.messages.filter(m => m.bookingId === id)
        setMessages(bookingMessages as Message[])
        
        // Find contract
        const bookingContract = data.contracts.find(c => c.bookingId === id)
        setContract(bookingContract as Contract || null)
        
        // Find time entries
        const bookingTimeEntries = data.timeEntries.filter(t => t.bookingId === id)
        setTimeEntries(bookingTimeEntries as TimeEntry[])
        
        // Find invoices
        const bookingInvoices = data.invoices.filter(i => i.bookingId === id)
        setInvoices(bookingInvoices as Invoice[])
      }
    }
  }, [id])

  const handleUpdateStatus = (status: string) => {
    if (booking) {
      setBooking({ ...booking, status: status as any })
      // In a real app, this would update the backend
    }
  }

  const handleSendMessage = () => {
    if (newMessage.trim() && booking) {
      const message: Message = {
        id: `msg-${Date.now()}`,
        bookingId: booking.id,
        senderId: 'current-user', // In real app, get from auth context
        recipientId: technician?.id || client?.id || '',
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: false,
        attachments: []
      }
      setMessages([...messages, message])
      setNewMessage('')
      // In a real app, this would send to backend
    }
  }

  const handleScheduleCall = () => {
    // In a real app, this would open a scheduling modal or redirect to calendar
    console.log('Schedule call for booking:', booking?.id)
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Booking not found</h2>
          <p className="text-zinc-400 mb-4">The booking you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/bookings')}
            className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    )
  }

  const statusColors = {
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    confirmed: 'text-green-400 bg-green-400/10 border-green-400/20',
    'in-progress': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    completed: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    cancelled: 'text-red-400 bg-red-400/10 border-red-400/20'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{booking.title}</h1>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[booking.status]}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-zinc-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(booking.startDate)}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{booking.estimatedDuration} hours</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{booking.location}</span>
                </div>
                
                {booking.agreedRate && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${booking.agreedRate}/hour</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus('confirmed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </>
              )}
              
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => handleUpdateStatus('in-progress')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Start Work
                </button>
              )}
              
              {booking.status === 'in-progress' && (
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
              
              <button
                onClick={handleScheduleCall}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Schedule Call
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-zinc-900 p-1 rounded-lg">
          {[
            { id: 'overview', label: 'Overview', icon: FileText },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'time', label: 'Time Tracking', icon: Clock },
            { id: 'invoices', label: 'Invoices', icon: DollarSign }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Description</h3>
                  <p className="text-zinc-300 leading-relaxed">{booking.description}</p>
                </div>

                {/* Contract */}
                {contract && (
                  <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Contract</h3>
                      <button className="flex items-center gap-2 px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors">
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-white font-medium mb-2">Scope</h4>
                        <p className="text-zinc-300 text-sm">{contract.scope}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-zinc-300">Technician Signed</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-zinc-300">Client Signed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800">
                <div className="p-6 border-b border-zinc-800">
                  <h3 className="text-lg font-semibold text-white">Messages</h3>
                </div>
                
                <div className="p-6 max-h-96 overflow-y-auto space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === 'current-user'
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isCurrentUser
                            ? 'bg-amber-500 text-black'
                            : 'bg-zinc-800 text-white'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isCurrentUser ? 'text-black/70' : 'text-zinc-400'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="p-6 border-t border-zinc-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 focus:border-amber-500 focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      className="px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'time' && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-4">Time Entries</h3>
                <div className="space-y-3">
                  {timeEntries.map((entry) => (
                    <div key={entry.id} className="p-4 bg-zinc-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{entry.date}</span>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.status === 'approved' 
                            ? 'bg-green-400/10 text-green-400'
                            : 'bg-yellow-400/10 text-yellow-400'
                        }`}>
                          {entry.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400 mb-2">
                        <span>{new Date(entry.startTime).toLocaleTimeString()} - {new Date(entry.endTime).toLocaleTimeString()}</span>
                        <span>{entry.duration} hours</span>
                      </div>
                      <p className="text-zinc-300 text-sm">{entry.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'invoices' && (
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-4">Invoices</h3>
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 bg-zinc-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">{invoice.invoiceNumber}</h4>
                          <p className="text-zinc-400 text-sm">Due: {invoice.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{formatCurrency(invoice.total)}</p>
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            invoice.status === 'paid' 
                              ? 'bg-green-400/10 text-green-400'
                              : 'bg-yellow-400/10 text-yellow-400'
                          }`}>
                            {invoice.status}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {invoice.lineItems.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-zinc-300">{item.description}</span>
                            <span className="text-zinc-400">{formatCurrency(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>
              <div className="space-y-4">
                {client && (
                  <div className="flex items-center gap-3">
                    <img
                      src={client.avatar}
                      alt={client.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{client.name}</p>
                      <p className="text-zinc-400 text-sm">Client</p>
                    </div>
                  </div>
                )}
                
                {technician && (
                  <div className="flex items-center gap-3">
                    <img
                      src={technician.avatar}
                      alt={technician.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="text-white font-medium">{technician.name}</p>
                      <p className="text-zinc-400 text-sm">Technician</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Service Type</span>
                  <span className="text-white">{booking.serviceType}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-white">{booking.estimatedDuration} hours</span>
                </div>
                
                {booking.agreedRate && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Rate</span>
                    <span className="text-white">${booking.agreedRate}/hour</span>
                  </div>
                )}
                
                {booking.totalEstimate && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Estimate</span>
                    <span className="text-white">{formatCurrency(booking.totalEstimate)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-zinc-400">Created</span>
                  <span className="text-white">{new Date(booking.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('messages')}
                  className="w-full px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Message
                </button>
                
                <button
                  onClick={handleScheduleCall}
                  className="w-full px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Schedule Call
                </button>
                
                {contract && (
                  <button className="w-full px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Contract
                  </button>
                )}
                
                {booking.status === 'completed' && (
                  <button className="w-full px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Leave Review
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}