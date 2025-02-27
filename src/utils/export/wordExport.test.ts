import { vi, describe, it, expect, beforeEach } from 'vitest';
import { exportToWord } from './wordExport';
import { mockExportData } from './testUtils';

// Mock the docx library
vi.mock('docx', () => {
  return {
    Document: vi.fn().mockImplementation(({ sections }) => ({
      sections,
      addSection: vi.fn().mockReturnThis(),
    })),
    Packer: {
      toBlob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('test')),
    },
    Paragraph: vi.fn().mockImplementation(({ text }) => ({ text })),
    TextRun: vi.fn().mockImplementation(({ text }) => ({ text })),
    HeadingLevel: {
      HEADING_1: 'HEADING_1',
      HEADING_2: 'HEADING_2',
    },
    AlignmentType: {
      CENTER: 'CENTER',
      LEFT: 'LEFT',
    },
    Table: vi.fn().mockImplementation(() => ({
      addRow: vi.fn().mockReturnThis(),
    })),
    TableRow: vi.fn().mockImplementation(() => ({
      addCell: vi.fn().mockReturnThis(),
    })),
    TableCell: vi.fn().mockImplementation(() => ({
      addParagraph: vi.fn().mockReturnThis(),
    })),
    WidthType: {
      PERCENTAGE: 'PERCENTAGE',
    },
    BorderStyle: {
      SINGLE: 'SINGLE',
    },
    convertInchesToTwip: vi.fn().mockReturnValue(100),
    PageOrientation: {
      PORTRAIT: 'PORTRAIT',
    },
    SectionType: {
      NEXT_PAGE: 'NEXT_PAGE',
    },
    Header: vi.fn().mockImplementation(() => ({})),
    Footer: vi.fn().mockImplementation(() => ({})),
    PageNumber: vi.fn().mockImplementation(() => ({})),
    NumberFormat: {
      DECIMAL: 'DECIMAL',
    },
  };
});

// Mock the fs module
vi.mock('fs', () => ({
  writeFileSync: vi.fn(),
}));

// Mock the saveAs function
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));

describe('Word Export Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a Word document with the correct structure', async () => {
    const { Document, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');
    
    await exportToWord(mockExportData);
    
    expect(Document).toHaveBeenCalled();
    expect(Packer.toBlob).toHaveBeenCalled();
    expect(saveAs).toHaveBeenCalled();
  });

  it('should sanitize filenames with special characters', async () => {
    const testData = {
      ...mockExportData,
      evalueeName: 'John/Doe: Special & Characters?'
    };
    
    const { saveAs } = await import('file-saver');
    
    await exportToWord(testData);
    
    // Check that saveAs was called with the sanitized filename
    expect(saveAs).toHaveBeenCalledWith(
      expect.any(Blob),
      'John_Doe__Special___Characters__LifeCarePlan.docx'
    );
  });

  it('should include evaluee information in the document', async () => {
    const { Document } = await import('docx');
    
    await exportToWord(mockExportData);
    
    // Verify Document was created with evaluee information
    expect(Document).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: expect.arrayContaining([
          expect.objectContaining({
            children: expect.arrayContaining([
              expect.objectContaining({ text: expect.stringContaining('LIFE CARE PLAN FOR: JOHN DOE') })
            ])
          })
        ])
      })
    );
  });

  it('should handle missing evaluee information gracefully', async () => {
    const testData = {
      ...mockExportData,
      dateOfBirth: undefined,
      dateOfInjury: undefined,
      gender: undefined,
      address: undefined,
      city: undefined,
      state: undefined,
      zipCode: undefined,
    };
    
    const { Document } = await import('docx');
    const { saveAs } = await import('file-saver');
    
    await exportToWord(testData);
    
    // Verify Document was created despite missing information
    expect(Document).toHaveBeenCalled();
    expect(saveAs).toHaveBeenCalled();
  });

  it('should include lifetime projected costs table', async () => {
    const { Document, Table } = await import('docx');
    
    await exportToWord(mockExportData);
    
    // Verify Document and Table were created
    expect(Document).toHaveBeenCalled();
    expect(Table).toHaveBeenCalled();
  });
}); 