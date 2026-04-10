const nodemailer = require('nodemailer');

const departmentEmailMap = {
  legal: 'legal@company.local',
  finance: 'finance@company.local',
  operations: 'operations@company.local',
  procurement: 'procurement@company.local'
};

class DispatchService {
  constructor() {
    this.transporter = nodemailer.createTransport({ jsonTransport: true });
  }

  async dispatchDocument({ department, documentId, artifactUrl }) {
    const normalized = String(department || '').toLowerCase();
    const target = departmentEmailMap[normalized] || process.env.DEFAULT_DEPARTMENT_EMAIL || 'admin@company.local';

    await this.transporter.sendMail({
      from: process.env.DISPATCH_SENDER_EMAIL || 'no-reply@docuflow.local',
      to: target,
      subject: `Approved document ${documentId} ready (DOCX with e-sign)`,
      text: `Document ${documentId} was approved. The final DOCX includes an electronic signature block (approver, timestamp, routing).\nDownload: ${artifactUrl}`
    });

    return {
      dispatched: true,
      channel: 'email',
      target
    };
  }
}

module.exports = new DispatchService();
