import { jsPDF } from "jspdf";
import { PDFDocument } from "pdf-lib";

// Helper to compress and resize image
const compressImage = (base64Str: string): Promise<{ data: string, width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024; // Limit width to 1024px for reasonable file size
      const MAX_HEIGHT = 1400; // Limit height roughly to A4 ratio
      
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
         reject(new Error("Canvas context error"));
         return;
      }
      
      // White background (transparent PNGs might turn black otherwise)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with quality 0.6 (Good balance for documents)
      const data = canvas.toDataURL('image/jpeg', 0.6);
      resolve({ data, width, height });
    };
    img.onerror = (err) => reject(err);
  });
};

export const generatePdfFromImages = async (imagesBase64: string[]): Promise<string> => {
  // Initialize A4 PDF
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10; // 10mm margin
  const usableWidth = pageWidth - (margin * 2);
  const usableHeight = pageHeight - (margin * 2);

  for (let i = 0; i < imagesBase64.length; i++) {
    if (i > 0) {
      doc.addPage();
    }

    try {
        const { data: compressedData, width: imgWidth, height: imgHeight } = await compressImage(imagesBase64[i]);

        // Calculate scale to fit image within margins while maintaining aspect ratio
        const scaleX = usableWidth / imgWidth;
        const scaleY = usableHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY); // Fit entirely

        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;

        // Center the image on the page
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        doc.addImage(compressedData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST');
    } catch (e) {
        console.error("Error adding image to PDF", e);
    }
  }

  return doc.output('datauristring');
};

export const mergePdfs = async (pdfBase64List: string[]): Promise<string> => {
  const mergedPdf = await PDFDocument.create();

  for (const base64String of pdfBase64List) {
    try {
        // Clean base64 string
        const base64Clean = base64String.split(',')[1] || base64String;
        
        // Convert base64 to Uint8Array
        const pdfBytes = Uint8Array.from(atob(base64Clean), c => c.charCodeAt(0));
        
        const pdf = await PDFDocument.load(pdfBytes);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    } catch (e) {
        console.error("Error merging specific PDF", e);
    }
  }

  const savedBytes = await mergedPdf.save();
  
  // Convert Uint8Array back to Base64
  let binary = '';
  const len = savedBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(savedBytes[i]);
  }
  
  return `data:application/pdf;base64,${btoa(binary)}`;
};