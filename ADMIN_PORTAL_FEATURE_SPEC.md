# Admin Portal - Feature Specification

## Overview

Create a dedicated admin portal for ShowCore administrators to manage users, content, disputes, and monitor system health. This is the first major feature upgrade after Phase 1 infrastructure deployment.

## Current State

### What Exists
- ✅ Admin role in database (UserRole.ADMIN)
- ✅ Admin procedures in tRPC backend (adminList, delete user, etc.)
- ✅ Admin middleware (requireAdmin) for protected routes
- ✅ Clerk authentication integrated
- ✅ First admin user created (pmnicolasm@gmail.com)

### What's Missing
- ❌ No admin UI/portal
- ❌ No admin navigation/routing
- ❌ No admin dashboard
- ❌ No admin-specific pages
- ❌ No way to access admin features from frontend

### Current Signup Flow Issue
- Users can only sign up as "Technician" or "Company"
- No "Admin" option in registration
- Admin users must be created manually in database
- Admin role is not visible in UI

## Proposed Solution

### Admin Portal Structure

```
/admin
├── /dashboard          # Overview, stats, recent activity
├── /users              # User management (list, view, edit, delete)
├── /technicians        # Technician-specific management
├── /companies          # Company-specific management
├── /content            # Content moderation (show proofs, reviews)
├── /disputes           # Dispute resolution
├── /analytics          # Platform analytics
└── /settings           # System settings, configuration
```

## Feature Requirements

### 1. Admin Dashboard (/admin/dashboard)

**Purpose**: High-level overview of platform health and activity

**Components**:
- Key metrics cards:
  - Total users (breakdown by role)
  - Active bookings
  - Pending disputes
  - Pending show proofs
  - Revenue (if applicable)
- Recent activity feed:
  - New user registrations
  - New bookings
  - Disputes filed
  - Show proofs submitted
- Quick actions:
  - Review pending show proofs
  - Resolve disputes
  - Moderate content
- System health indicators:
  - Database status
  - API response time
  - Error rate

**Data Sources**:
- User count: `prisma.user.count()`
- Booking stats: `prisma.booking.count()` with status filters
- Dispute stats: `prisma.dispute.count()` with status filters
- Show proof stats: `prisma.showProof.count()` with status filters

### 2. User Management (/admin/users)

**Purpose**: Manage all platform users

**Features**:
- User list with filters:
  - Filter by role (USER, TECHNICIAN, COMPANY, ADMIN)
  - Filter by status (active, deleted)
  - Filter by email verification status
  - Search by email or name
- User actions:
  - View user details
  - Edit user role
  - Soft delete user
  - Restore deleted user
  - View user activity history
- Bulk actions:
  - Export user list (CSV)
  - Bulk delete users

**Data Sources**:
- User list: `trpc.user.adminList` (already exists)
- User details: `trpc.user.getById` (already exists)
- Delete user: `trpc.user.delete` (already exists)

### 3. Content Moderation (/admin/content)

**Purpose**: Review and moderate user-generated content

**Features**:
- Show Proof review:
  - List pending show proofs
  - View show proof details (media, description)
  - AI analysis results
  - Approve/reject with notes
  - Award XP on approval
- Review moderation:
  - Flag inappropriate reviews
  - Remove reviews
  - Respond to review disputes

**Data Sources**:
- Show proofs: `prisma.showProof.findMany()` with status filters
- Reviews: `prisma.review.findMany()` with filters

### 4. Dispute Resolution (/admin/disputes)

**Purpose**: Manage and resolve booking disputes

**Features**:
- Dispute list:
  - Filter by status (OPEN, UNDER_REVIEW, ARBITRATION, RESOLVED, DISMISSED)
  - Sort by date, priority
- Dispute details:
  - View dispute reason and description
  - View evidence from both parties
  - View booking details
  - Communication thread
- Resolution actions:
  - Mark as under review
  - Request additional information
  - Resolve dispute (with resolution notes)
  - Dismiss dispute

**Data Sources**:
- Disputes: `prisma.dispute.findMany()` with filters
- Booking details: `prisma.booking.findUnique()`

### 5. Platform Analytics (/admin/analytics)

**Purpose**: View platform metrics and trends

**Features**:
- User growth chart (daily/weekly/monthly)
- Booking volume chart
- Revenue chart (if applicable)
- User engagement metrics
- Top technicians (by bookings, ratings)
- Top companies (by bookings)
- Geographic distribution
- Export reports

**Data Sources**:
- Aggregated queries on User, Booking, Review tables
- Time-series data for charts

### 6. System Settings (/admin/settings)

**Purpose**: Configure platform settings

**Features**:
- Platform configuration:
  - Maintenance mode toggle
  - Feature flags
  - Email templates
- XP system configuration:
  - XP rewards per action
  - Tier thresholds
- Notification settings:
  - Email notification templates
  - Push notification settings

## Technical Implementation

### Backend (tRPC Procedures)

**New procedures needed**:

```typescript
// Admin dashboard
admin.getDashboardStats: Get overview statistics
admin.getRecentActivity: Get recent platform activity

// Content moderation
admin.listShowProofs: List show proofs with filters
admin.reviewShowProof: Approve/reject show proof
admin.listReviews: List reviews with filters
admin.moderateReview: Flag/remove review

// Dispute resolution
admin.listDisputes: List disputes with filters
admin.getDisputeDetails: Get full dispute details
admin.updateDisputeStatus: Update dispute status
admin.resolveDispute: Resolve dispute with notes

// Analytics
admin.getUserGrowthStats: User growth over time
admin.getBookingStats: Booking statistics
admin.getEngagementStats: User engagement metrics

// System settings
admin.getSystemSettings: Get current settings
admin.updateSystemSettings: Update settings
```

