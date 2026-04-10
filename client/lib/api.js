// Mock API for Document Management
export const fetchDocuments = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    { id: "DOC-0021", name: "Q4_Strategy_Automation.pdf", type: "Automation", date: "2024-10-14", status: "Pending", user: "Sarah Chen" },
    { id: "DOC-0022", name: "Market_Research_V2.docx", type: "Extraction", date: "2024-10-14", status: "Reviewing", user: "David Vance" },
    { id: "DOC-0023", name: "Finance_Report_Final.pdf", type: "Automation", date: "2024-10-13", status: "Approved", user: "Elena Rodriguez" },
    { id: "DOC-0024", name: "Internal_Policy_Update.docx", type: "Extraction", date: "2024-10-12", status: "Rejected", user: "System Oracle" },
  ];
};

export const updateDocumentStatus = async (id, status) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`Updated document ${id} to status: ${status}`);
  return { success: true };
};

export const editDocumentContent = async (id, content) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Saved updated content for document ${id}`);
  return { success: true };
};
