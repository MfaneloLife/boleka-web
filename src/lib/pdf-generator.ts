import { RentalAgreement } from '@/src/types/rental-agreement';

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeSignatures?: boolean;
  watermark?: string;
}

export class PDFGenerator {
  static async generateAgreementPDF(
    agreement: RentalAgreement,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    // Dynamic import to avoid SSR issues
    const jsPDF = (await import('jspdf')).default;
    
    const defaultOptions: Required<PDFGenerationOptions> = {
      format: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      includeSignatures: true,
      watermark: ''
    };

    const opts = { ...defaultOptions, ...options };
    
    // Create new PDF document
    const doc = new jsPDF({
      orientation: opts.orientation,
      unit: 'mm',
      format: opts.format
    });

    // Set up fonts and styles
    doc.setFont('helvetica');
    
    let currentY = opts.margins.top;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - opts.margins.left - opts.margins.right;
    const leftMargin = opts.margins.left;

    // Helper function to add text with wrapping
    const addText = (text: string, x: number, y: number, options?: any) => {
      const fontSize = options?.fontSize || 10;
      const maxWidth = options?.maxWidth || contentWidth;
      const lineHeight = options?.lineHeight || fontSize * 0.5;
      
      doc.setFontSize(fontSize);
      if (options?.style) {
        doc.setFont('helvetica', options.style);
      }
      
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      
      return y + (lines.length * lineHeight);
    };

    // Helper function to add section
    const addSection = (title: string, content: () => number) => {
      // Add some space before section
      currentY += 5;
      
      // Add section title
      currentY = addText(title, leftMargin, currentY, {
        fontSize: 12,
        style: 'bold'
      });
      
      currentY += 3;
      
      // Add section content
      currentY = content();
      
      currentY += 3;
      return currentY;
    };

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL AGREEMENT', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Agreement #${agreement.agreementNumber}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    // Agreement status and dates
    const statusText = `Status: ${agreement.status.toUpperCase().replace('_', ' ')}`;
    const createdText = `Created: ${agreement.createdAt.toDate().toLocaleDateString()}`;
    
    currentY = addText(statusText, leftMargin, currentY, { fontSize: 10 });
    currentY = addText(createdText, leftMargin, currentY, { fontSize: 10 });
    currentY += 5;

    // Parties Section
    currentY = addSection('PARTIES TO THE AGREEMENT', () => {
      let sectionY = currentY;
      
      // Owner (Lessor)
      sectionY = addText('LESSOR (Owner):', leftMargin, sectionY, { fontSize: 11, style: 'bold' });
      sectionY = addText(`Name: ${agreement.owner.name}`, leftMargin + 5, sectionY);
      sectionY = addText(`Email: ${agreement.owner.email}`, leftMargin + 5, sectionY);
      if (agreement.owner.phone) {
        sectionY = addText(`Phone: ${agreement.owner.phone}`, leftMargin + 5, sectionY);
      }
      if (agreement.owner.address) {
        sectionY = addText(`Address: ${agreement.owner.address}`, leftMargin + 5, sectionY);
      }
      sectionY += 3;
      
      // Renter (Lessee)
      sectionY = addText('LESSEE (Renter):', leftMargin, sectionY, { fontSize: 11, style: 'bold' });
      sectionY = addText(`Name: ${agreement.renter.name}`, leftMargin + 5, sectionY);
      sectionY = addText(`Email: ${agreement.renter.email}`, leftMargin + 5, sectionY);
      if (agreement.renter.phone) {
        sectionY = addText(`Phone: ${agreement.renter.phone}`, leftMargin + 5, sectionY);
      }
      if (agreement.renter.address) {
        sectionY = addText(`Address: ${agreement.renter.address}`, leftMargin + 5, sectionY);
      }
      
      return sectionY;
    });

    // Property Details Section
    currentY = addSection('RENTAL PROPERTY', () => {
      let sectionY = currentY;
      
      sectionY = addText(`Item: ${agreement.property.title}`, leftMargin, sectionY, { fontSize: 11, style: 'bold' });
      sectionY = addText(`Category: ${agreement.property.category}`, leftMargin, sectionY);
      sectionY = addText(`Condition: ${agreement.property.condition}`, leftMargin, sectionY);
      sectionY = addText(`Estimated Value: R${agreement.property.estimatedValue.toFixed(2)}`, leftMargin, sectionY);
      sectionY += 2;
      sectionY = addText('Description:', leftMargin, sectionY, { fontSize: 10, style: 'bold' });
      sectionY = addText(agreement.property.description, leftMargin, sectionY, { maxWidth: contentWidth - 10 });
      
      return sectionY;
    });

    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = opts.margins.top;
    }

