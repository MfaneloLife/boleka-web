import { Timestamp } from 'firebase/firestore';

export interface RentalAgreement {
  id: string;
  
  // Agreement Identification
  agreementNumber: string;
  orderId: string;
  
  // Parties
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    signedAt?: Timestamp;
    signature?: string; // Base64 encoded signature image
  };
  
  renter: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    signedAt?: Timestamp;
    signature?: string; // Base64 encoded signature image
  };
  
  // Rental Property Details
  property: {
    itemId: string;
    title: string;
    description: string;
    category: string;
    condition: string;
    serialNumber?: string;
    images: string[];
    estimatedValue: number;
  };
  
  // Rental Terms
  rentalPeriod: {
    startDate: Timestamp;
    endDate: Timestamp;
    duration: number; // in days
    pickupTime?: string;
    returnTime?: string;
    pickupLocation: string;
    returnLocation: string;
  };
  
  // Financial Terms
  financial: {
    dailyRate: number;
    totalDays: number;
    subtotal: number;
    securityDeposit: number;
    platformFee: number;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    paymentDueDate: Timestamp;
  };
  
  // Policies
  policies: {
    lateFees: {
      dailyRate: number; // per day late
      gracePeriod: number; // hours
      maximumFee: number;
    };
    damageFees: {
      minorDamage: number; // percentage of item value
      majorDamage: number; // percentage of item value
      totalLoss: number; // percentage of item value
    };
    returnPolicy: {
      condition: string;
      cleaningRequired: boolean;
      inspectionRequired: boolean;
      returnInstructions: string;
    };
    cancellationPolicy: {
      ownerCancellation: string;
      renterCancellation: string;
      refundPolicy: string;
    };
  };
  
  // Special Terms
  specialTerms: string[];
  restrictions: string[];
  includedAccessories: string[];
  
  // Agreement Status
  status: 'draft' | 'pending_signatures' | 'signed' | 'active' | 'completed' | 'terminated';
  
  // Legal
  governingLaw: string;
  disputeResolution: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  signedAt?: Timestamp;
  terminatedAt?: Timestamp;
  terminationReason?: string;
  
  // Document Management
  pdfUrl?: string;
  pdfGeneratedAt?: Timestamp;
  documentVersion: number;
}

export interface AgreementTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Default terms that can be customized
  defaultTerms: {
    lateFeePerDay: number;
    securityDepositPercentage: number;
    gracePeriodHours: number;
    maxLateFeePercentage: number;
    minorDamagePercentage: number;
    majorDamagePercentage: number;
    totalLossPercentage: number;
  };
  
  // Template clauses
  standardClauses: {
    responsibilities: string[];
    restrictions: string[];
    liabilities: string[];
    insurance: string;
    maintenance: string;
  };
  
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgreementSignature {
  userId: string;
  userName: string;
  agreementId: string;
  signatureData: string; // Base64 encoded signature
  ipAddress: string;
  userAgent: string;
  signedAt: Timestamp;
  isValid: boolean;
}

// Helper functions
export const generateAgreementNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  return `RA-${year}${month}${day}-${random}`;
};

export const calculateLateFee = (
  agreement: RentalAgreement, 
  returnDate: Date
): number => {
  const expectedReturn = agreement.rentalPeriod.endDate.toDate();
  const gracePeriod = agreement.policies.lateFees.gracePeriod * 60 * 60 * 1000; // Convert hours to milliseconds
  
  // Add grace period to expected return time
  const graceEndTime = new Date(expectedReturn.getTime() + gracePeriod);
  
  // If returned within grace period, no fee
  if (returnDate <= graceEndTime) return 0;
  
  // Calculate days late (rounded up)
  const msLate = returnDate.getTime() - graceEndTime.getTime();
  const daysLate = Math.ceil(msLate / (24 * 60 * 60 * 1000));
  
  // Calculate fee
  const dailyFee = agreement.policies.lateFees.dailyRate;
  const totalFee = daysLate * dailyFee;
  
  // Apply maximum fee limit
  return Math.min(totalFee, agreement.policies.lateFees.maximumFee);
};

export const calculateDamageFee = (
  agreement: RentalAgreement,
  damageLevel: 'minor' | 'major' | 'total'
): number => {
  const itemValue = agreement.property.estimatedValue;
  const percentages = agreement.policies.damageFees;
  
  switch (damageLevel) {
    case 'minor':
      return itemValue * (percentages.minorDamage / 100);
    case 'major':
      return itemValue * (percentages.majorDamage / 100);
    case 'total':
      return itemValue * (percentages.totalLoss / 100);
    default:
      return 0;
  }
};

export const isAgreementExpired = (agreement: RentalAgreement): boolean => {
  const now = new Date();
  const endDate = agreement.rentalPeriod.endDate.toDate();
  return now > endDate;
};

export const getDaysUntilReturn = (agreement: RentalAgreement): number => {
  const now = new Date();
  const endDate = agreement.rentalPeriod.endDate.toDate();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatAgreementPeriod = (agreement: RentalAgreement): string => {
  const start = agreement.rentalPeriod.startDate.toDate();
  const end = agreement.rentalPeriod.endDate.toDate();
  
  const startStr = start.toLocaleDateString();
  const endStr = end.toLocaleDateString();
  
  return `${startStr} - ${endStr} (${agreement.rentalPeriod.duration} days)`;
};