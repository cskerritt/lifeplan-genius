
import { Document, Paragraph, Table, TableRow, TableCell, WidthType, Packer, AlignmentType, BorderStyle } from 'docx';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CategoryTotal, CareItem } from '@/types/lifecare';

interface ExportData {
  planId: string;
  evalueeName: string;
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
  lifetimeLow: number;
  lifetimeHigh: number;
  lifeExpectancy?: string;
}

export const exportToWord = async (data: ExportData) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `LIFETIME PROJECTED COSTS: ${data.evalueeName.toUpperCase()}`,
          heading: 'Heading1',
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createLifetimeProjectedCostsTable(data),
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${data.evalueeName}_LifeCarePlan.docx`);
};

export const exportToExcel = (data: ExportData) => {
  // Create a worksheet that matches the lifetime projected costs format
  const lifetimeWorksheet = XLSX.utils.aoa_to_sheet([
    [`LIFETIME PROJECTED COSTS: ${data.evalueeName.toUpperCase()}`],
    [],
    ['Projected Care:', 'Duration Required (Years):', 'Annual Cost:', 'Annual Cost x Duration Required:', 'Total One-Time Cost:'],
    ...data.categoryTotals.map(total => [
      total.category,
      data.lifeExpectancy || '0',
      `$${total.total.toFixed(2)}`,
      `$${(total.total * parseFloat(data.lifeExpectancy || '0')).toFixed(2)}`,
      '$0.00' // Add actual one-time costs if available
    ]),
    [],
    ['', '', '', 'LIFETIME TOTAL:', `$${data.lifetimeLow.toFixed(2)} - $${data.lifetimeHigh.toFixed(2)}`]
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, lifetimeWorksheet, 'Lifetime Projected Costs');
  XLSX.writeFile(wb, `${data.evalueeName}_LifeCarePlan.xlsx`);
};

const createLifetimeProjectedCostsTable = (data: ExportData) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
    },
    rows: [
      // Header row
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
      }),
      // Category rows
      ...data.categoryTotals.map((total, index) => 
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
              children: [new Paragraph('$0.00')], // Add actual one-time costs if available
              shading: { fill: index % 2 === 0 ? 'DBE5F1' : 'FFFFFF' }
            })
          ]
        })
      ),
      // Total row
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
      })
    ]
  });
};