    // Rental Terms Section
    currentY = addSection('RENTAL TERMS', () => {
      let sectionY = currentY;
      
      const startDate = agreement.rentalPeriod.startDate.toDate().toLocaleDateString();
      const endDate = agreement.rentalPeriod.endDate.toDate().toLocaleDateString();
      
      sectionY = addText(`Rental Period: ${startDate} to ${endDate} (${agreement.rentalPeriod.duration} days)`, leftMargin, sectionY);
      sectionY = addText(`Pickup Time: ${agreement.rentalPeriod.pickupTime}`, leftMargin, sectionY);
      sectionY = addText(`Return Time: ${agreement.rentalPeriod.returnTime}`, leftMargin, sectionY);
      sectionY = addText(`Pickup Location: ${agreement.rentalPeriod.pickupLocation}`, leftMargin, sectionY);
      sectionY = addText(`Return Location: ${agreement.rentalPeriod.returnLocation}`, leftMargin, sectionY);
      
      return sectionY;
    });

    // Financial Terms Section
    currentY = addSection('FINANCIAL TERMS', () => {
      let sectionY = currentY;
      
      sectionY = addText(`Daily Rental Rate: R${agreement.financial.dailyRate.toFixed(2)}`, leftMargin, sectionY);
      sectionY = addText(`Total Days: ${agreement.financial.totalDays}`, leftMargin, sectionY);
      sectionY = addText(`Subtotal: R${agreement.financial.subtotal.toFixed(2)}`, leftMargin, sectionY);
      sectionY = addText(`Security Deposit: R${agreement.financial.securityDeposit.toFixed(2)}`, leftMargin, sectionY);
      sectionY = addText(`Platform Fee: R${agreement.financial.platformFee.toFixed(2)}`, leftMargin, sectionY);
      sectionY = addText(`TOTAL AMOUNT: R${agreement.financial.totalAmount.toFixed(2)}`, leftMargin, sectionY, { 
        fontSize: 12, 
        style: 'bold' 
      });
      sectionY = addText(`Payment Method: ${agreement.financial.paymentMethod}`, leftMargin, sectionY);
      sectionY = addText(`Payment Due: ${agreement.financial.paymentDueDate.toDate().toLocaleDateString()}`, leftMargin, sectionY);
      
      return sectionY;
    });

    // Check if we need a new page
    if (currentY > 220) {
      doc.addPage();
      currentY = opts.margins.top;
    }

    // Policies Section
    currentY = addSection('POLICIES AND TERMS', () => {
      let sectionY = currentY;
      
      // Late Fees
      sectionY = addText('Late Return Fees:', leftMargin, sectionY, { fontSize: 11, style: 'bold' });
      sectionY = addText(`• Grace Period: ${agreement.policies.lateFees.gracePeriod} hours`, leftMargin + 5, sectionY);
      sectionY = addText(`• Daily Late Fee: R${agreement.policies.lateFees.dailyRate.toFixed(2)}`, leftMargin + 5, sectionY);
      sectionY = addText(`• Maximum Late Fee: R${agreement.policies.lateFees.maximumFee.toFixed(2)}`, leftMargin + 5, sectionY);
      sectionY += 2;
      
      // Damage Fees
      sectionY = addText('Damage Fees:', leftMargin, sectionY, { fontSize: 11, style: 'bold' });
      sectionY = addText(`• Minor Damage: ${agreement.policies.damageFees.minorDamage}% of item value`, leftMargin + 5, sectionY);
      sectionY = addText(`• Major Damage: ${agreement.policies.damageFees.majorDamage}% of item value`, leftMargin + 5, sectionY);
      sectionY = addText(`• Total Loss: ${agreement.policies.damageFees.totalLoss}% of item value`, leftMargin + 5, sectionY);
      sectionY += 2;
      
      // Return Policy
      sectionY = addText('Return Policy:', leftMargin, sectionY, { fontSize: 11, style: 'bold' });
      sectionY = addText(`• ${agreement.policies.returnPolicy.condition}`, leftMargin + 5, sectionY, { maxWidth: contentWidth - 10 });
      sectionY = addText(`• Cleaning Required: ${agreement.policies.returnPolicy.cleaningRequired ? 'Yes' : 'No'}`, leftMargin + 5, sectionY);
      sectionY = addText(`• Inspection Required: ${agreement.policies.returnPolicy.inspectionRequired ? 'Yes' : 'No'}`, leftMargin + 5, sectionY);
      sectionY = addText(`• Instructions: ${agreement.policies.returnPolicy.returnInstructions}`, leftMargin + 5, sectionY, { maxWidth: contentWidth - 10 });
      
      return sectionY;
    });

