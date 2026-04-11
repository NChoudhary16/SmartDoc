const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const templateCatalogService = require('./templateCatalogService');

class DocGenService {
  ensureUploadsDir() {
    const uploadPath = path.resolve(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
  }

  ensureTemplatesDir() {
    const templatePath = path.resolve(__dirname, '../templates');
    const manifestPath = path.resolve(templatePath, 'manifests');
    if (!fs.existsSync(templatePath)) {
      fs.mkdirSync(templatePath, { recursive: true });
    }
    if (!fs.existsSync(manifestPath)) {
      fs.mkdirSync(manifestPath, { recursive: true });
    }
  }

  xmlEscape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  humanizeKey(key) {
    return String(key || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  stringifyValue(value) {
    if (Array.isArray(value)) {
      return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
    }
    if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value ?? '';
  }

  flattenData(data, prefix = '', target = {}) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return target;
    }

    Object.entries(data).forEach(([key, value]) => {
      const nextKey = prefix ? `${prefix}_${key}` : key;
      if (Array.isArray(value)) {
        target[nextKey] = this.stringifyValue(value);
      } else if (value && typeof value === 'object') {
        this.flattenData(value, nextKey, target);
      } else {
        target[nextKey] = value ?? '';
      }
    });

    return target;
  }

  /**
   * Extra keys for smartdoc-branded-invoice.docx (aliases + sensible defaults).
   */
  invoiceDisplayAliases(data) {
    const d = data && typeof data === 'object' ? data : {};
    const taxVal = d.tax ?? d.tax_amount ?? '';
    const subVal = d.subtotal ?? d.total_amount ?? '';
    return {
      client_name: d.client_name || d.bill_to || '',
      client_address: d.client_address || d.shipping_address || '',
      contact_phone: d.contact_phone || d.client_phone || d.vendor_phone || '',
      bill_to: d.bill_to || d.client_name || '',
      shipping_address: d.shipping_address || d.client_address || '',
      tax: taxVal,
      subtotal: subVal,
      due_date: d.due_date || '',
      company_website: d.company_website || 'www.smartdoc.ai',
      vendor_address: d.vendor_address || '',
      vendor_email: d.vendor_email || d.support_email || 'hello@smartdoc.ai',
      support_email: d.support_email || d.vendor_email || 'hello@smartdoc.ai',
      support_phone: d.support_phone || d.vendor_phone || d.contact_phone || '',
      payment_terms: d.payment_terms || 'Payment due as agreed. Late fees may apply per policy.',
      signer_name: d.signer_name || d.vendor_contact_name || '',
      signer_title: d.signer_title || 'Authorized representative',
      item_1_desc: d.item_1_desc || d.line_items || '',
      item_1_price: d.item_1_price || '',
      item_1_qty: d.item_1_qty || '',
      item_1_total: d.item_1_total || ''
    };
  }

  loadManifest(templateInfo = {}, templateName = '') {
    this.ensureTemplatesDir();
    const catalogTemplate =
      templateCatalogService.getById(templateInfo.id) ||
      templateCatalogService.getByFilePath(templateInfo.file_path || templateName) ||
      templateCatalogService.getByType(templateInfo.type);

    const manifestFile = templateInfo.manifest_file || catalogTemplate?.manifest_file;
    if (!manifestFile) {
      return null;
    }

    const manifestPath = path.resolve(__dirname, '../templates/manifests', manifestFile);
    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      console.warn('Unable to load template manifest:', manifestPath, error.message || error);
      return null;
    }
  }

  /**
   * WordprocessingML block appended before the final section break (institutional e-sign record).
   */
  buildElectronicSignatureXml(meta = {}) {
    const name = this.xmlEscape(meta.approvedByName || 'Authorized approver');
    const role = this.xmlEscape(meta.approvedByRole || 'admin');
    const at = this.xmlEscape(
      meta.approvedAt
        ? new Date(meta.approvedAt).toISOString()
        : new Date().toISOString()
    );
    const docId = this.xmlEscape(meta.documentId || '—');
    const dept = this.xmlEscape(meta.department || '—');
    const src = this.xmlEscape(meta.sourceFileName || '');
    const titleLine = src
      ? `Source intake: ${src}`
      : 'Institutional document approval';

    const line = (text, bold = false) => {
      const boldOpen = bold ? '<w:rPr><w:b/><w:sz w:val="24"/></w:rPr>' : '<w:rPr><w:sz w:val="22"/></w:rPr>';
      return `<w:p>
 <w:pPr><w:spacing w:before="240" w:after="60"/></w:pPr>
      <w:r>${boldOpen}<w:t xml:space="preserve">${text}</w:t></w:r>
    </w:p>`;
    };

    return `
    <w:p>
      <w:pPr><w:spacing w:before="480" w:after="120"/></w:pPr>
      <w:r><w:rPr><w:color w:val="4F46E5"/></w:rPr><w:t xml:space="preserve">________________________________________________</w:t></w:r>
    </w:p>
    ${line('Electronic signature — institutional approval', true)}
    ${line(titleLine, false)}
    ${line(`Signed by: ${name} (${role})`, false)}
    ${line(`Signed at (UTC): ${at}`, false)}
    ${line(`Document ID: ${docId}`, false)}
    ${line(`Routed department: ${dept}`, false)}
    ${line(
      'This record was applied electronically at approval time and is intended for internal routing and audit.',
      false
    )}
    `;
  }

