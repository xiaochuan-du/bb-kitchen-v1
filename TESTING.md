# Automated Testing Setup

## Overview

This project now has automated end-to-end testing with Playwright integrated with Claude Code through MCP (Model Context Protocol).

## What's Included

### Testing Framework
- **Playwright** - Modern E2E testing framework
- **12 comprehensive tests** covering:
  - Landing page UI
  - Authentication flows
  - Accessibility features
  - Responsive design

### Test Suites

1. **Landing Page Tests** ([tests/landing-page.spec.ts](tests/landing-page.spec.ts))
   - Displays correct content
   - Shows all features
   - Has proper meta information

2. **Authentication Flow Tests** ([tests/auth-flow.spec.ts](tests/auth-flow.spec.ts))
   - Sign-in button visibility
   - Redirect behavior for protected routes
   - Button configuration

3. **Accessibility Tests** ([tests/accessibility.spec.ts](tests/accessibility.spec.ts))
   - Proper heading hierarchy
   - Semantic HTML structure
   - Keyboard accessibility

4. **Responsive Design Tests** ([tests/responsive.spec.ts](tests/responsive.spec.ts))
   - Mobile viewport (iPhone 12)
   - Tablet viewport (iPad Pro)
   - Desktop viewport (1920x1080)

## Running Tests

### CLI Commands

```bash
# Run all tests (headless)
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in debug mode
npm run test:debug

# Run specific test file
npx playwright test tests/landing-page.spec.ts

# View test report
npx playwright show-report
```

### Using Claude Code

With the MCP server configured, you can ask Claude to:
- Run tests: "Run all Playwright tests"
- Debug failures: "Run tests in headed mode to see what's failing"
- Generate new tests: "Write a test for the guest RSVP flow"
- Analyze results: "Show me the test report"

## Test Results

Current status: **12/12 tests passing ✓**

Test coverage includes:
- ✓ Landing page rendering
- ✓ Authentication redirects
- ✓ Accessibility compliance
- ✓ Responsive design (mobile, tablet, desktop)

## Adding New Tests

Create a new test file in the `tests/` directory:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Your Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/your-page')
    await expect(page.getByText('Expected Text')).toBeVisible()
  })
})
```

Then run:
```bash
npm test
```

## CI/CD Integration

The Playwright configuration is CI-ready:
- Automatically starts dev server before tests
- Retries failed tests in CI environment
- Generates HTML reports
- Screenshots on failure

## MCP Server Integration

The Playwright MCP server has been configured for Claude Code:
```bash
claude mcp add --transport stdio playwright -- npx -y @modelcontextprotocol/server-playwright
```

This allows Claude Code to:
- Execute tests programmatically
- Analyze test results
- Suggest test improvements
- Debug failing tests

## Best Practices

1. **Use semantic locators**: `getByRole`, `getByLabel`, `getByText`
2. **Write descriptive names**: Test names should explain what they test
3. **Keep tests independent**: Each test should work in isolation
4. **Use proper waits**: Always use `await expect()` for assertions
5. **Test user behavior**: Focus on what users do, not implementation

## Troubleshooting

### Tests failing locally
```bash
# Clear cache and reinstall
rm -rf node_modules/.playwright
npx playwright install
```

### Need to debug a test
```bash
npm run test:debug
# Or add page.pause() in your test
```

### View failed test screenshots
```bash
npx playwright show-report
```

## Next Steps

Consider adding tests for:
- Host dashboard functionality
- Event creation flow
- Guest RSVP submission
- Image upload functionality
- Shopping list generation

For more details, see [tests/README.md](tests/README.md)
