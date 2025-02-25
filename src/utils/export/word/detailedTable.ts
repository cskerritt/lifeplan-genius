import { TableRow, Table, WidthType, Paragraph, AlignmentType, TableCell } from 'docx';
import { CareItem } from '@/types/lifecare';
import { createTableBorders, createStyledCell } from './tableUtils';
import { calculateCategoryTotal, calculateOneTimeTotal } from '../utils';

export const createDetailedHeaderRow = () =>
  new TableRow({
    tableHeader: true,
    children: [
      createStyledCell('Description:', 25, 'DBE5F1'),
      createStyledCell('Age Initiated:', 10, 'DBE5F1'),
      createStyledCell('Through Age:', 10, 'DBE5F1'),
      createStyledCell('Cost:', 15, 'DBE5F1'),
      createStyledCell('Frequency:', 15, 'DBE5F1'),
      createStyledCell('Annual Cost:', 15, 'DBE5F1'),
      createStyledCell('One-Time Cost:', 10, 'DBE5F1')
    ]
  });

export const createDetailedItemRows = (items: CareItem[]) =>
  items.map((item, index) => 
    new TableRow({
      children: [
        createStyledCell(item.service, 25, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(item.startAge?.toString() || '', 10, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(item.endAge?.toString() || '', 10, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph(`$${item.costRange.low.toFixed(2)}`),
            new Paragraph('-'),
            new Paragraph(`$${item.costRange.high.toFixed(2)}`)
          ],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        createStyledCell(item.frequency, 15, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(`$${item.annualCost.toFixed(2)}`, 15, index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'),
        createStyledCell(
          item.isOneTime ? `$${item.costRange.average.toFixed(2)}` : '$0.00',
          10,
          index % 2 === 0 ? 'DBE5F1' : 'FFFFFF'
        )
      ]
    })
  );

export const createDetailedTotalRow = (items: CareItem[]) => {
  const annualTotal = calculateCategoryTotal(items);
  const oneTimeTotal = calculateOneTimeTotal(items);
  
  return new TableRow({
    children: [
      createStyledCell('Total:', 75, 'FFFFFF', { columnSpan: 5, alignment: 'right' }),
      createStyledCell(`$${annualTotal.toFixed(2)}`, 15, 'DBE5F1'),
      createStyledCell(`$${oneTimeTotal.toFixed(2)}`, 10, 'DBE5F1')
    ]
  });
};

export const createDetailedTable = (items: CareItem[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      createDetailedHeaderRow(),
      ...createDetailedItemRows(items),
      createDetailedTotalRow(items)
    ]
  });