  appendElectronicSignatureToDocx(buffer, meta) {
    if (!buffer || !meta) return buffer;
    try {
      const zip = new PizZip(buffer);
      const file = zip.file('word/document.xml');
      if (!file) return buffer;

      let xml = file.asText();
      const block = this.buildElectronicSignatureXml(meta);
      if (xml.includes('<w:sectPr')) {
        xml = xml.replace(/<w:sectPr\b/, `${block}<w:sectPr`);
      } else {
        xml = xml.replace(/<\/w:body>/, `${block}</w:body>`);
      }
      zip.file('word/document.xml', xml);
      return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    } catch (e) {
      console.warn('E-sign append skipped:', e.message || e);
      return buffer;
    }
  }

  buildFallbackDocxBuffer(data, templateInfo = {}, templateName = '') {
    const manifest = this.loadManifest(templateInfo, templateName);
    const flattened = this.flattenData(data || {});
    const sections = manifest?.sections?.length
      ? manifest.sections
      : [{ heading: 'Extracted Data', fields: Object.keys(flattened) }];

    const title = manifest?.title || templateInfo?.name || 'Generated draft document';
    const paragraphs = [
      `<w:p><w:r><w:t>${this.xmlEscape(title)}</w:t></w:r></w:p>`
    ];

    if (manifest?.intro) {
      paragraphs.push(`<w:p><w:r><w:t>${this.xmlEscape(manifest.intro)}</w:t></w:r></w:p>`);
    }

    sections.forEach((section) => {
      paragraphs.push(`<w:p><w:r><w:t>${this.xmlEscape(section.heading)}</w:t></w:r></w:p>`);
      (section.fields || []).forEach((field) => {
        const value = this.stringifyValue(flattened[field] ?? data?.[field] ?? '') || 'Pending';
        paragraphs.push(
          `<w:p><w:r><w:t>${this.xmlEscape(`${this.humanizeKey(field)}: ${value}`)}</w:t></w:r></w:p>`
        );
      });
    });

    const zip = new PizZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
    zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
    zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.join('\n    ')}
    <w:sectPr />
  </w:body>
</w:document>`);
    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  }

  /**
   * @param {object} esignMeta - When set (e.g. on admin approval), an electronic signature section is injected into the DOCX.
   */
  async generateDocx(data, templateName, templateInfo = {}, esignMeta = null) {
    try {
      this.ensureUploadsDir();
      this.ensureTemplatesDir();
      const templatePath = path.resolve(__dirname, '../templates', templateName);
      const raw = data && typeof data === 'object' ? data : {};
      const flattened = {
        ...this.flattenData(raw),
        ...raw,
        ...this.invoiceDisplayAliases(raw)
      };
      let buf;

      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          nullGetter: () => ''
        });
        doc.render(flattened);
        buf = doc.getZip().generate({
          type: 'nodebuffer',
          compression: 'DEFLATE',
        });
      } else {
        buf = this.buildFallbackDocxBuffer(data, templateInfo, templateName);
      }

      if (esignMeta && (esignMeta.approvedByName || esignMeta.documentId)) {
        buf = this.appendElectronicSignatureToDocx(buf, esignMeta);
      }

      const outputName = `generated-${Date.now()}.docx`;
      const outputPath = path.resolve(__dirname, '../uploads', outputName);
      fs.writeFileSync(outputPath, buf);
      return outputName;
    } catch (error) {
      console.error('Error generating DOCX:', error);
      throw new Error('Document generation failed');
    }
  }

  async generatePdf(data) {
    this.ensureUploadsDir();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    page.drawText(`Document Summary: ${JSON.stringify(data?.summary || data)}`);

    const pdfBytes = await pdfDoc.save();
    const outputName = `generated-${Date.now()}.pdf`;
    const outputPath = path.resolve(__dirname, '../uploads', outputName);

    fs.writeFileSync(outputPath, pdfBytes);
    return outputName;
  }
}

module.exports = new DocGenService();
