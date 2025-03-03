import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class PlanPage extends BasePage {
  readonly addItemButton: Locator;
  readonly itemsList: Locator;
  readonly calculationSummary: Locator;
  
  constructor(page: Page) {
    super(page);
    this.addItemButton = page.locator('button:has-text("Add Item")');
    this.itemsList = page.locator('.plan-items-list');
    this.calculationSummary = page.locator('.calculation-summary');
  }
  
  async goto() {
    await this.page.goto('/plan');
    await this.waitForPageLoad();
  }
  
  async addNewItem(itemData: {
    category: string;
    frequency: string;
    baseRate: number;
    startAge: number;
    endAge?: number;
  }) {
    await this.addItemButton.click();
    
    // Fill the form
    await this.page.locator('select[name="category"]').selectOption(itemData.category);
    await this.page.locator('input[name="frequency"]').fill(itemData.frequency);
    await this.page.locator('input[name="baseRate"]').fill(itemData.baseRate.toString());
    await this.page.locator('input[name="startAge"]').fill(itemData.startAge.toString());
    
    if (itemData.endAge) {
      await this.page.locator('input[name="endAge"]').fill(itemData.endAge.toString());
    }
    
    await this.page.locator('button:has-text("Save")').click();
    await this.page.waitForSelector('.plan-items-list:has-text("' + itemData.category + '")');
  }
  
  async getCalculationSummary() {
    const annual = await this.page.locator('.annual-cost').textContent() || '0';
    const lifetime = await this.page.locator('.lifetime-cost').textContent() || '0';
    
    return {
      annual: parseFloat(annual.replace(/[^0-9.]/g, '')),
      lifetime: parseFloat(lifetime.replace(/[^0-9.]/g, ''))
    };
  }
}