### Frontend Components

**New components needed**:

```
apps/web/src/pages/admin/
├── AdminLayout.tsx           # Admin portal layout with sidebar
├── Dashboard.tsx             # Admin dashboard page
├── Users.tsx                 # User management page
├── UserDetail.tsx            # User detail page
├── Content.tsx               # Content moderation page
├── ShowProofReview.tsx       # Show proof review page
├── Disputes.tsx              # Dispute list page
├── DisputeDetail.tsx         # Dispute detail page
├── Analytics.tsx             # Analytics page
└── Settings.tsx              # Settings page

apps/web/src/components/admin/
├── AdminSidebar.tsx          # Admin navigation sidebar
├── StatCard.tsx              # Metric card component
├── ActivityFeed.tsx          # Recent activity feed
├── UserTable.tsx             # User list table
├── ShowProofCard.tsx         # Show proof card
├── DisputeCard.tsx           # Dispute card
└── AnalyticsChart.tsx        # Chart component
```

### Routing

**Add admin routes**:

```typescript
// apps/web/src/lib/router.tsx
{
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { path: 'dashboard', element: <Dashboard /> },
    { path: 'users', element: <Users /> },
    { path: 'users/:id', element: <UserDetail /> },
    { path: 'content', element: <Content /> },
    { path: 'disputes', element: <Disputes /> },
    { path: 'disputes/:id', element: <DisputeDetail /> },
    { path: 'analytics', element: <Analytics /> },
    { path: 'settings', element: <Settings /> },
  ],
}
```

### Access Control

**Protect admin routes**:

```typescript
// Check user role before rendering admin pages
const { user } = useAuth()

if (user?.role !== 'ADMIN') {
  return <Navigate to="/" />
}
```

## Design Considerations

### UI/UX
- Use existing ShowCore design system (amber accent, dark mode support)
- Admin portal should feel distinct from main app (different sidebar, header)
- Tables should be sortable, filterable, paginated
- Actions should have confirmation dialogs
- Success/error toasts for all actions

### Performance
- Paginate large lists (users, bookings, disputes)
- Use React Query for caching
- Lazy load charts and analytics
- Debounce search inputs

### Security
- All admin endpoints protected with `requireAdmin` middleware
- Audit log for admin actions (who did what, when)
- Rate limiting on admin endpoints
- CSRF protection

## Implementation Phases

### Phase 1: Foundation (2-3 hours)
- Create AdminLayout with sidebar navigation
- Create admin dashboard with basic stats
- Add admin routing
- Protect routes with role check

### Phase 2: User Management (2-3 hours)
- User list page with filters
- User detail page
- Edit user role
- Delete/restore user

### Phase 3: Content Moderation (3-4 hours)
- Show proof review page
- Approve/reject show proofs
- Award XP on approval
- Review moderation

### Phase 4: Dispute Resolution (2-3 hours)
- Dispute list page
- Dispute detail page
- Update dispute status
- Resolve disputes

### Phase 5: Analytics (3-4 hours)
- User growth chart
- Booking stats
- Engagement metrics
- Export reports

### Phase 6: Settings (1-2 hours)
- System settings page
- Feature flags
- Configuration management

**Total Estimated Time**: 13-19 hours

## Success Criteria

- ✅ Admin can access admin portal at /admin
- ✅ Admin can view dashboard with key metrics
- ✅ Admin can manage users (view, edit, delete)
- ✅ Admin can review and approve show proofs
- ✅ Admin can resolve disputes
- ✅ Admin can view platform analytics
- ✅ All admin actions are logged
- ✅ Non-admin users cannot access admin portal
- ✅ Admin portal is responsive (desktop, tablet)

## Future Enhancements

- Real-time notifications for admin actions
- Advanced analytics (cohort analysis, retention)
- Automated content moderation (AI-powered)
- Bulk operations (bulk approve, bulk delete)
- Admin user management (create/manage other admins)
- Audit log viewer
- System health monitoring dashboard
- Email campaign management
- A/B testing configuration

## Related Files

### Existing Code to Reference
- `sections/admin-portal/` - Admin portal mockups and components (already exist!)
- `backend/src/trpc/procedures/user.ts` - User management procedures
- `backend/src/middleware/clerk-auth.ts` - Admin middleware
- `backend/prisma/schema.prisma` - Database schema

### Files to Create
- `apps/web/src/pages/admin/` - Admin pages
- `apps/web/src/components/admin/` - Admin components
- `backend/src/trpc/procedures/admin.ts` - New admin procedures

## Notes

- The `sections/admin-portal/` folder already has mockup components! Review these first.
- Admin portal should be a separate section, not mixed with main app
- Consider adding admin badge/indicator in main app header when logged in as admin
- Add "Switch to Admin Portal" link in user menu for admin users
- Admin portal should have its own theme/styling to distinguish it

---

**Status**: Specification Complete
**Priority**: High (First feature after Phase 1)
**Estimated Effort**: 13-19 hours
**Dependencies**: Phase 1 infrastructure (complete), Clerk authentication (complete)
