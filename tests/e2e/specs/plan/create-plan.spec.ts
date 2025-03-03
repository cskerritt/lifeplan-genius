import { test, expect } from '../../fixtures/auth.fixture';
import { PlanPage } from '../../pages/plan-page';

test.describe('Plan creation', () => {
  test('should allow creating a new plan item', async ({ authenticatedPage }) => {
    const planPage = new PlanPage(authenticatedPage);
    await planPage.goto();
    
    await planPage.addNewItem({
      category: 'Medical',
      frequency: 'monthly',
      baseRate: 100,
      startAge: 30,
      endAge: 80
    });
    
    // Verify item was added
    await expect(planPage.itemsList).toContainText('Medical');
    
    // Verify calculations
    const summary = await planPage.getCalculationSummary();
    expect(summary.annual).toBeCloseTo(1200, 0); // $100 * 12 months
    expect(summary.lifetime).toBeCloseTo(60000, 0); // $1200 * 50 years
  });
  
  test('should calculate one-time costs correctly', async ({ authenticatedPage }) => {
    const planPage = new PlanPage(authenticatedPage);
    await planPage.goto();
    
    await planPage.addNewItem({
      category: 'Equipment',
      frequency: 'one-time',
      baseRate: 500,
      startAge: 30
    });
    
    // Verify calculations for one-time item
    const summary = await planPage.getCalculationSummary();
    expect(summary.annual).toBe(0); // One-time items have no annual cost
    expect(summary.lifetime).toBe(500); // Just the base rate
  });
});
