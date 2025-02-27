import { Document, Paragraph, AlignmentType, HeadingLevel, Table, Packer, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { ExportData } from './types';
import { groupItemsByCategory } from './utils';
import { createLifetimeProjectedCostsTable } from './word/summaryTable';
import { createDetailedTable } from './word/detailedTable';

const createEvalueeInfoSection = (data: ExportData) => {
  const paragraphs: Paragraph[] = [];
  
  // Add evaluee information header
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'EVALUEE INFORMATION',
          bold: true,
          size: 24,
          color: '4472C4'
        })
      ],
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
      spacing: { before: 200, after: 200 }
    })
  );

  // Add evaluee details if available
  if (data.dateOfBirth) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Date of Birth: ${data.dateOfBirth}`
          })
        ],
        spacing: { before: 100, after: 100 }
      })
    );
  }

  if (data.dateOfInjury) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Date of Injury: ${data.dateOfInjury}`
          })
        ],
        spacing: { before: 100, after: 100 }
      })
    );
  }

  if (data.gender) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Gender: ${data.gender}`
          })
        ],
        spacing: { before: 100, after: 100 }
      })
    );
  }

  // Add address information if available
  const hasAddressInfo = data.address || data.city || data.state || data.zipCode;
  if (hasAddressInfo) {
    let addressText = 'Address: ';
    if (data.address) addressText += data.address;
    if (data.city || data.state || data.zipCode) {
      addressText += ', ';
      if (data.city) addressText += data.city;
      if (data.state) {
        if (data.city) addressText += ', ';
        addressText += data.state;
      }
      if (data.zipCode) {
        addressText += ' ' + data.zipCode;
      }
    }
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: addressText
          })
        ],
        spacing: { before: 100, after: 100 }
      })
    );
  }

  // Add contact information if available
  if (data.phone) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Phone: ${data.phone}`
          })
        ],
        spacing: { before: 100, after: 100 }
      })
    );
  }

  if (data.email) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Email: ${data.email}`
          })
        ],
        spacing: { before: 100, after: 100 }
      })
    );
  }

  if (data.lifeExpectancy) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Life Expectancy: ${data.lifeExpectancy} years`
          })
        ],
        spacing: { before: 100, after: 100 }
      })
    );
  }

  return paragraphs;
};

export const exportToWord = async (data: ExportData) => {
  console.log('Exporting data:', data); // Debug log to see what data we're working with
  console.log('Evaluee name before processing:', data.evalueeName);

  // Ensure evalueeName is a valid string
  const evalueeName = data.evalueeName && typeof data.evalueeName === 'string' && data.evalueeName.trim() !== '' 
    ? data.evalueeName.toUpperCase() 
    : 'UNKNOWN';
    
  console.log('Evaluee name after processing:', evalueeName);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `LIFE CARE PLAN FOR: ${evalueeName}`,
              bold: true,
              size: 28,
              color: '4472C4'
            })
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        ...createEvalueeInfoSection(data),
        new Paragraph({
          children: [
            new TextRun({
              text: 'LIFETIME PROJECTED COSTS SUMMARY',
              bold: true,
              size: 24,
              color: '4472C4'
            })
          ],
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }),
        createLifetimeProjectedCostsTable(data.items, data.dateOfBirth, data.lifeExpectancy),
        ...createDetailedCategoryTables(data)
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  
  // Create a sanitized filename using the same evalueeName variable
  const sanitizedName = evalueeName !== 'UNKNOWN' 
    ? evalueeName.replace(/[^a-zA-Z0-9]/g, '_') 
    : 'Unknown';
    
  console.log('Saving file with name:', `${sanitizedName}_LifeCarePlan.docx`);
  saveAs(blob, `${sanitizedName}_LifeCarePlan.docx`);
};

const createDetailedCategoryTables = (data: ExportData) => {
  const tables: (Paragraph | Table)[] = [];
  const groupedItems = groupItemsByCategory(data.items);

  Object.entries(groupedItems).forEach(([category, items]) => {
    // Format category name for better readability
    const formattedCategory = category
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim(); // Remove any leading/trailing spaces
    
    tables.push(
      new Paragraph({
        children: [new TextRun({ text: '' })],
        spacing: { before: 500, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: formattedCategory.toUpperCase(),
            bold: true,
            size: 24,
            color: '4472C4'
          })
        ],
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 }
      }),
      createDetailedTable(items, data.dateOfBirth, data.lifeExpectancy)
    );

    // Add geographic factors if available
    items.forEach(item => {
      if (item.geographicFactor) {
        const cityState = [];
        if (item.geographicFactor.city) cityState.push(item.geographicFactor.city);
        if (item.geographicFactor.state_name) cityState.push(item.geographicFactor.state_name);
        
        tables.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Geographic Factors for ${item.service}:`,
                bold: true
              })
            ],
            spacing: { before: 100, after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Location: ${cityState.join(', ')}`
              })
            ],
            spacing: { before: 50, after: 50 }
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Geographic Adjustment Factor: ${item.geographicFactor.gaf_lookup !== null ? item.geographicFactor.gaf_lookup : 'N/A'}`
              })
            ],
            spacing: { before: 50, after: 100 }
          })
        );
      }

      // Add cost resources if available
      if (item.costResources && item.costResources.length > 0) {
        tables.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Cost Resources for ${item.service}:`,
                bold: true
              })
            ],
            spacing: { before: 100, after: 50 }
          }),
          ...item.costResources.map(resource => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `${resource.name}: $${resource.cost.toFixed(2)}`
                })
              ],
              spacing: { before: 50, after: 50 }
            })
          )
        );
      }
    });

    // Add notes/rationale
    if (items.some(item => item.notes)) {
      tables.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Notes/Rationale:',
              bold: true
            })
          ],
          spacing: { before: 200, after: 100 }
        }),
        ...items
          .filter(item => item.notes)
          .map(item => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `${item.service}: ${item.notes || ''}`
                })
              ],
              spacing: { before: 100, after: 100 }
            })
          )
      );
    }
  });

  return tables;
};
