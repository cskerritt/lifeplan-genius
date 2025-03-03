import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login-page';

type AuthFixture = {
  loginPage: LoginPage;
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password');
    await use(page);
  }
});

export { expect } from '@playwright/test';
