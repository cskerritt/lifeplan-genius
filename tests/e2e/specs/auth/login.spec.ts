import { test, expect } from '../../fixtures/auth.fixture';

test.describe('Login functionality', () => {
  test('should allow a user to login with valid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password');
    
    // Verify redirect to dashboard
    await expect(loginPage.page).toHaveURL(/\/dashboard/);
  });
  
  test('should show error with invalid credentials', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.emailInput.fill('wrong@example.com');
    await loginPage.passwordInput.fill('wrongpassword');
    await loginPage.loginButton.click();
    
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Invalid credentials');
  });
});
