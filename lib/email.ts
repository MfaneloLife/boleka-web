import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Centralized email notification system
// All outgoing mail is sent from E-BOLEKA's notifications address.
// ---------------------------------------------------------------------------

export const EMAIL_FROM = 'E-BOLEKA <notifications@eboleka.co.za>';

// Resend enforces a maximum of 100 emails per batch request.
export const RESEND_BATCH_LIMIT = 100;

/**
 * Resend's payload shape for a single email in a batch/send call.
 * Keeping this local (rather than importing Resend's internal types)
 * makes the module resilient to SDK type changes.
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Optional reply-to address */
  replyTo?: string;
}

export type EmailSendResult =
  | { success: true; id?: string }
  | { success: false; error: string };

export type BatchSendResult =
  | { success: true; batches: number; total: number }
  | { success: false; error: string; batches: number; total: number };

let resendClient: Resend | null = null;

/**
 * Lazily initializes the Resend client. Returns `null` when the API key is
 * missing so callers can safely no-op instead of crashing the application.
 */
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    console.warn(
      '[email] RESEND_API_KEY is not configured. Outgoing emails are disabled.'
    );
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

/**
 * Sends a single 1-to-1 transactional email.
 *
 * Any error returned from the Resend API (or thrown by the SDK) is captured
 * and returned as `{ success: false, error }` — it will never be re-thrown,
 * so Server Actions / API routes that call this cannot crash on email failure.
 */
export async function sendTransactionalEmail(
  message: EmailMessage
): Promise<EmailSendResult> {
  const client = getResendClient();
  if (!client) {
    return { success: false, error: 'Resend is not configured' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: EMAIL_FROM,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });

    if (error) {
      console.error('[email] Failed to send transactional email', {
        to: message.to,
        error,
      });
      return { success: false, error: error.message ?? 'Unknown Resend error' };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[email] Unexpected error sending email', {
      to: message.to,
      err,
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected email error',
    };
  }
}

/**
 * Splits an array into chunks of at most `size` elements.
 */
function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Sends a batch of emails to potentially many recipients.
 *
 * Resend's `batch.send()` accepts at most 100 emails per request, so the
 * incoming array is automatically split into chunks of 100. Each chunk is
 * sent concurrently via `Promise.all` for throughput while remaining within
 * Resend's hard limits. Failures are captured per-chunk and reported back
 * without throwing.
 */
export async function sendBatchBroadcast(
  messages: EmailMessage[]
): Promise<BatchSendResult> {
  const client = getResendClient();
  if (!client) {
    return { success: false, error: 'Resend is not configured', batches: 0, total: messages.length };
  }

  if (messages.length === 0) {
    return { success: true, batches: 0, total: 0 };
  }

  const chunks = chunkArray(messages, RESEND_BATCH_LIMIT);

  try {
    const results = await Promise.allSettled(
      chunks.map(async (chunk) => {
        const { data, error } = await client.batch.send(
          chunk.map((message) => ({
            from: EMAIL_FROM,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.replyTo ? { replyTo: message.replyTo } : {}),
          }))
        );

        if (error) {
          throw new Error(error.message ?? 'Unknown Resend batch error');
        }

        return data;
      })
    );

    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      failed.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('[email] Batch chunk failed', result.reason);
        }
      });
      return {
        success: false,
        error: `${failed.length} of ${chunks.length} batch(es) failed`,
        batches: chunks.length,
        total: messages.length,
      };
    }

    return {
      success: true,
      batches: chunks.length,
      total: messages.length,
    };
  } catch (err) {
    console.error('[email] Unexpected error sending broadcast', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected broadcast error',
      batches: chunks.length,
      total: messages.length,
    };
  }
}

// ---------------------------------------------------------------------------
// Notification builders
// These produce typed, ready-to-send payloads for the three notification
// types and delegate to the core send functions above.
// ---------------------------------------------------------------------------

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://eboleka.co.za';

