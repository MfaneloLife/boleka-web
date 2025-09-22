import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RentalAgreement, AgreementTemplate, generateAgreementNumber } from '@/src/types/rental-agreement';

export class RentalAgreementService {
  private static readonly AGREEMENTS_COLLECTION = 'rentalAgreements';
  private static readonly TEMPLATES_COLLECTION = 'agreementTemplates';
  private static readonly SIGNATURES_COLLECTION = 'agreementSignatures';

  // Create a new rental agreement from an order
  static async createAgreementFromOrder(orderId: string): Promise<string> {
    try {
      // Get order details
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      const order = orderDoc.data();

      // Get item details
      const itemDoc = await getDoc(doc(db, 'items', order.items[0].itemId));
      if (!itemDoc.exists()) {
        throw new Error('Item not found');
      }
      const item = itemDoc.data();

      // Get user details
      const [ownerDoc, renterDoc] = await Promise.all([
        getDoc(doc(db, 'users', order.vendorId)),
        getDoc(doc(db, 'users', order.userId))
      ]);

      if (!ownerDoc.exists() || !renterDoc.exists()) {
        throw new Error('User information not found');
      }

      const owner = ownerDoc.data();
      const renter = renterDoc.data();

      // Calculate rental period (default to 7 days if not specified)
      const startDate = Timestamp.now();
      const endDate = new Timestamp(
        startDate.seconds + (7 * 24 * 60 * 60), // 7 days in seconds
        startDate.nanoseconds
      );

      // Get default template
      const template = await this.getDefaultTemplate();

      const agreement: Omit<RentalAgreement, 'id'> = {
        agreementNumber: generateAgreementNumber(),
        orderId,
        
        owner: {
          id: order.vendorId,
          name: owner.name || owner.displayName,
          email: owner.email,
          phone: owner.phone,
          address: owner.address,
        },
        
        renter: {
          id: order.userId,
          name: renter.name || renter.displayName,
          email: renter.email,
          phone: renter.phone,
          address: renter.address,
        },
        
        property: {
          itemId: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          condition: item.condition,
          serialNumber: item.serialNumber,
          images: item.images || [],
          estimatedValue: item.price * 2, // Estimate value as 2x daily rate
        },
        
        rentalPeriod: {
          startDate,
          endDate,
          duration: 7,
          pickupTime: '10:00 AM',
          returnTime: '6:00 PM',
          pickupLocation: item.location,
          returnLocation: item.location,
        },
        
        financial: {
          dailyRate: item.price,
          totalDays: 7,
          subtotal: item.price * 7,
          securityDeposit: item.price * 2, // 2 days worth as security
          platformFee: (item.price * 7) * 0.08, // 8% platform fee
          totalAmount: order.totalAmount,
          currency: 'ZAR',
          paymentMethod: order.paymentMethod,
          paymentDueDate: startDate, // Payment due on start date
        },
        
        policies: {
          lateFees: {
            dailyRate: template?.defaultTerms.lateFeePerDay || 50,
            gracePeriod: template?.defaultTerms.gracePeriodHours || 2,
            maximumFee: (item.price * 7) * ((template?.defaultTerms.maxLateFeePercentage || 50) / 100),
          },
          damageFees: {
            minorDamage: template?.defaultTerms.minorDamagePercentage || 10,
            majorDamage: template?.defaultTerms.majorDamagePercentage || 50,
            totalLoss: template?.defaultTerms.totalLossPercentage || 100,
          },
          returnPolicy: {
            condition: 'Item must be returned in the same condition as received',
            cleaningRequired: true,
            inspectionRequired: true,
            returnInstructions: 'Contact owner 2 hours before return to arrange inspection',
          },
          cancellationPolicy: {
            ownerCancellation: 'Owner may cancel up to 24 hours before rental with full refund',
            renterCancellation: 'Renter may cancel up to 24 hours before rental with full refund',
            refundPolicy: 'Refunds processed within 3-5 business days',
          },
        },
        
        specialTerms: [
          'Renter assumes full responsibility for item during rental period',
          'Any damages must be reported immediately to the owner',
          'Item must not be sublet or loaned to third parties',
        ],
        
        restrictions: [
          'Item must remain within specified location area',
          'No modifications or alterations to the item',
          'Professional use requires additional agreement',
        ],
        
        includedAccessories: item.accessories || [],
        
        status: 'draft',
        governingLaw: 'Laws of South Africa',
        disputeResolution: 'Disputes resolved through Boleka platform mediation',
        
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        documentVersion: 1,
      };

      const agreementRef = await addDoc(collection(db, this.AGREEMENTS_COLLECTION), agreement);
      return agreementRef.id;
    } catch (error) {
      console.error('Error creating rental agreement:', error);
      throw error;
    }
  }

