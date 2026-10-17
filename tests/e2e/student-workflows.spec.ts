import { test, expect } from '@playwright/test';

test.describe('GradeFlow 3.0 Student Academic Workflows', () => {

  test('1. Landing page loads with brand identity and navigates to catalogue', async ({ page }) => {
    await page.goto('/');

    // Check brand title and hero text
    await expect(page.locator('text=GradeFlow').first()).toBeVisible();
    await expect(page.locator('text=Clearly Calculated.')).toBeVisible();

    // Verify presence of CTA link to courses
    const browseBtn = page.getByRole('link', { name: /Browse Course Catalogue/i });
    await expect(browseBtn).toBeVisible();

    // Click and verify navigation to /courses
    await browseBtn.click();
    await page.waitForURL(/\/courses/);
    await expect(page).toHaveURL(/\/courses/);
  });

  test('2. Auth guard redirects unauthenticated attempts to login', async ({ page }) => {
    // Attempt to access protected dashboard directly without session
    await page.goto('/dashboard');

    // Expect redirect to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Sign In to GradeFlow/i })).toBeVisible();

    // Verify instant demo access button is provided
    await expect(page.getByRole('button', { name: /Explore with Demo Student Account/i })).toBeVisible();
  });

  test('3. Official Course Catalogue enforces strict 3.0 credit hours formatting', async ({ page }) => {
    await page.goto('/courses');

    // Heading verification
    await expect(page.getByRole('heading', { name: /Official Course Catalogue/i })).toBeVisible();

    // Verify course table rows are present
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Verify credit hours format strictly follows 1-decimal format (e.g. 3.0)
    const creditCells = page.locator('table tbody tr td:last-child');
    const firstCredit = await creditCells.first().innerText();
    expect(firstCredit.trim()).toMatch(/^\d+\.\d$/);
    expect(firstCredit.trim()).toBe('3.0');

    // Verify core course code
    await expect(page.locator('text=DIT111').first()).toBeVisible();
  });

  test('4. Target CGPA simulator accurately recalculates required GPA and scenario metrics', async ({ context, page }) => {
    // Authenticate with demo session
    await context.addCookies([
      { name: 'gf_demo_session', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/simulator');

    // Verify header and target calculator card
    await expect(page.getByRole('heading', { name: /Grade Simulator & Target Calculator/i })).toBeVisible();
    await expect(page.locator('text=Target CGPA Projection')).toBeVisible();

    // Target calculation card should display required GPA with 2 decimals
    await expect(page.locator('text=Required GPA to Reach Target')).toBeVisible();

    // Initial state: 15.0 credits earned, CGPA 3.35, Target 3.50, Remaining 15.0 credits
    // Formula: (3.50 * 30.0 - 3.35 * 15.0) / 15.0 = (105 - 50.25) / 15.0 = 54.75 / 15 = 3.65
    await expect(page.locator('text=3.65').first()).toBeVisible();

    // Modify target CGPA input to 3.40
    // Formula for target 3.40: (3.40 * 30.0 - 3.35 * 15.0) / 15.0 = (102 - 50.25) / 15.0 = 51.75 / 15 = 3.45
    const targetInput = page.locator('input[type="number"]').nth(3);
    await targetInput.fill('3.40');

    await expect(page.locator('text=3.45').first()).toBeVisible();

    // Verify What-If hypothetical course builder is present
    await expect(page.locator('text=What-If Course Outcome Scenario')).toBeVisible();
    await expect(page.locator('input[value="DIT211"]')).toBeVisible();
  });

  test('5. Unofficial Transcript renders candidate dossier and jsPDF download trigger', async ({ context, page }) => {
    // Authenticate with demo session
    await context.addCookies([
      { name: 'gf_demo_session', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/transcript');

    // Dossier header checks
    await expect(page.getByRole('heading', { name: /Academic Transcript Preview/i })).toBeVisible();
    await expect(page.locator('text=Institute of Public Administration and Management').first()).toBeVisible();

    // Classification / Standing badge
    await expect(page.locator('text=Cumulative Standing')).toBeVisible();

    // Verify jsPDF download button is present and active
    const downloadBtn = page.getByRole('button', { name: /Download PDF Transcript/i });
    await expect(downloadBtn).toBeVisible();
    await expect(downloadBtn).toBeEnabled();

    // Verify course history rows
    await expect(page.locator('text=DIT111').first()).toBeVisible();
    await expect(page.locator('text=DIT121').first()).toBeVisible();
  });

  test('6. Results Entry calculates real-time preview and honors score precedence & rounding', async ({ context, page }) => {
    // Authenticate with demo session
    await context.addCookies([
      { name: 'gf_demo_session', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/results');

    // Page title and tabs
    await expect(page.getByRole('heading', { name: /Record Course Results/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /CA \(30%\) \+ Exam \(70%\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Direct Score \(0–100\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Letter Grade/i })).toBeVisible();

    // Live calculation preview card
    await expect(page.locator('text=Live Grade Engine')).toBeVisible();

    // Switch to Direct Score tab
    const directScoreTab = page.getByRole('button', { name: /Direct Score \(0–100\)/i });
    await directScoreTab.click();

    // Test round-half-up: 69.50 rounds up to 70 -> Grade A (4.00)
    const scoreInput = page.locator('input[type="number"]');
    await scoreInput.fill('69.5');
    await expect(page.locator('text=70').first()).toBeVisible();

    // Test score: 69.49 rounds to 69 -> Grade B+ (3.75)
    await scoreInput.fill('69.4');
    await expect(page.locator('text=69').first()).toBeVisible();
    await expect(page.locator('text=B+').first()).toBeVisible();

    // Switch to Letter Grade tab
    const letterTab = page.getByRole('button', { name: /Letter Grade/i });
    await letterTab.click();

    // Select 'B' from dropdown -> Grade Point 3.25, Quality Points 9.75
    const letterSelect = page.locator('select').nth(2);
    await letterSelect.selectOption('B');
    await expect(page.locator('text=3.25').first()).toBeVisible();
    await expect(page.locator('text=9.75').first()).toBeVisible();
  });

});