function emailShell(bodyHtml: string): string {
  return `
    <div style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
              <tr>
                <td style="background-color:#16a34a;padding:24px 32px;">
                  <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">E-BOLEKA</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:32px;">
                  ${bodyHtml}
                </td>
              </tr>
              <tr>
                <td style="padding:20px 32px;background-color:#fafafa;border-top:1px solid #e4e4e7;">
                  <p style="margin:0;color:#71717a;font-size:12px;line-height:1.5;">
                    You received this email because you are a member of E-BOLEKA.
                    <br />
                    <a href="${BASE_URL}" style="color:#16a34a;text-decoration:none;">Visit eboleka.co.za</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export interface RentalRequestEmailInput {
  ownerEmail: string;
  ownerName?: string | null;
  requesterName?: string | null;
  itemTitle: string;
  requestId: string;
  message?: string | null;
}

/**
 * 1. Rental request — notify the item owner.
 */
export function sendRentalRequestEmail(
  input: RentalRequestEmailInput
): Promise<EmailSendResult> {
  const title = input.itemTitle || 'your item';
  const preview = input.message?.trim()
    ? `They included a message: “${input.message.trim().slice(0, 200)}”`
    : '';

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#18181b;font-size:16px;">
      Hi ${input.ownerName || 'there'},
    </p>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      Good news — <strong>${input.requesterName || 'Someone'}</strong> requested to rent
      <strong>${title}</strong>.
    </p>
    ${preview ? `<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;font-style:italic;">${preview}</p>` : ''}
    <p style="margin:0 0 24px;">
      <a href="${BASE_URL}/dashboard/requests/${input.requestId}" style="display:inline-block;background-color:#16a34a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">View request</a>
    </p>
  `;

  return sendTransactionalEmail({
    to: input.ownerEmail,
    subject: `New rental request for ${title}`,
    html: emailShell(bodyHtml),
    text: `Hi ${input.ownerName || 'there'}, ${input.requesterName || 'Someone'} requested to rent ${title}. View the request at ${BASE_URL}/dashboard/requests/${input.requestId}`,
  });
}

export interface NewMessageEmailInput {
  recipientEmail: string;
  recipientName?: string | null;
  senderName?: string | null;
  messagePreview: string;
  itemTitle?: string | null;
  requestId: string;
}

/**
 * 2. New message — notify the recipient (the other party in a conversation).
 */
export function sendNewMessageEmail(
  input: NewMessageEmailInput
): Promise<EmailSendResult> {
  const preview = input.messagePreview || 'You have a new message.';
  const subjectLine = input.itemTitle
    ? `New message about ${input.itemTitle}`
    : 'New message received';

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#18181b;font-size:16px;">
      Hi ${input.recipientName || 'there'},
    </p>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      <strong>${input.senderName || 'Someone'}</strong> sent you a new message.
    </p>
    <p style="margin:0 0 16px;padding:16px;background-color:#f4f4f5;border-left:4px solid #16a34a;color:#3f3f46;font-size:15px;line-height:1.6;border-radius:6px;">
      ${preview}
    </p>
    <p style="margin:0 0 24px;">
      <a href="${BASE_URL}/messages/${input.requestId}" style="display:inline-block;background-color:#16a34a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reply now</a>
    </p>
  `;

  return sendTransactionalEmail({
    to: input.recipientEmail,
    subject: subjectLine,
    html: emailShell(bodyHtml),
    text: `Hi ${input.recipientName || 'there'}, ${input.senderName || 'Someone'} sent you a new message: ${preview}. Reply at ${BASE_URL}/messages/${input.requestId}`,
  });
}

export interface NewItemBroadcastInput {
  itemTitle: string;
  itemDescription?: string | null;
  price?: number | null;
  category?: string | null;
  ownerName?: string | null;
}

/**
 * 3. New item broadcast — notify every user in the database.
 * Callers should fetch all user emails and pass them in.
 */
export function buildNewItemBroadcastMessages(
  emails: string[],
  input: NewItemBroadcastInput
): EmailMessage[] {
  const priceText =
    input.price !== undefined && input.price !== null
      ? `R${Number(input.price).toFixed(2)}`
      : null;

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#18181b;font-size:16px;">Hello,</p>
    <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">
      A new item has just been listed on E-BOLEKA:
    </p>
    <h2 style="margin:0 0 8px;color:#18181b;font-size:20px;">${input.itemTitle}</h2>
    ${input.ownerName ? `<p style="margin:0 0 8px;color:#71717a;font-size:14px;">Listed by ${input.ownerName}</p>` : ''}
    ${input.category ? `<p style="margin:0 0 8px;color:#3f3f46;font-size:14px;">Category: ${input.category}</p>` : ''}
    ${priceText ? `<p style="margin:0 0 16px;color:#16a34a;font-size:18px;font-weight:bold;">${priceText}</p>` : ''}
    ${input.itemDescription ? `<p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6;">${input.itemDescription}</p>` : ''}
    <p style="margin:0 0 24px;">
      <a href="${BASE_URL}" style="display:inline-block;background-color:#16a34a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Browse items</a>
    </p>
  `;

  return emails
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({
      to: email,
      subject: `New item on E-BOLEKA: ${input.itemTitle}`,
      html: emailShell(bodyHtml),
      text: `A new item has been listed on E-BOLEKA: ${input.itemTitle}${priceText ? ` (${priceText})` : ''}. Browse at ${BASE_URL}`,
    }));
}