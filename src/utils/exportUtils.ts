import { Document, Paragraph, Table, TableRow, TableCell, WidthType } from 'docx';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CategoryTotal, CareItem } from '@/types/lifecare';

interface ExportData {
  planId: string;
  evalueeName: string;
  items: CareItem[];
  categoryTotals: CategoryTotal[];
  grandTotal: number;
  lifetimeTotal: number;
}

export const exportToWord = async (data: ExportData) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `Life Care Plan for ${data.evalueeName}`,
          heading: 'Heading1'
        }),
        new Paragraph({ text: '' }),
        createItemsTable(data.items),
        new Paragraph({ text: '' }),
        createTotalsTable(data.categoryTotals, data.grandTotal, data.lifetimeTotal)
      ]
    }]
  });

  // Generate blob from document
  const buffer = await doc.save(); // This returns a Promise<Uint8Array>
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
  
  // Use file-saver to download the file
  saveAs(blob, `${data.evalueeName}_LifeCarePlan.docx`);
};

export const exportToExcel = (data: ExportData) => {
  const itemsWorksheet = XLSX.utils.json_to_sheet(data.items.map(item => ({
    Category: item.category,
    Service: item.service,
    'CPT Code': item.cptCode,
    Frequency: item.frequency,
    'Cost Per Unit': item.costPerUnit,
    'Annual Cost': item.annualCost,
    'Low Cost': item.costRange.low,
    'Average Cost': item.costRange.average,
    'High Cost': item.costRange.high
  })));

  const totalsWorksheet = XLSX.utils.json_to_sheet(data.categoryTotals.map(total => ({
    Category: total.category,
    'Annual Total': total.total,
    'Low Cost': total.costRange.low,
    'Average Cost': total.costRange.average,
    'High Cost': total.costRange.high
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, itemsWorksheet, 'Items');
  XLSX.utils.book_append_sheet(wb, totalsWorksheet, 'Category Totals');

  XLSX.writeFile(wb, `${data.evalueeName}_LifeCarePlan.xlsx`);
};

const createItemsTable = (items: CareItem[]) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          'Category',
          'Service',
          'CPT Code',
          'Frequency',
          'Annual Cost',
          'Cost Range'
        ].map(header => 
          new TableCell({
            children: [new Paragraph({ text: header })],
            width: { size: 100 / 6, type: WidthType.PERCENTAGE }
          })
        )
      }),
      ...items.map(item => 
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: item.category })] }),
            new TableCell({ children: [new Paragraph({ text: item.service })] }),
            new TableCell({ children: [new Paragraph({ text: item.cptCode })] }),
            new TableCell({ children: [new Paragraph({ text: item.frequency })] }),
            new TableCell({ children: [new Paragraph({ text: `$${item.annualCost.toFixed(2)}` })] }),
            new TableCell({ 
              children: [
                new Paragraph({ 
                  text: `Low: $${item.costRange.low.toFixed(2)}\n` +
                        `Avg: $${item.costRange.average.toFixed(2)}\n` +
                        `High: $${item.costRange.high.toFixed(2)}` 
                })
              ]
            })
          ]
        })
      )
    ]
  });
};

const createTotalsTable = (categoryTotals: CategoryTotal[], grandTotal: number, lifetimeTotal: number) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          'Category',
          'Annual Total',
          'Cost Range'
        ].map(header => 
          new TableCell({
            children: [new Paragraph({ text: header })],
            width: { size: 100 / 3, type: WidthType.PERCENTAGE }
          })
        )
      }),
      ...categoryTotals.map(total => 
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: total.category })] }),
            new TableCell({ children: [new Paragraph({ text: `$${total.total.toFixed(2)}` })] }),
            new TableCell({ 
              children: [
                new Paragraph({ 
                  text: `Low: $${total.costRange.low.toFixed(2)}\n` +
                        `Avg: $${total.costRange.average.toFixed(2)}\n` +
                        `High: $${total.costRange.high.toFixed(2)}` 
                })
              ]
            })
          ]
        })
      ),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'Grand Total (Annual)' })] }),
          new TableCell({ children: [new Paragraph({ text: `$${grandTotal.toFixed(2)}` })] }),
          new TableCell({ children: [new Paragraph({ text: '' })] })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: 'Lifetime Total' })] }),
          new TableCell({ children: [new Paragraph({ text: `$${lifetimeTotal.toFixed(2)}` })] }),
          new TableCell({ children: [new Paragraph({ text: '' })] })
        ]
      })
    ]
  });
};
