import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { ReportData } from './reports.types';

const MARGIN = 36;
const FONT = 'Helvetica';
const BOLD = 'Helvetica-Bold';

export const fmtDate = (d: Date | string | null | undefined): string => {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
};

/** A4 landscape table report: title block, summary counts, paginated table with repeating header, page footer. */
export function renderPdf(data: ReportData, generatedAt = new Date()): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: MARGIN, bufferPages: true, info: { Title: `PROSAFE — ${data.title}`, Author: 'PROSAFE' } });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const width = doc.page.width - MARGIN * 2;
    doc.font(BOLD).fontSize(18).fillColor('#111827').text(`PROSAFE — ${data.title}`);
    doc.moveDown(0.3).font(FONT).fontSize(10).fillColor('#374151');
    doc.text(`Période : ${data.periodLabel}`);
    doc.text(`Généré le : ${fmtDate(generatedAt)}`);
    if (data.filters.length) doc.text(`Filtres : ${data.filters.join(' · ')}`);
    doc.moveDown(0.6);

    doc.font(BOLD).fontSize(12).fillColor('#111827').text('Synthèse');
    doc.font(FONT).fontSize(10).fillColor('#374151');
    for (const [label, value] of data.summary) doc.text(`${label} : ${value}`);
    if (data.truncated) doc.fillColor('#b45309').text('Le tableau est tronqué (trop de lignes) : affinez la période ou les filtres.').fillColor('#374151');
    doc.moveDown(0.8);

    const totalWeight = data.columns.reduce((n, c) => n + c.width, 0);
    const widths = data.columns.map((c) => (c.width / totalWeight) * width);
    const pad = 4;
    const bottom = () => doc.page.height - MARGIN - 18;

    const drawRow = (cells: (string | number)[], header: boolean) => {
      doc.font(header ? BOLD : FONT).fontSize(8);
      const texts = cells.map((c) => String(c ?? ''));
      const height = Math.max(...texts.map((t, i) => doc.heightOfString(t, { width: widths[i] - pad * 2 })), 10) + pad * 2;
      if (doc.y + height > bottom()) {
        doc.addPage();
        if (!header) drawRow(data.columns.map((c) => c.header), true);
      }
      const y = doc.y;
      let x = MARGIN;
      if (header) doc.rect(MARGIN, y, width, height).fill('#e5e7eb');
      doc.fillColor('#111827').font(header ? BOLD : FONT).fontSize(8);
      texts.forEach((t, i) => {
        doc.text(t, x + pad, y + pad, { width: widths[i] - pad * 2, height: height - pad, ellipsis: false });
        x += widths[i];
      });
      doc.moveTo(MARGIN, y + height).lineTo(MARGIN + width, y + height).lineWidth(0.3).strokeColor('#d1d5db').stroke();
      doc.x = MARGIN;
      doc.y = y + height;
    };

    drawRow(data.columns.map((c) => c.header), true);
    if (!data.rows.length) doc.font(FONT).fontSize(9).fillColor('#6b7280').text('Aucune donnée pour cette période.', MARGIN, doc.y + 6);
    for (const r of data.rows) drawRow(r, false);

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0; // avoid an automatic page break when writing the footer
      doc.font(FONT).fontSize(8).fillColor('#6b7280').text(`PROSAFE — Page ${i + 1} / ${range.count}`, MARGIN, doc.page.height - MARGIN, {
        width,
        align: 'right',
        lineBreak: false,
      });
    }
    doc.end();
  });
}

/** Two sheets: "Données" (table) and "Synthèse" (filters + counts). */
export async function renderXlsx(data: ReportData, generatedAt = new Date()): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'PROSAFE';
  wb.created = generatedAt;

  const sheet = wb.addWorksheet('Données');
  sheet.columns = data.columns.map((c) => ({ header: c.header, key: c.header, width: Math.max(10, Math.round(c.width * 4)) }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  for (const r of data.rows) sheet.addRow(r);

  const summary = wb.addWorksheet('Synthèse');
  summary.columns = [{ width: 36 }, { width: 40 }];
  summary.addRow([`PROSAFE — ${data.title}`]).font = { bold: true, size: 14 };
  summary.addRow(['Période', data.periodLabel]);
  summary.addRow(['Généré le', fmtDate(generatedAt)]);
  if (data.filters.length) summary.addRow(['Filtres', data.filters.join(' · ')]);
  summary.addRow([]);
  for (const [label, value] of data.summary) summary.addRow([label, value]);
  if (data.truncated) summary.addRow(['Remarque', 'Tableau tronqué (trop de lignes)']);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
