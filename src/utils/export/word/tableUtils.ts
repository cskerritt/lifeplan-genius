
import { BorderStyle, TableCell, Paragraph, WidthType, AlignmentType } from 'docx';

export const createTableBorders = () => ({
  top: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '4472C4' },
});

export const createStyledCell = (
  content: string,
  width: number,
  fill: string,
  options: {
    columnSpan?: number,
    alignment?: 'start' | 'center' | 'end' | 'both' | 'mediumKashida' | 'distribute' | 'numTab' | 'highKashida' | 'lowKashida' | 'thaiDistribute' | 'left' | 'right'
  } = {}
) => {
  const cell = new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: [new Paragraph({ text: content, alignment: options.alignment })],
    shading: { fill },
    columnSpan: options.columnSpan
  });
  return cell;
};
