import { db, newId } from './db';
import { invokeLLM } from './llm';

// Local replacements for base44.integrations.Core.*
// - UploadFile: stores the file Blob in IndexedDB and returns a synthetic id ref.
// - ExtractDataFromUploadedFile: extracts text from pdf / xlsx / docx in-browser.
// - InvokeLLM: forwards to the configured LLM provider.

const FILE_REF_PREFIX = 'idb://file/';

async function getStoredFile(fileUrl) {
  if (!fileUrl?.startsWith(FILE_REF_PREFIX)) {
    throw new Error(`Unsupported file_url for local extraction: ${fileUrl}`);
  }
  const id = fileUrl.slice(FILE_REF_PREFIX.length);
  const record = await db.table('Files').get(id);
  if (!record) throw new Error(`File ${id} not found in local store`);
  return record.blob;
}

async function uploadFile({ file }) {
  const id = newId();
  await db.table('Files').put({ id, blob: file, name: file.name, type: file.type });
  return { file_url: `${FILE_REF_PREFIX}${id}` };
}

async function extractPdf(blob) {
  const pdfjs = await import('pdfjs-dist');
  const workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const buf = await blob.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const parts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map(it => it.str).join(' ');
    parts.push(`--- Page ${i} ---\n${text}`);
  }
  return parts.join('\n\n');
}

async function extractXlsx(blob) {
  const XLSX = await import('xlsx');
  const buf = await blob.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const parts = [];
  for (const name of wb.SheetNames) {
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[name]);
    parts.push(`## Sheet: ${name}\n${csv}`);
  }
  return parts.join('\n\n');
}

async function extractDocx(blob) {
  const mammoth = await import('mammoth');
  const buf = await blob.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
}

async function extractDataFromUploadedFile({ file_url }) {
  const blob = await getStoredFile(file_url);
  const type = blob.type;
  let raw_text = '';

  if (type === 'application/pdf') {
    raw_text = await extractPdf(blob);
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    raw_text = await extractXlsx(blob);
  } else if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword'
  ) {
    raw_text = await extractDocx(blob);
  } else {
    throw new Error(`Unsupported file type for extraction: ${type}`);
  }

  return { output: { raw_text } };
}

async function invokeLLMIntegration({ prompt }) {
  return invokeLLM(prompt);
}

export const integrations = {
  Core: {
    UploadFile: uploadFile,
    ExtractDataFromUploadedFile: extractDataFromUploadedFile,
    InvokeLLM: invokeLLMIntegration,
  },
};
