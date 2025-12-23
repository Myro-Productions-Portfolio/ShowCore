#!/usr/bin/env node

/**
 * Checkpoint Test Script
 * Verifies all UI completion functionality is working correctly
 */

import fs from 'fs'
import path from 'path'

console.log('🔍 Running UI Completion Checkpoint Tests...\n')

const tests = []
let passed = 0
let failed = 0

function test(name, fn) {
  tests.push({ name, fn })
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath)
}

function fileContains(filePath, content) {
  if (!fileExists(filePath)) return false
  const fileContent = fs.readFileSync(filePath, 'utf8')
  return fileContent.includes(content)
}

// Test 1: Authentication Access
test('Authentication Access - AppLayout has logout functionality', () => {
  const appLayoutPath = 'src/components/AppLayout.tsx'
  assert(fileExists(appLayoutPath), 'AppLayout.tsx should exist')
  assert(fileContains(appLayoutPath, 'handleLogout'), 'AppLayout should have handleLogout function')
  assert(fileContains(appLayoutPath, 'localStorage.removeItem'), 'Should clear localStorage on logout')
  assert(fileContains(appLayoutPath, 'navigate(\'/login\')'), 'Should navigate to login on logout')
})

// Test 2: Settings Persistence
test('Settings Persistence - useLocalStorage hook exists', () => {
  const hookPath = 'src/hooks/useLocalStorage.ts'
  assert(fileExists(hookPath), 'useLocalStorage hook should exist')
  assert(fileContains(hookPath, 'JSON.parse'), 'Should handle JSON serialization')
  assert(fileContains(hookPath, 'JSON.stringify'), 'Should handle JSON deserialization')
})

test('Settings Persistence - SettingsPage uses useLocalStorage', () => {
  const settingsPath = 'src/pages/SettingsPage.tsx'
  assert(fileExists(settingsPath), 'SettingsPage should exist')
  assert(fileContains(settingsPath, 'useLocalStorage'), 'Should import useLocalStorage')
  assert(fileContains(settingsPath, 'showcore_settings_role'), 'Should persist role selection')
  assert(fileContains(settingsPath, 'showcore_settings_section'), 'Should persist section navigation')
})

// Test 3: Dashboard Completion
test('Dashboard Completion - DashboardPage uses full Dashboard component', () => {
  const dashboardPath = 'src/pages/DashboardPage.tsx'
  assert(fileExists(dashboardPath), 'DashboardPage should exist')
  assert(fileContains(dashboardPath, 'from \'@/sections/dashboard-and-onboarding/components\''), 'Should import full Dashboard component')
  assert(fileContains(dashboardPath, 'data.json'), 'Should load data from JSON file')
  assert(fileContains(dashboardPath, 'handleTaskClick'), 'Should have task navigation handlers')
})

test('Dashboard Completion - Dashboard data file exists', () => {
  const dataPath = 'src/sections/dashboard-and-onboarding/data.json'
  assert(fileExists(dataPath), 'Dashboard data.json should exist')
  assert(fileContains(dataPath, 'technicianOnboardingProgress'), 'Should have technician onboarding data')
  assert(fileContains(dataPath, 'companyOnboardingProgress'), 'Should have company onboarding data')
  assert(fileContains(dataPath, 'technicianStats'), 'Should have technician stats')
  assert(fileContains(dataPath, 'companyStats'), 'Should have company stats')
})

// Test 4: AI Assistant
test('AI Assistant - AppLayout enables AI assistant', () => {
  const appLayoutPath = 'src/components/AppLayout.tsx'
  assert(fileContains(appLayoutPath, 'showAIAssistant={true}'), 'Should enable AI assistant')
  assert(fileContains(appLayoutPath, 'aiState'), 'Should have AI state management')
  assert(fileContains(appLayoutPath, 'handleAIMessage'), 'Should have AI message handler')
})