  // Get rental agreement by ID
  static async getAgreement(agreementId: string): Promise<RentalAgreement | null> {
    try {
      const agreementDoc = await getDoc(doc(db, this.AGREEMENTS_COLLECTION, agreementId));
      
      if (!agreementDoc.exists()) {
        return null;
      }

      return {
        id: agreementDoc.id,
        ...agreementDoc.data()
      } as RentalAgreement;
    } catch (error) {
      console.error('Error getting rental agreement:', error);
      throw error;
    }
  }

  // Get agreements for a user
  static async getUserAgreements(
    userId: string, 
    role: 'owner' | 'renter' | 'both' = 'both'
  ): Promise<RentalAgreement[]> {
    try {
      const queries = [];

      if (role === 'owner' || role === 'both') {
        queries.push(
          query(
            collection(db, this.AGREEMENTS_COLLECTION),
            where('owner.id', '==', userId),
            orderBy('createdAt', 'desc')
          )
        );
      }

      if (role === 'renter' || role === 'both') {
        queries.push(
          query(
            collection(db, this.AGREEMENTS_COLLECTION),
            where('renter.id', '==', userId),
            orderBy('createdAt', 'desc')
          )
        );
      }

      const snapshots = await Promise.all(queries.map(q => getDocs(q)));
      
      const agreements: RentalAgreement[] = [];
      snapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          agreements.push({
            id: doc.id,
            ...doc.data()
          } as RentalAgreement);
        });
      });

      // Remove duplicates and sort by creation date
      const uniqueAgreements = agreements.filter((agreement, index, self) => 
        self.findIndex(a => a.id === agreement.id) === index
      );

      return uniqueAgreements.sort((a, b) => 
        b.createdAt.toMillis() - a.createdAt.toMillis()
      );
    } catch (error) {
      console.error('Error getting user agreements:', error);
      throw error;
    }
  }

  // Update rental agreement
  static async updateAgreement(
    agreementId: string, 
    updates: Partial<RentalAgreement>
  ): Promise<void> {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, this.AGREEMENTS_COLLECTION, agreementId), updateData);
    } catch (error) {
      console.error('Error updating rental agreement:', error);
      throw error;
    }
  }

  // Sign agreement
  static async signAgreement(
    agreementId: string,
    userId: string,
    signatureData: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      const agreement = await this.getAgreement(agreementId);
      if (!agreement) {
        throw new Error('Agreement not found');
      }

      // Determine if user is owner or renter
      const isOwner = agreement.owner.id === userId;
      const isRenter = agreement.renter.id === userId;

      if (!isOwner && !isRenter) {
        throw new Error('User is not a party to this agreement');
      }

      // Record signature
      const signatureDoc = {
        userId,
        userName: isOwner ? agreement.owner.name : agreement.renter.name,
        agreementId,
        signatureData,
        ipAddress,
        userAgent,
        signedAt: serverTimestamp(),
        isValid: true,
      };

      await addDoc(collection(db, this.SIGNATURES_COLLECTION), signatureDoc);

      // Update agreement with signature
      const signatureUpdate = {
        signature: signatureData,
        signedAt: serverTimestamp() as Timestamp,
      };

      if (isOwner) {
        await this.updateAgreement(agreementId, {
          owner: { ...agreement.owner, ...signatureUpdate }
        });
      } else {
        await this.updateAgreement(agreementId, {
          renter: { ...agreement.renter, ...signatureUpdate }
        });
      }

      // Check if both parties have signed
      const updatedAgreement = await this.getAgreement(agreementId);
      if (updatedAgreement?.owner.signedAt && updatedAgreement?.renter.signedAt) {
        await this.updateAgreement(agreementId, {
          status: 'signed',
          signedAt: serverTimestamp() as Timestamp,
        });
      } else {
        await this.updateAgreement(agreementId, {
          status: 'pending_signatures'
        });
      }
    } catch (error) {
      console.error('Error signing agreement:', error);
      throw error;
    }
  }

  // Get default template
  static async getDefaultTemplate(): Promise<AgreementTemplate | null> {
    try {
      const templatesQuery = query(
        collection(db, this.TEMPLATES_COLLECTION),
        where('isActive', '==', true),
        where('name', '==', 'Standard Rental Agreement')
      );

      const snapshot = await getDocs(templatesQuery);
      
      if (snapshot.empty) {
        // Create default template if it doesn't exist
        return await this.createDefaultTemplate();
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as AgreementTemplate;
    } catch (error) {
      console.error('Error getting default template:', error);
      return null;
    }
  }

  // Create default template
  static async createDefaultTemplate(): Promise<AgreementTemplate> {
    try {
      const template: Omit<AgreementTemplate, 'id'> = {
        name: 'Standard Rental Agreement',
        description: 'Default template for rental agreements',
        category: 'general',
        
        defaultTerms: {
          lateFeePerDay: 50,
          securityDepositPercentage: 200, // 200% of daily rate
          gracePeriodHours: 2,
          maxLateFeePercentage: 50, // 50% of total rental value
          minorDamagePercentage: 10,
          majorDamagePercentage: 50,
          totalLossPercentage: 100,
        },
        
        standardClauses: {
          responsibilities: [
            'Renter is responsible for the care and safe keeping of the rented item',
            'Renter must use the item only for its intended purpose',
            'Renter must return the item in the same condition as received',
            'Owner must ensure the item is clean and in working condition',
            'Owner must provide accurate description and condition of the item',
          ],
          restrictions: [
            'Item may not be modified, altered, or repaired without owner consent',
            'Item may not be sublet or loaned to third parties',
            'Item must remain in specified geographical area',
            'Commercial use requires separate agreement',
          ],
          liabilities: [
            'Renter assumes full liability for loss, theft, or damage during rental period',
            'Owner is not liable for any injuries resulting from use of the item',
            'Platform serves as mediator but is not liable for disputes',
          ],
          insurance: 'Renter is encouraged to verify their insurance coverage for rented items',
          maintenance: 'Basic maintenance and cleaning is the responsibility of the renter',
        },
        
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const templateRef = await addDoc(collection(db, this.TEMPLATES_COLLECTION), template);
      
      return {
        id: templateRef.id,
        ...template
      } as AgreementTemplate;
    } catch (error) {
      console.error('Error creating default template:', error);
      throw error;
    }
  }

  // Check if agreement can be modified
  static canModifyAgreement(agreement: RentalAgreement, userId: string): boolean {
    // Can only modify if user is a party and agreement is in draft or pending signatures
    const isParty = agreement.owner.id === userId || agreement.renter.id === userId;
    const canModify = ['draft', 'pending_signatures'].includes(agreement.status);
    
    return isParty && canModify;
  }

  // Check if user can sign agreement
  static canSignAgreement(agreement: RentalAgreement, userId: string): boolean {
    const isOwner = agreement.owner.id === userId;
    const isRenter = agreement.renter.id === userId;
    
    if (!isOwner && !isRenter) return false;
    
    // Can sign if agreement is draft or pending signatures and user hasn't signed yet
    const validStatus = ['draft', 'pending_signatures'].includes(agreement.status);
    const hasntSigned = isOwner ? !agreement.owner.signedAt : !agreement.renter.signedAt;
    
    return validStatus && hasntSigned;
  }
}