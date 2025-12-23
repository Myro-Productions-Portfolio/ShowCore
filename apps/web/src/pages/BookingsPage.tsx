import { BookingsMessaging } from '@/sections/bookings-and-messaging/components'
import data from '@/sections/bookings-and-messaging/data.json'
import type {
  Booking,
  User,
  BookingApplication,
  Offer,
  Contract,
  Deposit,
  TimeEntry,
  Invoice,
  Message,
} from '@/sections/bookings-and-messaging/types'

// Type assertions for imported data
const bookings = data.bookings as unknown as Booking[]
const users = data.users as unknown as User[]
const applications = data.bookingApplications as unknown as BookingApplication[]
const offers = data.offers as unknown as Offer[]
const contracts = data.contracts as unknown as Contract[]
const deposits = data.deposits as unknown as Deposit[]
const timeEntries = data.timeEntries as unknown as TimeEntry[]
const invoices = data.invoices as unknown as Invoice[]
const messages = data.messages as unknown as Message[]

// Use first user as current user
const currentUser = users[0]

export function BookingsPage() {
  return (
    <BookingsMessaging
      currentUserId={currentUser.id}
      currentUserRole={currentUser.role}
      bookings={bookings}
      users={users}
      applications={applications}
      offers={offers}
      contracts={contracts}
      deposits={deposits}
      timeEntries={timeEntries}
      invoices={invoices}
      messages={messages}
      onCreateDirectBooking={(booking: any) => console.log('Create direct booking:', booking)}
      onCreateOpenBooking={(booking: any) => console.log('Create open booking:', booking)}
      onApplyToBooking={(bookingId: string, application: any) => console.log('Apply to booking:', bookingId, application)}
      onAcceptApplication={(applicationId: string) => console.log('Accept application:', applicationId)}
      onDeclineApplication={(applicationId: string) => console.log('Decline application:', applicationId)}
      onCancelBooking={(bookingId: string, reason: string) => console.log('Cancel booking:', bookingId, reason)}
      onAcceptOffer={(offerId: string) => console.log('Accept offer:', offerId)}
      onDeclineOffer={(offerId: string) => console.log('Decline offer:', offerId)}
      onCounterOffer={(offerId: string, counterOffer: any) => console.log('Counter offer:', offerId, counterOffer)}
      onGenerateContract={(bookingId: string, contract: any) => console.log('Generate contract:', bookingId, contract)}
      onSignContract={(contractId: string) => console.log('Sign contract:', contractId)}
      onDownloadContract={(contractId: string) => console.log('Download contract:', contractId)}
      onSubmitDeposit={(depositId: string, paymentMethod: any) => console.log('Submit deposit:', depositId, paymentMethod)}
      onStartTimer={(bookingId: string) => console.log('Start timer:', bookingId)}
      onStopTimer={(timeEntryId: string) => console.log('Stop timer:', timeEntryId)}
      onCreateTimeEntry={(timeEntry: any) => console.log('Create time entry:', timeEntry)}
      onUpdateTimeEntry={(timeEntryId: string, updates: any) => console.log('Update time entry:', timeEntryId, updates)}
      onDeleteTimeEntry={(timeEntryId: string) => console.log('Delete time entry:', timeEntryId)}
      onApproveTimeEntry={(timeEntryId: string) => console.log('Approve time entry:', timeEntryId)}
      onDisputeTimeEntry={(timeEntryId: string, reason: string) => console.log('Dispute time entry:', timeEntryId, reason)}
      onGenerateInvoice={(bookingId: string) => console.log('Generate invoice:', bookingId)}
      onSendInvoice={(invoiceId: string) => console.log('Send invoice:', invoiceId)}
      onPayInvoice={(invoiceId: string, paymentMethod: any) => console.log('Pay invoice:', invoiceId, paymentMethod)}
      onDownloadInvoice={(invoiceId: string) => console.log('Download invoice:', invoiceId)}
      onDisputeInvoice={(invoiceId: string, reason: string) => console.log('Dispute invoice:', invoiceId, reason)}
      onSendMessage={(bookingId: string, message: any) => console.log('Send message:', bookingId, message)}
      onMarkMessageRead={(messageId: string) => console.log('Mark message read:', messageId)}
      onUploadAttachment={(file: File) => Promise.resolve({ id: `attach-${Date.now()}`, filename: file.name, fileSize: file.size, mimeType: file.type, url: URL.createObjectURL(file) })}
      onSelectBooking={(bookingId: string) => console.log('Select booking:', bookingId)}
      onChangeView={(view: any) => console.log('Change view:', view)}
      onFilterByStatus={(status: any) => console.log('Filter by status:', status)}
      onSearchBookings={(query: string) => console.log('Search bookings:', query)}
    />
  )
}
