import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login-page';
import { PlanPage } from '../../pages/plan-page';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility tests', () => {
  test('login page should be accessible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('plan page should be accessible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password');
    
    const planPage = new PlanPage(page);
    await planPage.goto();
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('should check specific accessibility rules', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Test only specific accessibility rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast', 'label', 'button-name', 'image-alt'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
