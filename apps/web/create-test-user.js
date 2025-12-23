// Simple script to create a test user in localStorage
// Run this in the browser console at http://localhost:5173

const testUser = {
  id: 'test_user_123',
  email: 'test@showcore.com',
  name: 'Test User',
  role: 'technician',
  profileComplete: true,
  emailVerified: true,
  avatar: null
};

// Set the user in localStorage
localStorage.setItem('showcore_user', JSON.stringify(testUser));

console.log('✅ Test user created in localStorage:', testUser);
console.log('🔄 Refresh the page to see the app with the test user');

// Also set some default settings
localStorage.setItem('showcore_theme', JSON.stringify('system'));
localStorage.setItem('showcore_font_size', JSON.stringify('medium'));
localStorage.setItem('showcore_language', JSON.stringify('en'));

console.log('✅ Default settings also configured');