import { AlignmentType, Table, TableCell, TableRow, TextRun, Paragraph, HeadingLevel, IParagraphOptions, BorderStyle } from "docx";
import { CareItem } from "@/types/lifecare";
import { groupItemsByCategory, calculateCategoryTotal, calculateCategoryOneTimeTotal, isOneTimeItem } from "../utils";

export const createDetailedHeaderRow = (): TableRow => {
  return new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Service", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 20, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "CPT/HCPCS", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 15, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Frequency", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 15, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Age Initiated", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 10, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Through Age", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 10, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Annual Cost", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 15, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "One-Time Cost", bold: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: 15, type: "pct" },
        shading: { fill: "E6EDF5" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
        },
      }),
    ],
  });
};

// Calculate age from date of birth
const calculateAgeFromDOB = (dob: string): number => {
  if (!dob) return 0;
  
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const createDetailedItemRows = (items: CareItem[], dateOfBirth?: string, lifeExpectancy?: string): TableRow[] => {
  const groupedItems = groupItemsByCategory(items);
  const rows: TableRow[] = [];

  // Calculate current age and max age
  const currentAge = dateOfBirth ? calculateAgeFromDOB(dateOfBirth) : 0;
  const lifeExpectancyValue = lifeExpectancy ? parseFloat(lifeExpectancy) : 30.5;
  const maxAge = currentAge + lifeExpectancyValue;

  for (const [category, categoryItems] of Object.entries(groupedItems)) {
    const categoryTotal = calculateCategoryTotal(categoryItems);
    const categoryOneTimeTotal = calculateCategoryOneTimeTotal(categoryItems);

    // Format category name with spaces between words
    const formattedCategory = category
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim(); // Remove any leading/trailing spaces

    // Add rows for each item in the category
    categoryItems.forEach((item) => {
      // Use current age and max age if startAge or endAge is undefined
      const displayStartAge = isOneTimeItem(item) ? "N/A" : 
        (item.startAge !== undefined ? item.startAge.toString() : currentAge.toString());
      
      const displayEndAge = isOneTimeItem(item) ? "N/A" : 
        (item.endAge !== undefined ? item.endAge.toString() : maxAge.toString());

      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.service })],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.cptCode || "N/A" })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: item.frequency })],
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: displayStartAge,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: displayEndAge,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: isOneTimeItem(item)
                        ? "N/A"
                        : `$${item.annualCost.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`,
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: isOneTimeItem(item)
                        ? `$${item.costRange.average.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        : "N/A",
                    }),
                  ],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              },
            }),
          ],
        })
      );
    });

    // Add category total row
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${formattedCategory} Total`,
                    bold: true,
                  }),
                ],
              }),
            ],
            columnSpan: 5,
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${categoryTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `$${categoryOneTimeTotal.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
            },
          }),
        ],
      })
    );
  }

  return rows;
};

export const createDetailedTable = (items: CareItem[], dateOfBirth?: string, lifeExpectancy?: string): Table => {
  // Check if items is an array before using it
  if (!Array.isArray(items)) {
    console.error('Expected items to be an array but got:', items);
    return new Table({
      width: { size: 100, type: "pct" },
      rows: [createDetailedHeaderRow()]
    });
  }
  
  return new Table({
    width: { size: 100, type: "pct" },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "4472C4" },
    },
    rows: [
      createDetailedHeaderRow(),
      ...createDetailedItemRows(items, dateOfBirth, lifeExpectancy),
    ],
  });
};
