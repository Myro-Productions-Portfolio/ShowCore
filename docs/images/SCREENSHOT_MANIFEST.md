# ShowCore Application Screenshots Manifest

**Generated**: February 6, 2026
**Purpose**: Portfolio documentation for AWS migration project
**Application URL**: http://localhost:3003 (Docker container)

## Screenshot Inventory

### Authentication Screenshots

#### 1. Login Page
- **Original**: `login-page.png` (1.3 MB)
- **Updated**: `login-page-updated.png` (1.0 MB) - Captured Feb 6, 2026
- **Route**: `/login`
- **Description**: Modern authentication interface featuring:
  - Split-screen design with promotional content on left
  - Email/password login with magic link option
  - OAuth providers: Google, Apple, Microsoft
  - Statistics banner (2,500+ Technicians, 850+ Companies, 15K+ Shows Booked)
  - Professional background image with audio technician silhouette
  - "Where talent meets opportunity" tagline
- **Recommended for README**: `login-page-updated.png`

### Main Application Screenshots

#### 2. Dashboard
- **Original**: `dashboard.png` (356 KB)
- **Updated**: `dashboard-updated.png` (355 KB) - Captured Feb 6, 2026
- **Route**: `/` or `/dashboard`
- **Description**: Main user dashboard displaying:
  - Welcome message with account setup progress (36%)
  - Getting Started checklist with categorized onboarding tasks (Profile, Trust, Payment, Engagement)
  - XP rewards system for task completion
  - Quick Stats cards (Total Bookings, Completed, Average Rating, Total Earnings)
  - Recent Activity feed showing booking confirmations, messages, payments, reviews
  - Progress tracking: 4 of 11 tasks completed
- **Recommended for README**: `dashboard-updated.png`

#### 3. Settings Page
- **Original**: `settings.png` (296 KB)
- **Updated**: `settings-updated.png` (296 KB) - Captured Feb 6, 2026
- **Route**: `/settings`
- **Description**: Comprehensive settings interface featuring:
  - Sidebar navigation with categorized settings (Account, Professional, Preferences, Advanced)
  - Profile management (photo upload, basic information, bio)
  - Skills management with tag system (Audio Engineering, Live Sound, System Tuning, etc.)
  - Hourly rate range configuration ($75-$150)
  - Portfolio links management (SoundBetter, LinkedIn, Instagram)
  - Timezone and profile visibility settings
  - Technician/Company role toggle
- **Recommended for README**: `settings-updated.png`

#### 4. Discovery Page (NEW)
- **File**: `discovery-page.png` (315 KB) - Captured Feb 6, 2026
- **Route**: `/discovery`
- **Description**: Technician discovery marketplace showing:
  - Search bar with keyword filtering
  - Advanced filter sidebar (Location with radius, Tier levels, Skills, Hourly Rate, Verification status)
  - Grid of technician profile cards displaying:
    - Profile photo, name, tier badge, verification status
    - Location and distance
    - Skills and specializations
    - Hourly rate
    - Star rating and review count
    - XP/achievements
  - 8 technicians displayed with diverse skill sets
  - Professional layout with clear visual hierarchy
- **Recommended for README**: `discovery-page.png` (NEW - not yet in README)

#### 5. Bookings & Messaging Page (NEW)
- **File**: `bookings-page.png` (321 KB) - Captured Feb 6, 2026
- **Route**: `/bookings`
- **Description**: Booking management interface featuring:
  - Tab filtering by status (All, Pending, Confirmed, In Progress, Completed, Cancelled)
  - List view with booking cards showing:
    - Technician profile photo and name
    - Event title and service type
    - Date, time, and duration
    - Location details
    - Hourly rate and total estimate
    - Status badges with color coding
    - Message button for communication
  - Search functionality for bookings
  - List/Calendar view toggle
  - 8 bookings displayed across various statuses
- **Recommended for README**: `bookings-page.png` (NEW - not yet in README)

## Technical Details

### Screenshot Capture Method
- **Tool**: Playwright MCP via Claude Code
- **Format**: PNG (lossless compression)
- **Mode**: Full page screenshots (entire scrollable content)
- **Browser**: Chromium (headless)
- **Viewport**: Default responsive viewport
- **Date**: February 6, 2026

### Screenshot Quality
- **Resolution**: High-DPI screenshots suitable for portfolio use
- **File Sizes**: Optimized (296 KB - 1.3 MB)
- **Color Accuracy**: True color representation of application UI
- **Consistency**: All screenshots captured from same session with consistent styling

## README.md Integration Status

### Currently Referenced in README (Lines 109-129)
1. `login-page.png` - Original version (1.3 MB)
2. `dashboard.png` - Original version (356 KB)
3. `settings.png` - Original version (296 KB)

### Recommended Updates
Replace existing image references with updated versions:
- Line 118: `docs/images/login-page.png` → `docs/images/login-page-updated.png`
- Line 124: `docs/images/dashboard.png` → `docs/images/dashboard-updated.png`
- Line 129: `docs/images/settings.png` → `docs/images/settings-updated.png`

### Additional Screenshots Available (Not Yet in README)
1. **Discovery Page** (`discovery-page.png`) - Showcase technician marketplace functionality
2. **Bookings Page** (`bookings-page.png`) - Demonstrate booking management features

## Recommendations for Portfolio Documentation

### 1. Update Existing README References
The updated screenshots are nearly identical in size but represent the current state of the application. Recommend updating all three references to use the `-updated.png` versions for consistency.

### 2. Add New Feature Screenshots
Consider adding sections for:
- **Technician Discovery**: Show the marketplace functionality with the discovery page
- **Booking Management**: Demonstrate the comprehensive booking system

### 3. Screenshot Naming Convention
Consider renaming files for clarity:
- `login-page-updated.png` → `login-page.png` (replace original)
- `dashboard-updated.png` → `dashboard.png` (replace original)
- `settings-updated.png` → `settings.png` (replace original)

This would eliminate the need to update README references.

### 4. Future Screenshot Needs
For comprehensive documentation, consider capturing:
- Show Proof page (Show XP system)
- Reviews page (Trust & reputation system)
- Analytics page (Data visualization)
- Individual technician profile view
- Booking detail page with messaging
- Calendar view of bookings

## File Structure
```
/Volumes/DevDrive/Projects/websites/ShowCore/docs/images/
├── login-page.png (original, 1.3 MB)
├── login-page-updated.png (new, 1.0 MB)
├── dashboard.png (original, 356 KB)
├── dashboard-updated.png (new, 355 KB)
├── settings.png (original, 296 KB)
├── settings-updated.png (new, 296 KB)
├── discovery-page.png (NEW, 315 KB)
├── bookings-page.png (NEW, 321 KB)
└── SCREENSHOT_MANIFEST.md (this file)
```

## Notes
- All screenshots captured from running Docker containers (showcore-app on port 3003)
- Application is fully functional with mock data
- Clean UI demonstrates professional design system with amber/yellow primary color scheme
- Screenshots suitable for AWS Solutions Architect portfolio presentation
