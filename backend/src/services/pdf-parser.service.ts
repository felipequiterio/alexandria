import pdfParse from "pdf-parse";

export interface ParsedPdf {
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    creator?: string;
    producer?: string;
  };
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  const data = await pdfParse(buffer);

  return {
    text: data.text,
    pageCount: data.numpages,
    metadata: {
      title: data.info?.Title || undefined,
      author: data.info?.Author || undefined,
      creator: data.info?.Creator || undefined,
      producer: data.info?.Producer || undefined,
    },
  };
}
