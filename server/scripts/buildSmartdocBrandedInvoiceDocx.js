/**
 * Generates server/templates/smartdoc-branded-invoice.docx (Smart DOC Ai–style invoice layout).
 * Run: node scripts/buildSmartdocBrandedInvoiceDocx.js
 */
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');

const LIME = 'B2E061';
const NAVY = '1B263B';
const SKY = '42A5F5';
const YELLOW = 'FFEB3B';
const GREEN = '2E7D32';
const BLUE = '1565C0';
const HEADER_BG = 'E8EEF7';
const BORDER = 'CBD5E1';
const SLATE = '64748B';

function t(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function r(text, opts = {}) {
  const { bold, sz = 22, color, u, i } = opts;
  const parts = [];
  if (bold) parts.push('<w:b/>');
  if (i) parts.push('<w:i/>');
  if (sz) parts.push(`<w:sz w:val="${sz}"/>`);
  if (color) parts.push(`<w:color w:val="${color}"/>`);
  if (u) parts.push(`<w:u w:val="single" w:color="${YELLOW}"/>`);
  const rPr = parts.length ? `<w:rPr>${parts.join('')}</w:rPr>` : '';
  return `<w:r>${rPr}<w:t xml:space="preserve">${t(text)}</w:t></w:r>`;
}

/** Run with optional placeholder — do not escape {tags} */
function rRaw(text, opts = {}) {
  const { bold, sz = 22, color, i } = opts;
  const parts = [];
  if (bold) parts.push('<w:b/>');
  if (i) parts.push('<w:i/>');
  if (sz) parts.push(`<w:sz w:val="${sz}"/>`);
  if (color) parts.push(`<w:color w:val="${color}"/>`);
  const rPr = parts.length ? `<w:rPr>${parts.join('')}</w:rPr>` : '';
  return `<w:r>${rPr}<w:t xml:space="preserve">${text}</w:t></w:r>`;
}

function p(...runs) {
  return `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr>${runs.join('')}</w:p>`;
}

function pAlign(align, ...runs) {
  const jc = align ? `<w:pPr><w:jc w:val="${align}"/><w:spacing w:after="120"/></w:pPr>` : `<w:pPr><w:spacing w:after="120"/></w:pPr>`;
  return `<w:p>${jc}${runs.join('')}</w:p>`;
}

/** Standard table grid borders */
function tblGridBorders(heavyTop = false) {
  const topSz = heavyTop ? '18' : '8';
  return `<w:tblBorders>
    <w:top w:val="single" w:sz="${topSz}" w:space="0" w:color="${NAVY}"/>
    <w:left w:val="single" w:sz="4" w:space="0" w:color="${BORDER}"/>
    <w:bottom w:val="single" w:sz="8" w:space="0" w:color="${NAVY}"/>
    <w:right w:val="single" w:sz="4" w:space="0" w:color="${BORDER}"/>
    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="${BORDER}"/>
    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="${BORDER}"/>
  </w:tblBorders>`;
}

function cellShaded(widthTwips, fill, innerXml) {
  return `<w:tc><w:tcPr><w:tcW w:w="${widthTwips}" w:type="dxa"/><w:shd w:val="clear" w:fill="${fill}" w:color="auto"/></w:tcPr>${innerXml}</w:tc>`;
}

function cell(widthTwips, innerXml, fill = null, pad = '120') {
  const shd = fill
    ? `<w:shd w:val="clear" w:fill="${fill}" w:color="auto"/>`
    : '';
  return `<w:tc><w:tcPr><w:tcW w:w="${widthTwips}" w:type="dxa"/>${shd}<w:tcMar><w:top w:w="${pad}" w:type="dxa"/><w:left w:w="${pad}" w:type="dxa"/><w:bottom w:w="${pad}" w:type="dxa"/><w:right w:w="${pad}" w:type="dxa"/></w:tcMar></w:tcPr>${innerXml}</w:tc>`;
}

function buildDocumentXml() {
  const sidebarBlock = `
  <w:tbl>
    <w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr>
    <w:tblGrid><w:gridCol w:w="1620"/></w:tblGrid>
    <w:tr><w:trPr><w:trHeight w:val="3000" w:hRule="atLeast"/></w:trPr>
      ${cellShaded(
        1620,
        LIME,
        `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${r(' ', { sz: 8 })}</w:p>`
      )}
    </w:tr>
    <w:tr><w:trPr><w:trHeight w:val="5400" w:hRule="atLeast"/></w:trPr>
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="1620" w:type="dxa"/>
          <w:shd w:val="clear" w:fill="${NAVY}" w:color="auto"/>
          <w:textDirection w:val="btLr"/>
        </w:tcPr>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr>${rRaw('{company_website}', { sz: 18, color: 'FFFFFF' })}</w:p>
      </w:tc>
    </w:tr>
  </w:tbl>`;

  const heroTable = `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="8800" w:type="dxa"/>
      ${tblGridBorders(true)}
      <w:tblCellMar><w:top w:w="160" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:bottom w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tblCellMar>
    </w:tblPr>
    <w:tblGrid><w:gridCol w:w="4200"/><w:gridCol w:w="4600"/></w:tblGrid>
    <w:tr>
      ${cell(
        4200,
        `<w:p>${r('Smart ', { bold: true, sz: 36, color: BLUE })}${r('DOC ', { bold: true, sz: 36, color: GREEN })}${r('Ai', { bold: true, sz: 36, color: BLUE })}</w:p>
         <w:p><w:pPr><w:spacing w:before="60" w:after="80"/></w:pPr>${r('AI Portals · Finance', { sz: 18, color: SLATE, i: true })}</w:p>`
      )}
      ${cell(
        4600,
        `<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${r('I N V O I C E', { bold: true, sz: 52, color: SKY, u: true })}</w:p>
         <w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="40"/></w:pPr>${r('Official billing document', { sz: 18, color: SLATE })}</w:p>`,
        null,
        '160'
      )}
    </w:tr>
  </w:tbl>`;

  const issuerStrip = `
  ${p(r('Issued by', { bold: true, sz: 18, color: NAVY }), rRaw(' · {vendor_name}', { sz: 18, color: NAVY }))}
  ${p(rRaw('{vendor_address}', { sz: 18, color: SLATE }))}
  ${p(rRaw('{vendor_email}', { sz: 18, color: SLATE }))}`;

  const clientBlock = `
  ${p(r('Bill to', { bold: true, sz: 22, color: NAVY }))}
  ${p(rRaw('{bill_to}', { bold: true, sz: 24, color: NAVY }))}
  ${p(rRaw('{shipping_address}', { sz: 20, color: SLATE }))}
  ${p(rRaw('{contact_phone}', { sz: 20, color: SLATE }))}`;

  const metaRight = `
  ${pAlign('right', r('Date', { bold: true, sz: 20, color: NAVY }), rRaw(' {date}', { sz: 20, color: SLATE }))}
  ${pAlign('right', r('Due date', { bold: true, sz: 20, color: NAVY }), rRaw(' {due_date}', { sz: 20, color: SLATE }))}
  ${pAlign('right', r('Invoice #', { bold: true, sz: 20, color: NAVY }), rRaw(' {invoice_number}', { sz: 20, color: SLATE }))}
  ${pAlign('right', r('Currency', { bold: true, sz: 20, color: NAVY }), rRaw(' {currency}', { sz: 20, color: SLATE }))}`;

  const lineHeader = `
  <w:tr>
    ${cell(720, `<w:p>${r('NO', { bold: true, sz: 20, color: NAVY })}</w:p>`, HEADER_BG)}
    ${cell(4100, `<w:p>${r('ITEM DESCRIPTION', { bold: true, sz: 20, color: NAVY })}</w:p>`, HEADER_BG)}
    ${cell(1400, `<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${r('PRICE', { bold: true, sz: 20, color: NAVY })}</w:p>`, HEADER_BG)}
    ${cell(900, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${r('QTY', { bold: true, sz: 20, color: NAVY })}</w:p>`, HEADER_BG)}
    ${cell(1680, `<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${r('TOTAL', { bold: true, sz: 20, color: NAVY })}</w:p>`, HEADER_BG)}
  </w:tr>`;

  function lineRow(no, descPh, pricePh, qtyPh, totPh) {
    return `
  <w:tr>
    ${cell(720, `<w:p>${rRaw(no, { sz: 20, color: SLATE })}</w:p>`)}
    ${cell(4100, `<w:p>${rRaw(descPh, { sz: 20 })}</w:p>`)}
    ${cell(1400, `<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${rRaw(pricePh, { sz: 20 })}</w:p>`)}
    ${cell(900, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${rRaw(qtyPh, { sz: 20 })}</w:p>`)}
    ${cell(1680, `<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${rRaw(totPh, { bold: true, sz: 20, color: NAVY })}</w:p>`)}
  </w:tr>`;
  }

  const linesTable = `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="8800" w:type="dxa"/>
      ${tblGridBorders(true)}
      <w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar>
    </w:tblPr>
    <w:tblGrid>
      <w:gridCol w:w="720"/><w:gridCol w:w="4100"/><w:gridCol w:w="1400"/><w:gridCol w:w="900"/><w:gridCol w:w="1680"/>
    </w:tblGrid>
    ${lineHeader}
    ${lineRow('01', '{item_1_desc}', '{item_1_price}', '{item_1_qty}', '{item_1_total}')}
    ${lineRow('02', '{item_2_desc}', '{item_2_price}', '{item_2_qty}', '{item_2_total}')}
    ${lineRow('03', '{item_3_desc}', '{item_3_price}', '{item_3_qty}', '{item_3_total}')}
    ${lineRow('04', '{item_4_desc}', '{item_4_price}', '{item_4_qty}', '{item_4_total}')}
  </w:tbl>`;

  const totalsBar = `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="8800" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="12" w:space="0" w:color="${NAVY}"/>
        <w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/>
      </w:tblBorders>
    </w:tblPr>
    <w:tblGrid><w:gridCol w:w="2933"/><w:gridCol w:w="2933"/><w:gridCol w:w="2934"/></w:tblGrid>
    <w:tr>
      ${cell(2933, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${r('SUB TOTAL', { bold: true, sz: 18, color: SLATE })}</w:p>`)}
      ${cell(2933, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${r('TAX', { bold: true, sz: 18, color: SLATE })}</w:p>`)}
      ${cell(2934, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${r('TOTAL', { bold: true, sz: 18, color: SLATE })}</w:p>`)}
    </w:tr>
    <w:tr>
      ${cell(2933, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${rRaw('{currency} {subtotal}', { bold: true, sz: 28, color: 'FFFFFF' })}</w:p>`, NAVY)}
      ${cell(2933, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${rRaw('{currency} {tax}', { bold: true, sz: 28, color: 'FFFFFF' })}</w:p>`, NAVY)}
      ${cell(2934, `<w:p><w:pPr><w:jc w:val="center"/></w:pPr>${rRaw('{currency} {total_amount}', { bold: true, sz: 28, color: 'FFFFFF' })}</w:p>`, NAVY)}
    </w:tr>
  </w:tbl>`;

  const notesBlock = `
  ${p(r('Note', { bold: true, sz: 22, color: NAVY }), rRaw(': {notes}', { sz: 22, color: SLATE }))}
  ${pAlign('center', r('Thanks for your business with us.', { sz: 26, color: SKY, i: true }))}`;

  const signatureBlock = `
  <w:tbl>
    <w:tblPr><w:tblW w:w="8800" w:type="dxa"/></w:tblPr>
    <w:tblGrid><w:gridCol w:w="5200"/><w:gridCol w:w="3600"/></w:tblGrid>
    <w:tr>
      ${cell(5200, `<w:p><w:r><w:t></w:t></w:r></w:p>`)}
      ${cell(
        3600,
        `<w:p><w:pPr><w:jc w:val="right"/></w:pPr>${r('_________________________', { sz: 18, color: BORDER })}</w:p>
         <w:p><w:pPr><w:jc w:val="right"/></w:pPr>${rRaw('{signer_name}', { bold: true, sz: 22, color: NAVY })}</w:p>
         <w:p><w:pPr><w:jc w:val="right"/></w:pPr>${rRaw('{signer_title}', { sz: 18, color: SLATE, i: true })}</w:p>`,
        null,
        '80'
      )}
    </w:tr>
  </w:tbl>`;

  const footerBlock = `
  <w:tbl>
    <w:tblPr>
      <w:tblW w:w="8800" w:type="dxa"/>
      <w:tblBorders>
        <w:top w:val="single" w:sz="8" w:space="0" w:color="${BORDER}"/>
        <w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="single" w:sz="4" w:color="${BORDER}"/>
      </w:tblBorders>
      <w:tblCellMar><w:top w:w="140" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar>
    </w:tblPr>
    <w:tblGrid><w:gridCol w:w="2933"/><w:gridCol w:w="2933"/><w:gridCol w:w="2934"/></w:tblGrid>
    <w:tr>
      ${cell(2933, `<w:p>${r('Questions?', { bold: true, sz: 18, color: NAVY })}</w:p><w:p>${rRaw('{support_phone}', { sz: 17, color: SLATE })}</w:p><w:p>${rRaw('{support_email}', { sz: 17, color: SLATE })}</w:p>`)}
      ${cell(2933, `<w:p>${r('Payment', { bold: true, sz: 18, color: NAVY })}</w:p><w:p>${r('Visa / Mastercard', { sz: 16, color: SLATE })}</w:p><w:p>${r('PayPal · ACH on request', { sz: 16, color: SLATE })}</w:p>`)}
      ${cell(2934, `<w:p>${r('Terms', { bold: true, sz: 18, color: NAVY })}</w:p><w:p>${rRaw('{payment_terms}', { sz: 16, color: SLATE })}</w:p>`)}
    </w:tr>
  </w:tbl>`;

  const mainInner = `
  ${heroTable}
  <w:p><w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
  ${issuerStrip}
  <w:p><w:pPr><w:spacing w:before="200" w:after="120"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
  <w:tbl>
    <w:tblPr><w:tblW w:w="8800" w:type="dxa"/></w:tblPr>
    <w:tblGrid><w:gridCol w:w="4800"/><w:gridCol w:w="4000"/></w:tblGrid>
    <w:tr>
      ${cell(4800, clientBlock, null, '140')}
      ${cell(4000, metaRight, null, '140')}
    </w:tr>
  </w:tbl>
  <w:p><w:pPr><w:spacing w:before="220" w:after="160"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="4"/></w:rPr><w:t> </w:t></w:r>
  </w:p>
  ${linesTable}
  <w:p><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
  ${totalsBar}
  <w:p><w:pPr><w:spacing w:before="220"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
  ${notesBlock}
  <w:p><w:pPr><w:spacing w:before="280"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
  ${signatureBlock}
  <w:p><w:pPr><w:spacing w:before="240"/></w:pPr><w:r><w:t></w:t></w:r></w:p>
  ${footerBlock}`;

  const outerTable = `
  <w:tbl>
    <w:tblPr><w:tblW w:w="10440" w:type="dxa"/><w:tblCellMar><w:top w:w="120" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>
    <w:tblGrid><w:gridCol w:w="1620"/><w:gridCol w:w="8820"/></w:tblGrid>
    <w:tr>
      ${cell(1620, sidebarBlock)}
      ${cell(8820, mainInner, null, '160')}
    </w:tr>
  </w:tbl>`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${outerTable}
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:sectPr/>
  </w:body>
</w:document>`;
}

function main() {
  const root = path.resolve(__dirname, '..');
  const outPath = path.join(root, 'templates', 'smartdoc-branded-invoice.docx');

  const zip = new PizZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );
  zip.folder('_rels').file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );
  zip.folder('word').file('document.xml', buildDocumentXml());

  fs.writeFileSync(outPath, zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' }));
  console.log('Wrote', outPath);
}

main();