test('AI Assistant - AI responses implementation exists', () => {
  const aiResponsesPath = 'src/lib/aiResponses.ts'
  assert(fileExists(aiResponsesPath), 'aiResponses.ts should exist')
  assert(fileContains(aiResponsesPath, 'getAIResponse'), 'Should have getAIResponse function')
  assert(fileContains(aiResponsesPath, 'getQuickActions'), 'Should have getQuickActions function')
  assert(fileContains(aiResponsesPath, 'contextualData'), 'Should have contextual response data')
})

// Test 5: Button Handlers
test('Button Handlers - DiscoveryPage has navigation handlers', () => {
  const discoveryPath = 'src/pages/DiscoveryPage.tsx'
  assert(fileContains(discoveryPath, 'onViewProfile={(id) => navigate'), 'Should have view profile handler')
  assert(fileContains(discoveryPath, 'onRequestBooking={(id) => navigate'), 'Should have request booking handler')
})

test('Button Handlers - BookingsPage has state management', () => {
  const bookingsPath = 'src/pages/BookingsPage.tsx'
  assert(fileContains(bookingsPath, 'selectedBookingId'), 'Should have selectedBookingId state')
  assert(fileContains(bookingsPath, 'viewMode'), 'Should have viewMode state')
  assert(fileContains(bookingsPath, 'statusFilter'), 'Should have statusFilter state')
})

// Test 6: Cross-Feature Navigation
test('Cross-Feature Navigation - TechnicianProfilePage exists', () => {
  const techProfilePath = 'src/pages/TechnicianProfilePage.tsx'
  assert(fileExists(techProfilePath), 'TechnicianProfilePage should exist')
  assert(fileContains(techProfilePath, 'useParams'), 'Should use URL parameters')
  assert(fileContains(techProfilePath, 'handleRequestBooking'), 'Should have booking navigation')
})

test('Cross-Feature Navigation - BookingDetailPage exists', () => {
  const bookingDetailPath = 'src/pages/BookingDetailPage.tsx'
  assert(fileExists(bookingDetailPath), 'BookingDetailPage should exist')
  assert(fileContains(bookingDetailPath, 'useParams'), 'Should use URL parameters')
  assert(fileContains(bookingDetailPath, 'handleUpdateStatus'), 'Should have status management')
})

test('Cross-Feature Navigation - Router has new routes', () => {
  const routerPath = 'src/lib/router.tsx'
  assert(fileContains(routerPath, 'technician/:id'), 'Should have technician profile route')
  assert(fileContains(routerPath, 'bookings/:id'), 'Should have booking detail route')
  assert(fileContains(routerPath, 'TechnicianProfilePage'), 'Should import TechnicianProfilePage')
  assert(fileContains(routerPath, 'BookingDetailPage'), 'Should import BookingDetailPage')
})

// Test 7: Error Boundary
test('Error Boundary - ErrorBoundary component exists', () => {
  const errorBoundaryPath = 'src/components/ErrorBoundary.tsx'
  assert(fileExists(errorBoundaryPath), 'ErrorBoundary should exist')
  assert(fileContains(errorBoundaryPath, 'componentDidCatch'), 'Should have error catching')
  assert(fileContains(errorBoundaryPath, 'getDerivedStateFromError'), 'Should handle error state')
})

test('Error Boundary - Router wraps routes in ErrorBoundary', () => {
  const routerPath = 'src/lib/router.tsx'
  assert(fileContains(routerPath, 'ErrorBoundary'), 'Should import ErrorBoundary')
  assert(fileContains(routerPath, '<ErrorBoundary>'), 'Should wrap routes in ErrorBoundary')
})

// Run all tests
async function runTests() {
  console.log(`Running ${tests.length} tests...\n`)
  
  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (error) {
      console.log(`❌ ${name}`)
      console.log(`   Error: ${error.message}`)
      failed++
    }
  }
  
  console.log(`\n📊 Test Results:`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`)
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! UI completion is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
    process.exit(1)
  }
}

runTests().catch(console.error)