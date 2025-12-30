# Testing Guide

This project uses Playwright for end-to-end testing.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific test file
```bash
npx playwright test tests/landing-page.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test --grep "Authentication"
```

## Test Structure

- `landing-page.spec.ts` - Tests for the landing page UI and content
- `auth-flow.spec.ts` - Tests for authentication flows and redirects
- `accessibility.spec.ts` - Tests for accessibility features
- `responsive.spec.ts` - Tests for responsive design across devices

## Writing Tests

### Basic Test Example
```typescript
import { test, expect } from '@playwright/test'

test('should display page title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Table Mate/)
})
```

### Testing User Interactions
```typescript
test('should click button', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Sign in' })
  await button.click()
  await expect(page).toHaveURL(/auth/)
})
```

### Testing Responsive Design
```typescript
import { devices } from '@playwright/test'

test('mobile view', async ({ browser }) => {
  const context = await browser.newContext({
    ...devices['iPhone 12'],
  })
  const page = await context.newPage()
  await page.goto('/')
  // ... test mobile-specific behavior
  await context.close()
})
```

## Continuous Integration

Tests automatically run on CI with:
- Retry on failure (2 retries)
- Single worker for consistency
- HTML report generation

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Debugging

1. Use `test:debug` command to step through tests
2. Use `page.pause()` to pause execution
3. Use screenshots: `await page.screenshot({ path: 'screenshot.png' })`
4. Check test traces in HTML report

## Best Practices

1. Use semantic locators (`getByRole`, `getByLabel`)
2. Write descriptive test names
3. Keep tests independent (no shared state)
4. Use proper waits (`await expect()`)
5. Test user flows, not implementation details
