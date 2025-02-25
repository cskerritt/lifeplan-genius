
import * as XLSX from 'xlsx';
import { ExportData } from './types';

export const exportToExcel = (data: ExportData) => {
  const lifetimeWorksheet = XLSX.utils.aoa_to_sheet([
    [`LIFETIME PROJECTED COSTS: ${data.evalueeName.toUpperCase()}`],
    [],
    ['Projected Care:', 'Duration Required (Years):', 'Annual Cost:', 'Annual Cost x Duration Required:', 'Total One-Time Cost:'],
    ...data.categoryTotals.map(total => [
      total.category,
      data.lifeExpectancy || '0',
      `$${total.total.toFixed(2)}`,
      `$${(total.total * parseFloat(data.lifeExpectancy || '0')).toFixed(2)}`,
      '$0.00'
    ]),
    [],
    ['', '', '', 'LIFETIME TOTAL:', `$${data.lifetimeLow.toFixed(2)} - $${data.lifetimeHigh.toFixed(2)}`]
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, lifetimeWorksheet, 'Lifetime Projected Costs');
  XLSX.writeFile(wb, `${data.evalueeName}_LifeCarePlan.xlsx`);
};
