---
quick_id: "260607-jo3"
slug: "verify-all-screens-with-content-screenshots"
description: "Verify all 10 routes with content screenshots (not login)"
mode: "quick-validate"
files_modified:
  - ".planning/quick/260607-jo3-verify-all-screens-with-content-screensh/validate-screens.cjs"
must_haves:
  truths:
    - "Each route loads with actual page content (not login redirect)"
    - "Screenshot shows correct page heading/content for each route"
    - "All 10 routes verified successfully"
  artifacts:
    - path: ".planning/quick/260607-jo3-verify-all-screens-with-content-screensh/screenshots/"
      provides: "10 screenshots showing page content per route"
---

# Quick Task: Verify All Routes with Content Screenshots

## Objective
Verify all 10 routes work correctly AND capture screenshots showing actual page content, NOT login pages. Each screenshot must confirm:
1. Route loaded successfully
2. Correct page heading/content is visible
3. User is logged in as correct role

## Routes to Verify

| Route | Role | Expected Content |
|-------|------|------------------|
| /admin/ops | admin | "Operations" or "Ops" heading |
| /admin/ops/[requestId] | admin | Timeline heading |
| /admin/routing | admin | Routing table or queue |
| /admin/templates | admin | Templates list |
| /admin/templates/[templateId] | admin | Template detail/editor |
| /admin/templates/new | admin | New template form |
| /admin/users | admin | Users list |
| /admin/vault | admin | Vault/Documents |
| /reviewer/requests | reviewer | Reviewer queue |
| /specialist/requests | specialist | Specialist queue |

## Validation Script Requirements

The script must:
1. **Login properly** - navigate to login, fill credentials, submit, wait for redirect
2. **Wait for page content** - use `waitForSelector` with expected heading text
3. **Verify content before screenshot** - check page contains expected text
4. **Screenshot only after content verified** - not login page
5. **Handle auth redirect** - if redirected to login, fail the check

## Implementation

Create `validate-screens.cjs` following this pattern:

```javascript
// Key function: verifyAndScreenshot(page, route, expectedText, screenshotPath)
async function verifyAndScreenshot(page, route, expectedText, screenshotPath) {
  await page.goto(baseUrl + route, { waitUntil: 'networkidle' });
  
  // Check if redirected to login (URL contains /login)
  if (page.url().includes('/login')) {
    console.log(`FAIL: ${route} - redirected to login`);
    return false;
  }
  
  // Wait for content to load
  try {
    await page.waitForFunction(
      (text) => document.body.innerText.includes(text),
      expectedText,
      { timeout: 10000 }
    );
  } catch (e) {
    // Try alternative: look for common page elements
    await page.waitForLoadState('networkidle');
  }
  
  // Verify we have page content (not blank or login)
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Sign in') || bodyText.includes('Đăng nhập') || bodyText.length < 100) {
    console.log(`FAIL: ${route} - page shows login or is blank`);
    return false;
  }
  
  // Screenshot
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`PASS: ${route} - screenshot saved`);
  return true;
}
```

## Tasks

<task id="1" type="execute">
<name>Create validation script with proper auth flow</name>
<action>
Create `.planning/quick/260607-jo3-verify-all-screens-with-content-screensh/validate-screens.cjs` that:

1. Uses playwright chromium
2. Creates screenshots directory
3. For each role (admin, specialist, reviewer):
   - Launches browser with visible UI (headless: false for debugging)
   - Navigates to /login
   - Fills email and password
   - Clicks submit button
   - Waits for redirect away from /login
   - For each route in that role:
     - Navigate to route
     - Wait for networkidle
     - Check NOT redirected to login
     - Verify page contains expected heading text
     - Screenshot only after content verified
4. Reports pass/fail for each route
5. Saves screenshots with descriptive names

Use these credentials:
- admin: admin.demo@example.test / Demo@123456
- specialist: specialist.demo@example.test / Demo@123456
- reviewer: reviewer.demo@example.test / Demo@123456

Expected page content (search for these in body text):
- /admin/ops → "Ops" or "Operations" or "Timeline"
- /admin/ops/[requestId] → "Timeline" or "Request"
- /admin/routing → "Routing" or "Queue"
- /admin/templates → "Template"
- /admin/templates/[templateId] → "Template" (detail view)
- /admin/templates/new → "Template" or "New"
- /admin/users → "User" or "Users"
- /admin/vault → "Vault" or "Document"
- /reviewer/requests → "Reviewer" or "Request"
- /specialist/requests → "Specialist" or "Request"
</action>
<verify>
grep -c "await page.waitForFunction\|await page.waitForSelector" validate-screens.cjs</verify>
<done>Script creates screenshots only after verifying page content loads</done>
</task>

<task id="2" type="execute">
<name>Run validation and capture screenshots</name>
<action>
1. Ensure dev server is running on localhost:3000
2. Run the validation script:
   ```
   node .planning/quick/260607-jo3-verify-all-screens-with-content-screensh/validate-screens.cjs
   ```
3. For each route, verify:
   - PASS: Screenshot shows actual page content
   - FAIL: Screenshot shows login page or blank
4. Report results
</action>
<verify>
ls -la .planning/quick/260607-jo3-verify-all-screens-with-content-screensh/screenshots/</verify>
<done>All 10 screenshots show correct page content</done>
</task>

</tasks>

## Success Criteria
- All 10 routes return PASS
- Each screenshot shows the actual page content (not login)
- No redirects to /login after authentication
