# ShowCore E2E Tests

Comprehensive end-to-end testing suite for the ShowCore application using Playwright.

## Setup

1. **Install Playwright**:
   ```bash
   cd tests
   npm install
   npx playwright install
   ```

2. **Start the development server**:
   ```bash
   cd ../
   npm run dev
   ```

3. **Run tests**:
   ```bash
   cd tests
   npm test
   ```

## Test Suites

### 🔐 Authentication Tests (`auth.spec.ts`)
- Login/logout functionality
- Form validation
- Magic link authentication
- Registration flow
- Session persistence

### ⚙️ Settings Tests (`settings.spec.ts`)
- Theme switching (light/dark/system)
- Font size changes
- Language selection
- Settings persistence
- Role switching (technician/company)

### 🧭 Navigation Tests (`navigation.spec.ts`)
- Page routing
- Active navigation highlighting
- User menu functionality
- Notifications dropdown
- Mobile responsiveness

### 🌍 Internationalization Tests (`i18n.spec.ts`)
- Language switching
- Content translation
- HTML lang attribute updates
- Language persistence
- Fallback handling

## Test Commands

```bash
# Run all tests
npm test

# Run tests with browser UI
npm run test:headed

# Run tests in interactive mode
npm run test:ui

# Debug tests
npm run test:debug

# View test report
npm run test:report

# Run specific test suite
npm run test:auth
npm run test:settings
npm run test:navigation
npm run test:i18n
```

## Test Configuration

The tests are configured to:
- Run against `http://localhost:5173`
- Automatically start the dev server
- Test across multiple browsers (Chrome, Firefox, Safari)
- Include mobile viewport testing
- Capture screenshots on failure
- Record videos on failure
- Generate HTML reports

## Test Data

Tests use mock data and localStorage manipulation to simulate:
- Authenticated users
- App settings
- Theme preferences
- Language selections

## Utilities

The `helpers/test-utils.ts` file provides:
- User creation helpers
- Settings management
- Storage manipulation
- Navigation helpers
- Accessibility checks
- Responsive testing utilities

## Best Practices

1. **Clean State**: Each test starts with cleared localStorage
2. **Realistic Data**: Use realistic test data that matches production
3. **Wait Strategies**: Use proper waits for async operations
4. **Accessibility**: Include basic accessibility checks
5. **Mobile Testing**: Test responsive behavior
6. **Error Handling**: Test error states and edge cases

## Debugging

1. **Visual Debugging**: Use `--headed` flag to see tests run
2. **Interactive Mode**: Use `--ui` flag for step-by-step debugging
3. **Screenshots**: Check `test-results/` for failure screenshots
4. **Videos**: Review recorded videos for complex failures
5. **Console Logs**: Check browser console output in test reports

## CI/CD Integration

Tests are configured for CI environments:
- Retry failed tests automatically
- Run in parallel for speed
- Generate artifacts (screenshots, videos, reports)
- Fail build on test failures

## Adding New Tests

1. Create new `.spec.ts` file in `e2e/` directory
2. Import test utilities from `helpers/test-utils.ts`
3. Follow existing patterns for setup and teardown
4. Add descriptive test names and comments
5. Include both positive and negative test cases

## Performance Testing

Consider adding performance tests for:
- Page load times
- Theme switching speed
- Language change responsiveness
- Navigation performance
- Large dataset handling

## Security Testing

Include security-focused tests for:
- Authentication bypass attempts
- XSS prevention
- CSRF protection
- Input sanitization
- Session management