    // Special Terms and Restrictions
    if (agreement.specialTerms.length > 0) {
      currentY = addSection('SPECIAL TERMS', () => {
        let sectionY = currentY;
        agreement.specialTerms.forEach(term => {
          sectionY = addText(`• ${term}`, leftMargin, sectionY, { maxWidth: contentWidth - 10 });
        });
        return sectionY;
      });
    }

    if (agreement.restrictions.length > 0) {
      currentY = addSection('RESTRICTIONS', () => {
        let sectionY = currentY;
        agreement.restrictions.forEach(restriction => {
          sectionY = addText(`• ${restriction}`, leftMargin, sectionY, { maxWidth: contentWidth - 10 });
        });
        return sectionY;
      });
    }

    // Check if we need a new page for signatures
    if (currentY > 200) {
      doc.addPage();
      currentY = opts.margins.top;
    }

    // Signatures Section
    if (opts.includeSignatures) {
      currentY = addSection('SIGNATURES', () => {
        let sectionY = currentY;
        
        // Owner signature
        sectionY = addText('LESSOR (Owner):', leftMargin, sectionY, { fontSize: 11, style: 'bold' });
        sectionY += 5;
        
        if (agreement.owner.signedAt) {
          sectionY = addText(`Electronically signed by: ${agreement.owner.name}`, leftMargin, sectionY);
          sectionY = addText(`Date: ${agreement.owner.signedAt.toDate().toLocaleString()}`, leftMargin, sectionY);
        } else {
          // Add signature line
          doc.line(leftMargin, sectionY + 5, leftMargin + 60, sectionY + 5);
          sectionY = addText('Signature', leftMargin, sectionY + 8, { fontSize: 9 });
          doc.line(leftMargin + 80, sectionY - 3, leftMargin + 120, sectionY - 3);
          sectionY = addText('Date', leftMargin + 80, sectionY, { fontSize: 9 });
        }
        
        sectionY += 10;
        
        // Renter signature
        sectionY = addText('LESSEE (Renter):', leftMargin, sectionY, { fontSize: 11, style: 'bold' });
        sectionY += 5;
        
        if (agreement.renter.signedAt) {
          sectionY = addText(`Electronically signed by: ${agreement.renter.name}`, leftMargin, sectionY);
          sectionY = addText(`Date: ${agreement.renter.signedAt.toDate().toLocaleString()}`, leftMargin, sectionY);
        } else {
          // Add signature line
          doc.line(leftMargin, sectionY + 5, leftMargin + 60, sectionY + 5);
          sectionY = addText('Signature', leftMargin, sectionY + 8, { fontSize: 9 });
          doc.line(leftMargin + 80, sectionY - 3, leftMargin + 120, sectionY - 3);
          sectionY = addText('Date', leftMargin + 80, sectionY, { fontSize: 9 });
        }
        
        return sectionY;
      });
    }

    // Legal Footer
    currentY += 10;
    currentY = addText('Legal Information:', leftMargin, currentY, { fontSize: 10, style: 'bold' });
    currentY = addText(`Governing Law: ${agreement.governingLaw}`, leftMargin, currentY, { fontSize: 9 });
    currentY = addText(`Dispute Resolution: ${agreement.disputeResolution}`, leftMargin, currentY, { fontSize: 9 });
    
    // Add watermark if specified
    if (opts.watermark) {
      doc.setFontSize(50);
      doc.setTextColor(200, 200, 200);
      doc.text(opts.watermark, pageWidth / 2, doc.internal.pageSize.height / 2, {
        angle: 45,
        align: 'center'
      });
    }

    // Return PDF as blob
    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  static async downloadAgreementPDF(
    agreement: RentalAgreement,
    filename?: string,
    options?: PDFGenerationOptions
  ): Promise<void> {
    try {
      const pdfBlob = await this.generateAgreementPDF(agreement, options);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `rental-agreement-${agreement.agreementNumber}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  static async generateAndUploadPDF(
    agreement: RentalAgreement,
    options?: PDFGenerationOptions
  ): Promise<string> {
    try {
      const pdfBlob = await this.generateAgreementPDF(agreement, options);
      
      // Upload to Firebase Storage
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase');
      
      const filename = `agreements/${agreement.id}/rental-agreement-${agreement.agreementNumber}.pdf`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, pdfBlob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  }
}