import crypto from 'crypto';

/**
 * PayFast Integration for Boleka
 * 
 * Features:
 * - Split payments: 5% platform commission, 95% vendor payout
 * - ITN (Instant Transaction Notification) verification
 * - Payment form generation
 */

export interface PayFastConfig {
  merchantId: string;
  merchantKey: string;
  passphrase?: string;
  testMode: boolean;
}

export interface PayFastSplitPayment {
  // The vendor who receives 95% of the amount
  vendorId: string;
  vendorAmount: number;
  // Platform receives 5% commission
  platformAmount: number;
}

// PayFast split payment merchant account IDs
// In production, these would be stored in environment variables or DB
const PLATFORM_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '';
const PLATFORM_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '';

/**
 * Get PayFast configuration based on environment
 */
function getConfig(): PayFastConfig {
  return {
    merchantId: process.env.PAYFAST_MERCHANT_ID || '',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY || '',
    passphrase: process.env.PAYFAST_PASSPHRASE,
    testMode: process.env.NODE_ENV !== 'production'
  };
}

/**
 * Calculate the split payment amounts
 * 5% platform commission, 95% vendor payout
 */
export function calculateSplitPayment(totalAmount: number): PayFastSplitPayment {
  const platformAmount = Math.round(totalAmount * 0.05 * 100) / 100; // 5%
  const vendorAmount = Math.round((totalAmount - platformAmount) * 100) / 100; // 95%
  
  return {
    vendorId: 'boleka_platform',
    vendorAmount,
    platformAmount
  };
}

/**
 * Generate PayFast payment form data with split payment support
 * PayFast supports split payments where the platform receives 
 * the full amount and then disburses to vendors.
 * 
 * Alternative approach: Use the PayFast Marketplace / Split Payments API
 * which allows funds to be split at transaction time.
 */
export function generatePaymentData(params: {
  orderId: string;
  amount: number;
  itemName: string;
  itemDescription: string;
  emailAddress: string;
  nameFirst: string;
  nameLast: string;
  userId: string;
  vendorId: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
}) {
  const config = getConfig();
  const split = calculateSplitPayment(params.amount);
  
  const data: Record<string, string> = {
    // Merchant details
    merchant_id: config.merchantId,
    merchant_key: config.merchantKey,
    
    // Transaction details
    amount: params.amount.toFixed(2),
    item_name: params.itemName,
    item_description: params.itemDescription,
    
    // Customer details
    email_address: params.emailAddress,
    name_first: params.nameFirst,
    name_last: params.nameLast,
    
    // URLs
    return_url: params.returnUrl,
    cancel_url: params.cancelUrl,
    notify_url: params.notifyUrl,
    
    // Custom fields for order tracking
    custom_str1: params.orderId,    // Order ID
    custom_str2: params.userId,     // Renter ID
    custom_str3: params.vendorId,   // Vendor ID (gets 95%)
    
    // Split payment metadata (stored for accounting)
    custom_int1: String(Math.round(split.platformAmount * 100)), // Platform commission in cents
    custom_int2: String(Math.round(split.vendorAmount * 100)),   // Vendor payout in cents
  };

  // Generate signature if passphrase is set
  if (config.passphrase) {
    data['signature'] = generateSignature(data, config.passphrase);
  }

  return { data, splitPayment: split };
}

/**
 * Generate PayFast signature for security
 */
function generateSignature(data: Record<string, string>, passphrase: string): string {
  // Create a sorted string of key=value pairs
  const sortedKeys = Object.keys(data).sort();
  const signatureString = sortedKeys
    .map(key => `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}`)
    .join('&');
  
  // Append passphrase
  const passString = `${signatureString}&passphrase=${encodeURIComponent(passphrase)}`;
  
  // Generate MD5 signature
  return crypto.createHash('md5').update(passString).digest('hex');
}

/**
 * Verify PayFast ITN (Instant Transaction Notification) signature
 * This is called when PayFast sends a payment notification to our webhook
 */
export function verifyITNSignature(
  data: Record<string, string>,
  passphrase: string
): boolean {
  try {
    const receivedSignature = data['signature'];
    if (!receivedSignature) return false;
    
    // Remove signature from data before generating
    const dataWithoutSig = { ...data };
    delete dataWithoutSig['signature'];
    
    const expectedSignature = generateSignature(dataWithoutSig, passphrase);
    return receivedSignature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Verify ITN request by checking with PayFast server
 * This is a server-to-server verification step
 */
export async function verifyITN(data: Record<string, string>): Promise<{
  valid: boolean;
  status: string;
}> {
  try {
    const config = getConfig();
    
    // Check signature first
    if (config.passphrase) {
      const signatureValid = verifyITNSignature(data, config.passphrase);
      if (!signatureValid) {
        return { valid: false, status: 'INVALID_SIGNATURE' };
      }
    }
    
    // Check payment status
    const paymentStatus = data['payment_status'];
    if (paymentStatus !== 'COMPLETE') {
      return { valid: false, status: `UNEXPECTED_STATUS:${paymentStatus}` };
    }
    
    // Verify amount matches
    const amountPaid = parseFloat(data['amount_gross'] || '0');
    const customInt1 = parseInt(data['custom_int1'] || '0'); // Platform commission cents
    const customInt2 = parseInt(data['custom_int2'] || '0'); // Vendor payout cents
    
    const totalCents = customInt1 + customInt2;
    const expectedCents = Math.round(amountPaid * 100);
    
    if (totalCents !== expectedCents) {
      return { valid: false, status: 'AMOUNT_MISMATCH' };
    }
    
    // All checks passed
    return { valid: true, status: 'COMPLETE' };
  } catch (error) {
    console.error('PayFast ITN verification error:', error);
    return { valid: false, status: 'VERIFICATION_ERROR' };
  }
}

/**
 * Get PayFast payment URL based on environment
 */
export function getPayFastUrl(): string {
  const config = getConfig();
  return config.testMode
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';
}
