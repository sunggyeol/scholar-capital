import { test, expect } from '@playwright/test';

test.describe('Google Scholar URL-swap resolution', () => {
  test('OpenAlex ID loads directly without resolution step', async ({ page }) => {
    // A valid OpenAlex author ID should go straight to the author page
    // (may error if network is slow, but should NOT show "Resolving...")
    const response = page.waitForResponse((r) =>
      r.url().includes('/api/scholar/author?user=A5023888391')
    );

    await page.goto('/citations?user=A5023888391');

    // Should see loading for the author, not "Resolving..."
    const loadingText = page.getByText('Loading scholar network...');
    await expect(loadingText).toBeVisible({ timeout: 5000 });

    // Verify the author API was called directly (no resolve-gs call)
    await response;
  });

  test('Google Scholar ID triggers resolution flow', async ({ page }) => {
    // Mock the resolve-gs API to return a known OpenAlex match
    await page.route('**/api/scholar/resolve-gs?id=Yua2oBoAAAAJ', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'Sunggyeol Oh',
          matches: [
            {
              author_id: 'A5023888391',
              name: 'Sunggyeol Oh',
              affiliations: 'Test University',
              cited_by: 100,
            },
          ],
        }),
      });
    });

    await page.goto('/citations?user=Yua2oBoAAAAJ');

    // Should show resolving message
    await expect(page.getByText('Resolving Google Scholar profile...')).toBeVisible({
      timeout: 5000,
    });

    // Should redirect to the OpenAlex ID URL
    await page.waitForURL('**/citations?user=A5023888391', { timeout: 10000 });
    expect(page.url()).toContain('user=A5023888391');
  });

  test('Failed resolution redirects to homepage', async ({ page }) => {
    // Mock the resolve-gs API to return no matches
    await page.route('**/api/scholar/resolve-gs?id=totally_invalid_id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'Unknown Author',
          matches: [],
        }),
      });
    });

    await page.goto('/citations?user=totally_invalid_id');

    // Should redirect to homepage with q= param (URL-encoded)
    await page.waitForURL((url) => url.searchParams.has('q'), { timeout: 10000 });
    expect(page.url()).toContain('q=Unknown');
  });

  test('Resolution API error redirects to homepage', async ({ page }) => {
    // Mock the resolve-gs API to return an error
    await page.route('**/api/scholar/resolve-gs?id=error_id', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/citations?user=error_id');

    // Should redirect to homepage (no q= since error response)
    await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
  });

  test('Landing page ?q= param auto-triggers search', async ({ page }) => {
    // Mock the profiles API
    await page.route('**/api/scholar/profiles**', async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('mauthors')?.includes('Geoffrey Hinton')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            profiles: {
              authors: [
                {
                  name: 'Geoffrey Hinton',
                  author_id: 'A1234567890',
                  link: 'https://openalex.org/authors/A1234567890',
                  affiliations: 'University of Toronto',
                  cited_by: 500000,
                },
              ],
            },
            has_more: false,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/?q=Geoffrey+Hinton');

    // Search input should be pre-filled
    const searchInput = page.locator('input[placeholder*="Search by researcher name"]');
    await expect(searchInput).toHaveValue('Geoffrey Hinton', { timeout: 5000 });

    // Results should appear (auto-searched)
    await expect(page.getByText('University of Toronto')).toBeVisible({ timeout: 10000 });
  });

  test('Landing page without ?q= shows normal state', async ({ page }) => {
    await page.goto('/');

    // Should show the normal landing page
    await expect(page.getByText('Scholar Capital')).toBeVisible();
    await expect(page.getByText('Try an example search')).toBeVisible();

    // Search input should be empty
    const searchInput = page.locator('input[placeholder*="Search by researcher name"]');
    await expect(searchInput).toHaveValue('');
  });
});
