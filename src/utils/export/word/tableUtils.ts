import { BorderStyle, TableCell, Paragraph, WidthType, AlignmentType, TextRun } from 'docx';

export const createTableBorders = () => ({
  top: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
});

export const createStyledCell = (
  content: string,
  width: number,
  fill: string = 'E6EDF5',
  options: {
    columnSpan?: number,
    alignment?: 'start' | 'center' | 'end' | 'both' | 'mediumKashida' | 'distribute' | 'numTab' | 'highKashida' | 'lowKashida' | 'thaiDistribute' | 'left' | 'right',
    bold?: boolean,
    color?: string
  } = {}
) => {
  const cell = new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({ 
        children: [
          new TextRun({ 
            text: content,
            bold: options.bold || false,
            color: options.color || '000000'
          })
        ], 
        alignment: options.alignment 
      })
    ],
    shading: { fill },
    columnSpan: options.columnSpan,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
    },
  });
  return cell;
};
