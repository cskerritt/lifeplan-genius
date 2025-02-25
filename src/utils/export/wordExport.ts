
import { Document, Paragraph, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { ExportData } from './types';
import { groupItemsByCategory } from './utils';
import { createLifetimeProjectedCostsTable } from './word/summaryTable';
import { createDetailedTable } from './word/detailedTable';

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
