
import { TableRow, Table, WidthType } from 'docx';
import { ExportData } from '../types';
import { createTableBorders, createStyledCell } from './tableUtils';

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
  data.categoryTotals.map((total, index) => 
    new TableRow({
      children: [
        createStyledCell(total.category, 30, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(data.lifeExpectancy || '0', 15, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(`$${total.total.toFixed(2)}`, 20, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(
          `$${(total.total * parseFloat(data.lifeExpectancy || '0')).toFixed(2)}`,
          20,
          index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'
        ),
        createStyledCell('$0.00', 15, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF')
      ]
    })
  );

export const createSummaryTotalRow = (data: ExportData) =>
  new TableRow({
    children: [
      createStyledCell('', 65, 'FFFFFF', { columnSpan: 3 }),
      createStyledCell('LIFETIME TOTAL:', 20, 'DBE5F1'),
      createStyledCell(`$${data.lifetimeLow.toFixed(2)} - $${data.lifetimeHigh.toFixed(2)}`, 15, 'DBE5F1')
    ]
  });

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
