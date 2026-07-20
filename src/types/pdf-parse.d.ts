declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer, options?: {
    pagerender?: (pageData: { pageIndex: number }) => string;
    max?: number;
    version?: string;
  }): Promise<PDFData>;

  export = pdfParse;
}
