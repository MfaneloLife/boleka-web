import CryptoJS from 'crypto-js';

// PayFast configuration
const PAYFAST_CONFIG = {
  merchantId: process.env.PAYFAST_MERCHANT_ID || '17739107',
  merchantKey: process.env.PAYFAST_MERCHANT_KEY || 'm2hpqzhb9yvsr',
  passPhrase: process.env.PAYFAST_PASS_PHRASE || '',
  testMode: process.env.NODE_ENV !== 'production',
  returnUrl: process.env.PAYFAST_RETURN_URL || 'http://localhost:3000/payment/success',
  cancelUrl: process.env.PAYFAST_CANCEL_URL || 'http://localhost:3000/payment/cancel',
  notifyUrl: process.env.PAYFAST_NOTIFY_URL || 'http://localhost:3000/api/payment/notify',
};

// PayFast API endpoints
const PAYFAST_ENDPOINTS = {
  process: process.env.PAYFAST_API_URL || 'https://sandbox.payfast.co.za/eng/process',
  query: process.env.PAYFAST_API_URL || 'https://sandbox.payfast.co.za/eng/query/validate',
};

export interface PaymentData {
  amount: number;
  itemName: string;
  itemDescription?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  customStr1?: string; // Usually request/order ID
  customStr2?: string; // Can be used for additional data
  customStr3?: string; // Can be used for additional data
  customStr4?: string; // Can be used for additional data
  customStr5?: string; // Can be used for additional data
}

/**
 * Generate PayFast payment form data including signature
 */
export function generatePaymentFormData(payment: PaymentData): Record<string, string> {
  // Required fields
  const data: Record<string, string> = {
    'merchant_id': PAYFAST_CONFIG.merchantId,
    'merchant_key': PAYFAST_CONFIG.merchantKey,
    'return_url': PAYFAST_CONFIG.returnUrl,
    'cancel_url': PAYFAST_CONFIG.cancelUrl,
    'notify_url': PAYFAST_CONFIG.notifyUrl,
    'amount': payment.amount.toFixed(2),
    'item_name': payment.itemName,
    'email_address': payment.email,
  };

  // Optional fields
  if (payment.itemDescription) data['item_description'] = payment.itemDescription;
  if (payment.firstName) data['name_first'] = payment.firstName;
  if (payment.lastName) data['name_last'] = payment.lastName;
  if (payment.customStr1) data['custom_str1'] = payment.customStr1;
  if (payment.customStr2) data['custom_str2'] = payment.customStr2;
  if (payment.customStr3) data['custom_str3'] = payment.customStr3;
  if (payment.customStr4) data['custom_str4'] = payment.customStr4;
  if (payment.customStr5) data['custom_str5'] = payment.customStr5;

  // Add signature
  data['signature'] = generateSignature(data, PAYFAST_CONFIG.passPhrase);

  // Add test mode if enabled
  if (PAYFAST_CONFIG.testMode) {
    data['testing'] = 'true';
  }

  return data;
}

/**
 * Generate PayFast signature for secure payment processing
 */
function generateSignature(data: Record<string, string>, passPhrase: string = ''): string {
  // Create parameter string
  let pfOutput = '';
  
  // Sort the array by key
  const keys = Object.keys(data).sort();
  
  // Construct the parameter string
  keys.forEach(key => {
    if (key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}&`;
    }
  });

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);
  
  // Add passphrase if not empty
  if (passPhrase !== '') {
    pfOutput += `&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, '+')}`;
  }

  // Generate signature using MD5
  return CryptoJS.MD5(pfOutput).toString();
}

/**
 * Validate an ITN (Instant Transaction Notification) from PayFast
 */
export async function validatePayment(pfData: Record<string, string>): Promise<{valid: boolean, message: string}> {
  try {
    // Step 1: Check signature
    const signature = pfData.signature;
    const calculatedSignature = generateSignature(
      Object.fromEntries(
        Object.entries(pfData).filter(([key]) => key !== 'signature')
      ), 
      PAYFAST_CONFIG.passPhrase
    );
    
    if (signature !== calculatedSignature) {
      return { valid: false, message: 'Invalid signature' };
    }
    
    // Step 2: Verify payment data with PayFast server
    const pfParamString = Object.entries(pfData)
      .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
      .join('&');
    
    const response = await fetch(PAYFAST_ENDPOINTS.query, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: pfParamString,
    });
    
    const responseText = await response.text();
    
    if (responseText.trim() !== 'VALID') {
      return { valid: false, message: `PayFast validation failed: ${responseText}` };
    }
    
    // Step 3: Check payment status
    if (pfData.payment_status !== 'COMPLETE') {
      return { valid: false, message: `Payment not complete: ${pfData.payment_status}` };
    }
    
    return { valid: true, message: 'Payment validated successfully' };
  } catch (error) {
    console.error('PayFast validation error:', error);
    return { valid: false, message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export default {
  generatePaymentFormData,
  validatePayment,
  PAYFAST_ENDPOINTS,
};
