/**
 * Test utilities for Playwright tests
 * This file contains common functions that can be reused across tests
 */

import { Page } from '@playwright/test';

/**
 * Wait for network requests to complete
 * @param page Playwright page object
 * @param timeout Timeout in milliseconds
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for a specific amount of time
 * @param ms Time to wait in milliseconds
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a random email address for testing
 * @returns Random email address
 */
export function getRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `test-${randomString}@example.com`;
}

/**
 * Get a random string for testing
 * @param length Length of the random string
 * @returns Random string
 */
export function getRandomString(length = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Format currency for comparison
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Parse currency string to number
 * @param currencyString Currency string to parse
 * @returns Parsed number
 */
export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/[^0-9.-]+/g, ''));
}

/**
 * Check if an element is visible
 * @param page Playwright page object
 * @param selector CSS selector for the element
 * @returns True if the element is visible, false otherwise
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible();
  } catch (error) {
    return false;
  }
}

/**
 * Fill a form with the given data
 * @param page Playwright page object
 * @param formData Object with form field selectors as keys and values to fill
 */
export async function fillForm(page: Page, formData: Record<string, string | number>): Promise<void> {
  for (const [selector, value] of Object.entries(formData)) {
    await page.fill(selector, String(value));
  }
}

/**
 * Get text content of an element
 * @param page Playwright page object
 * @param selector CSS selector for the element
 * @returns Text content of the element
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  return (await page.locator(selector).textContent()) || '';
}
