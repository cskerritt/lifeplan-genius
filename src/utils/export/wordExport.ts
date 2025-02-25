
import { Document, Paragraph, Table, TableRow, TableCell, WidthType, Packer, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { ExportData } from './types';
import { groupItemsByCategory, calculateCategoryTotal, calculateOneTimeTotal } from './utils';
import { CareItem } from '@/types/lifecare';

export const exportToWord = async (data: ExportData) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `LIFETIME PROJECTED COSTS: ${data.evalueeName.toUpperCase()}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createLifetimeProjectedCostsTable(data),
        ...createDetailedCategoryTables(data)
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.evalueeName}_LifeCarePlan.docx`);
};

const createLifetimeProjectedCostsTable = (data: ExportData) => {
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

const createTableBorders = () => ({
  top: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
});

const createSummaryHeaderRow = () => 
  new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Projected Care:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Duration Required (Years):')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Annual Cost:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 20, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Annual Cost x Duration Required:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Total One-Time Cost:')],
        shading: { fill: 'DBE5F1' }
      })
    ]
  });

const createSummaryCategoryRows = (data: ExportData) =>
  data.categoryTotals.map((total, index) => 
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph(total.category)],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(data.lifeExpectancy || '0')],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(`$${total.total.toFixed(2)}`)],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(`$${(total.total * parseFloat(data.lifeExpectancy || '0')).toFixed(2)}`)],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph('$0.00')],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        })
      ]
    })
  );

const createSummaryTotalRow = (data: ExportData) =>
  new TableRow({
    children: [
      new TableCell({
        columnSpan: 3,
        children: [new Paragraph('')],
      }),
      new TableCell({
        children: [new Paragraph('LIFETIME TOTAL:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        children: [new Paragraph(`$${data.lifetimeLow.toFixed(2)} - $${data.lifetimeHigh.toFixed(2)}`)],
        shading: { fill: 'DBE5F1' }
      })
    ]
  });

const createDetailedCategoryTables = (data: ExportData) => {
  const tables: (Paragraph | Table)[] = [];
  const groupedItems = groupItemsByCategory(data.items);

  Object.entries(groupedItems).forEach(([category, items]) => {
    tables.push(
      new Paragraph({
        text: '',
        spacing: { before: 500, after: 200 }
      }),
      new Paragraph({
        text: category.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
      }),
      createDetailedTable(items)
    );

    if (items.some(item => item.notes)) {
      tables.push(
        new Paragraph({
          text: 'Notes/Rationale:',
          spacing: { before: 200, after: 100 }
        }),
        ...items
          .filter(item => item.notes)
          .map(item => 
            new Paragraph({
              text: item.notes || '',
              spacing: { before: 100, after: 100 }
            })
          )
      );
    }
  });

  return tables;
};

const createDetailedTable = (items: CareItem[]) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: createTableBorders(),
    rows: [
      createDetailedHeaderRow(),
      ...createDetailedItemRows(items),
      createDetailedTotalRow(items)
    ]
  });

const createDetailedHeaderRow = () =>
  new TableRow({
    tableHeader: true,
    children: [
      new TableCell({ 
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Description:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Age Initiated:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Through Age:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Cost:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Frequency:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        children: [new Paragraph('Annual Cost:')],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        children: [new Paragraph('One-Time Cost:')],
        shading: { fill: 'DBE5F1' }
      })
    ]
  });

const createDetailedItemRows = (items: CareItem[]) =>
  items.map((item, index) => 
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph(item.service)],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(item.startAge?.toString() || '')],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(item.endAge?.toString() || '')],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [
            new Paragraph(`$${item.costRange.low.toFixed(2)}`),
            new Paragraph('-'),
            new Paragraph(`$${item.costRange.high.toFixed(2)}`)
          ],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(item.frequency)],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(`$${item.annualCost.toFixed(2)}`)],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        }),
        new TableCell({
          children: [new Paragraph(item.isOneTime ? `$${item.costRange.average.toFixed(2)}` : '$0.00')],
          shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
        })
      ]
    })
  );

const createDetailedTotalRow = (items: CareItem[]) =>
  new TableRow({
    children: [
      new TableCell({
        columnSpan: 5,
        children: [new Paragraph({
          text: 'Total:',
          alignment: AlignmentType.RIGHT
        })]
      }),
      new TableCell({
        children: [new Paragraph(`$${calculateCategoryTotal(items).toFixed(2)}`)],
        shading: { fill: 'DBE5F1' }
      }),
      new TableCell({
        children: [new Paragraph(`$${calculateOneTimeTotal(items).toFixed(2)}`)],
        shading: { fill: 'DBE5F1' }
      })
    ]
  });
