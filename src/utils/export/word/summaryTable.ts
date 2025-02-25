
import { TableRow, Table, WidthType } from 'docx';
import { ExportData } from '../types';
import { createTableBorders, createStyledCell } from './tableUtils';
import { calculateCategoryOneTimeTotal, calculateCategoryTotal } from '../utils';

export const createSummaryHeaderRow = () => 
  new TableRow({
    tableHeader: true,
    children: [
      createStyledCell('Projected Care:', 30, 'DBE5F1'),
      createStyledCell('Duration Required (Years):', 15, 'DBE5F1'),
      createStyledCell('Annual Cost:', 20, 'DBE5F1'),
      createStyledCell('Annual Cost x Duration Required:', 20, 'DBE5F1'),
      createStyledCell('Total One-Time Cost:', 15, 'DBE5F1')
    ]
  });

export const createSummaryCategoryRows = (data: ExportData) =>
  data.categoryTotals.map((total, index) => {
    console.log('Processing category:', total.category); // Debug log

    const duration = parseFloat(data.lifeExpectancy || '0');
    const annualCost = calculateCategoryTotal(
      data.items.filter(item => item.category === total.category)
    );
    const oneTimeTotal = calculateCategoryOneTimeTotal(
      data.items.filter(item => item.category === total.category)
    );
    
    console.log('Category calculations:', {
      category: total.category,
      duration,
      annualCost,
      lifetimeCost: annualCost * duration,
      oneTimeTotal
    }); // Debug log

    return new TableRow({
      children: [
        createStyledCell(total.category, 30, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(duration.toString(), 15, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(`$${annualCost.toFixed(2)}`, 20, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(
          `$${(annualCost * duration).toFixed(2)}`,
          20,
          index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'
        ),
        createStyledCell(`$${oneTimeTotal.toFixed(2)}`, 15, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF')
      ]
    });
  });

export const createSummaryTotalRow = (data: ExportData) => {
  console.log('Creating summary total row with data:', {
    lifeExpectancy: data.lifeExpectancy,
    lifetimeLow: data.lifetimeLow,
    lifetimeHigh: data.lifetimeHigh
  }); // Debug log

  return new TableRow({
    children: [
      createStyledCell('', 65, 'FFFFFF', { columnSpan: 3 }),
      createStyledCell('LIFETIME TOTAL:', 20, 'DBE5F1'),
      createStyledCell(
        `$${data.lifetimeLow.toFixed(2)} - $${data.lifetimeHigh.toFixed(2)}`,
        15,
        'DBE5F1'
      )
    ]
  });
};

export const createLifetimeProjectedCostsTable = (data: ExportData) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      createSummaryHeaderRow(),
      ...createSummaryCategoryRows(data),
      createSummaryTotalRow(data)
    ]
  });
};
