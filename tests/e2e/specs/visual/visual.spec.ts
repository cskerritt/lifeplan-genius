import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { PlanPage } from '../../pages/plan-page';

test.describe('Visual regression tests', () => {
  test('login page should match snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Compare screenshot with baseline
    await expect(page).toHaveScreenshot('login-page.png');
  });
  
  test('plan page should match snapshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password');
    
    const planPage = new PlanPage(page);
    await planPage.goto();
    
    // Compare screenshot with baseline
    await expect(page).toHaveScreenshot('plan-page.png');
  });
});
