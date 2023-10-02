import { test, expect } from '@playwright/test';
import process from 'process';
import { SbPage } from './util';

const storybookUrl = process.env.STORYBOOK_URL || 'http://localhost:8001';

test.describe('navigating', () => {
  test('a URL with a partial storyId will redirect to the first story', async ({ page }) => {
    // this is purposefully not using the SbPage class, and the URL is a partial (it does not contain the full storyId)
    await page.goto(`${storybookUrl}?path=/story/example-button`);

    const sbPage = new SbPage(page);

    await sbPage.waitUntilLoaded();

    await expect(sbPage.page.waitForURL('?path=/docs/example-button--docs')).resolves.toBeTruthy();
  });
});
