import { Page, Locator, expect } from '@playwright/test';
import { logger } from '../utils/logger';

export class BasePage {
  readonly page: Page;
  readonly heading: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1');
    logger.info(`Initialized ${this.constructor.name}`);
  }
  
  async waitForPageLoad() {
    logger.debug(`Waiting for page to load: ${await this.page.url()}`);
    await this.page.waitForLoadState('networkidle');
    logger.debug('Page loaded');
  }
  
  async getPageTitle(): Promise<string> {
    const title = await this.page.title();
    logger.debug(`Page title: ${title}`);
    return title;
  }
  
  async expectHeading(text: string) {
    logger.debug(`Expecting heading to contain: ${text}`);
    await expect(this.heading).toContainText(text);
  }
  
  async takeScreenshot(name: string) {
    logger.info(`Taking screenshot: ${name}`);
    await this.page.screenshot({ path: `./screenshots/${name}.png` });
  }
  
  async navigate(url: string) {
    logger.info(`Navigating to: ${url}`);
    await this.page.goto(url);
    await this.waitForPageLoad();
  }
  
  async clickElement(selector: string, options?: { timeout?: number }) {
    logger.debug(`Clicking element: ${selector}`);
    await this.page.click(selector, options);
  }
  
  async fillInput(selector: string, value: string) {
    logger.debug(`Filling input ${selector} with value: ${value}`);
    await this.page.fill(selector, value);
  }
  
  async isElementVisible(selector: string): Promise<boolean> {
    const isVisible = await this.page.isVisible(selector);
    logger.debug(`Element ${selector} visibility: ${isVisible}`);
    return isVisible;
  }
}
