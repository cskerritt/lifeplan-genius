import { test, expect } from '@playwright/test';
import { logger, LogLevel } from '../../utils/logger';

/**
 * This test file demonstrates how to use the logger in tests
 * It shows different log levels and how they appear in the console
 */
test.describe('Logger demonstration', () => {
  test.beforeAll(() => {
    // Set log level to DEBUG to show all logs
    logger.setLogLevel(LogLevel.DEBUG);
    logger.info('Logger initialized for demonstration');
  });

  test('should demonstrate different log levels', async ({ page }) => {
    logger.debug('This is a debug message - only visible with --debug flag');
    logger.info('This is an info message - visible with --verbose or --debug flag');
    logger.warn('This is a warning message - always visible');
    logger.error('This is an error message - always visible');
    
    // This test doesn't actually test anything, it's just for demonstration
    expect(true).toBeTruthy();
  });

  test('should log page navigation', async ({ page }) => {
    logger.info('Navigating to example.com');
    await page.goto('https://example.com');
    
    logger.debug('Waiting for page to load');
    await page.waitForLoadState('networkidle');
    
    const title = await page.title();
    logger.info(`Page title: ${title}`);
    
    expect(title).toContain('Example');
  });

  test('should log element interactions', async ({ page }) => {
    await page.goto('https://example.com');
    
    logger.debug('Checking if heading exists');
    const heading = page.locator('h1');
    
    logger.debug('Getting heading text');
    const headingText = await heading.textContent();
    logger.info(`Heading text: ${headingText}`);
    
    expect(headingText).toContain('Example');
  });
});
