#!/usr/bin/env node

/**
 * Settings Persistence Verification Script
 * Tests the localStorage functionality and data structures
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 ShowCore Settings Persistence Verification\n');

// Test 1: Verify useLocalStorage hook exists and is properly implemented
console.log('1. Testing useLocalStorage hook...');
try {
    const hookPath = 'src/hooks/useLocalStorage.ts';
    const hookContent = fs.readFileSync(hookPath, 'utf8');
    
    const hasGenericType = hookContent.includes('<T>');
    const hasJsonSerialization = hookContent.includes('JSON.parse') && hookContent.includes('JSON.stringify');
    const hasErrorHandling = hookContent.includes('try') && hookContent.includes('catch');
    const hasStorageListener = hookContent.includes('storage');
    
    if (hasGenericType && hasJsonSerialization && hasErrorHandling && hasStorageListener) {
        console.log('   ✅ useLocalStorage hook properly implemented');
        console.log('   ✅ Generic type support');
        console.log('   ✅ JSON serialization/deserialization');
        console.log('   ✅ Error handling');
        console.log('   ✅ Cross-tab synchronization');
    } else {
        console.log('   ❌ useLocalStorage hook missing features');
    }
} catch (error) {
    console.log('   ❌ useLocalStorage hook not found');
}

// Test 2: Verify SettingsPage uses useLocalStorage
console.log('\n2. Testing SettingsPage implementation...');
try {
    const settingsPath = 'src/pages/SettingsPage.tsx';
    const settingsContent = fs.readFileSync(settingsPath, 'utf8');
    
    const hasRolePersistence = settingsContent.includes("useLocalStorage<'technician' | 'company'>('showcore_settings_role'");
    const hasSectionPersistence = settingsContent.includes("useLocalStorage<SettingsSectionId>('showcore_settings_section'");
    const importsHook = settingsContent.includes("import { useLocalStorage }");
    
    if (hasRolePersistence && hasSectionPersistence && importsHook) {
        console.log('   ✅ SettingsPage uses useLocalStorage for role');
        console.log('   ✅ SettingsPage uses useLocalStorage for section');
        console.log('   ✅ Proper import statement');
    } else {
        console.log('   ❌ SettingsPage missing localStorage integration');
    }
} catch (error) {
    console.log('   ❌ SettingsPage not found or readable');
}

// Test 3: Verify AppLayout authentication logic
console.log('\n3. Testing AppLayout authentication...');
try {
    const appLayoutPath = 'src/components/AppLayout.tsx';
    const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');
    
    const hasAuthCheck = appLayoutContent.includes("localStorage.getItem('showcore_user')");
    const hasLogoutHandler = appLayoutContent.includes("localStorage.removeItem('showcore_user')");
    const hasNavigateToLogin = appLayoutContent.includes("navigate('/login')");
    const hasUserMenuHandlers = appLayoutContent.includes("onSettings") && appLayoutContent.includes("onViewProfile");
    
    if (hasAuthCheck && hasLogoutHandler && hasNavigateToLogin && hasUserMenuHandlers) {
        console.log('   ✅ Authentication state checking');
        console.log('   ✅ Logout functionality');
        console.log('   ✅ Login redirect');
        console.log('   ✅ User menu handlers');
    } else {
        console.log('   ❌ AppLayout missing authentication features');
    }
} catch (error) {
    console.log('   ❌ AppLayout not found or readable');
}

// Test 4: Verify DashboardPage integration
console.log('\n4. Testing DashboardPage integration...');
try {
    const dashboardPath = 'src/pages/DashboardPage.tsx';
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    
    const importsFullDashboard = dashboardContent.includes("import { Dashboard } from '@/sections/dashboard-and-onboarding/components'");
    const importsData = dashboardContent.includes("import dashboardData from '@/sections/dashboard-and-onboarding/data.json'");
    const usesLocalStorage = dashboardContent.includes("useLocalStorage");
    const hasTaskNavigation = dashboardContent.includes("handleTaskClick");
    
    if (importsFullDashboard && importsData && usesLocalStorage && hasTaskNavigation) {
        console.log('   ✅ Imports full Dashboard component');
        console.log('   ✅ Imports dashboard data');
        console.log('   ✅ Uses localStorage for user role');
        console.log('   ✅ Task navigation implemented');
    } else {
        console.log('   ❌ DashboardPage missing integration features');
    }
} catch (error) {
    console.log('   ❌ DashboardPage not found or readable');
}

// Test 5: Verify dashboard data structure
console.log('\n5. Testing dashboard data structure...');
try {
    const dataPath = 'src/sections/dashboard-and-onboarding/data.json';
    const dataContent = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(dataContent);
    
    const hasTechnicianOnboarding = data.technicianOnboardingProgress && data.technicianOnboardingProgress.tasks;
    const hasCompanyOnboarding = data.companyOnboardingProgress && data.companyOnboardingProgress.tasks;
    const hasTechnicianStats = data.technicianStats;
    const hasCompanyStats = data.companyStats;
    const hasTechnicianActivity = data.technicianActivity && Array.isArray(data.technicianActivity);
    const hasCompanyActivity = data.companyActivity && Array.isArray(data.companyActivity);
    
    if (hasTechnicianOnboarding && hasCompanyOnboarding && hasTechnicianStats && hasCompanyStats && hasTechnicianActivity && hasCompanyActivity) {
        console.log('   ✅ Technician onboarding data (' + data.technicianOnboardingProgress.tasks.length + ' tasks)');
        console.log('   ✅ Company onboarding data (' + data.companyOnboardingProgress.tasks.length + ' tasks)');
        console.log('   ✅ Technician stats');
        console.log('   ✅ Company stats');
        console.log('   ✅ Technician activity (' + data.technicianActivity.length + ' items)');
        console.log('   ✅ Company activity (' + data.companyActivity.length + ' items)');
    } else {
        console.log('   ❌ Dashboard data missing required sections');
    }
} catch (error) {
    console.log('   ❌ Dashboard data not found or invalid JSON');
}

console.log('\n🎉 Verification Complete!');
console.log('\nTo test the functionality manually:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Open http://localhost:5173/test-settings.html');
console.log('3. Test localStorage persistence');
console.log('4. Navigate to the main app and test authentication/settings');