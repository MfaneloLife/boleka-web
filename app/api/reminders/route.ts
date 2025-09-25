import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ReminderService } from '@/src/lib/reminder-service';
import { adminDb } from '@/src/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    if (type === 'pending') {
      // Restrict: only users with a business profile OR explicit admin flag
      const userEmail = session.user.email;
      const usersSnap = await adminDb.collection('users').where('email','==',userEmail).limit(1).get();
      let userDoc = usersSnap.empty ? null : usersSnap.docs[0];
      let isAdmin = false;
      if (userDoc) {
        const data:any = userDoc.data();
        isAdmin = !!data.isAdmin;
      }
      let hasBusiness = false;
      if (userDoc) {
        const bizSnap = await adminDb.collection('businessProfiles').where('userId','==',userDoc.id).limit(1).get();
        hasBusiness = !bizSnap.empty;
      }
      if (!isAdmin && !hasBusiness) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      const reminders = await ReminderService.getPendingReminders(
        limit ? parseInt(limit) : undefined
      );
      return NextResponse.json({ reminders, count: reminders.length });
    }

    // Get user's reminders (ownership enforced)
    const reminders = await ReminderService.getUserReminders(session.user.id);

    return NextResponse.json({
      reminders,
      count: reminders.length
    });

  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, agreementId } = body;

    switch (type) {
      case 'schedule_return_reminders': {
        // Get agreement and verify authorization
        const { RentalAgreementService } = await import('@/src/lib/rental-agreement-service');
        const agreement = await RentalAgreementService.getAgreement(agreementId);
        
        if (!agreement) {
          return NextResponse.json(
            { error: 'Agreement not found' },
            { status: 404 }
          );
        }

        // Check if user is authorized (owner or renter)
        const canAccess = agreement.owner.id === session.user.id || 
                         agreement.renter.id === session.user.id;
        
        if (!canAccess) {
          return NextResponse.json(
            { error: 'Unauthorized to schedule reminders for this agreement' },
            { status: 403 }
          );
        }

        const reminderIds = await ReminderService.scheduleReturnReminders(agreement);

        return NextResponse.json({
          success: true,
          reminderIds,
          message: 'Return reminders scheduled successfully'
        });
      }

      case 'schedule_pickup_reminder': {
        const { RentalAgreementService } = await import('@/src/lib/rental-agreement-service');
        const agreement = await RentalAgreementService.getAgreement(agreementId);
        
        if (!agreement) {
          return NextResponse.json(
            { error: 'Agreement not found' },
            { status: 404 }
          );
        }

        const canAccess = agreement.owner.id === session.user.id || 
                         agreement.renter.id === session.user.id;
        
        if (!canAccess) {
          return NextResponse.json(
            { error: 'Unauthorized to schedule reminders for this agreement' },
            { status: 403 }
          );
        }

        const reminderId = await ReminderService.schedulePickupReminder(agreement);

        return NextResponse.json({
          success: true,
          reminderId,
          message: 'Pickup reminder scheduled successfully'
        });
      }

      case 'schedule_late_notice': {
        // Only owners can schedule late notices
        const { RentalAgreementService } = await import('@/src/lib/rental-agreement-service');
        const agreement = await RentalAgreementService.getAgreement(agreementId);
        
        if (!agreement) {
          return NextResponse.json(
            { error: 'Agreement not found' },
            { status: 404 }
          );
        }

        if (agreement.owner.id !== session.user.id) {
          return NextResponse.json(
            { error: 'Only the item owner can schedule late notices' },
            { status: 403 }
          );
        }

        const reminderId = await ReminderService.scheduleLateNotice(agreementId);

        return NextResponse.json({
          success: true,
          reminderId,
          message: 'Late notice scheduled successfully'
        });
      }

      case 'cancel_reminders': {
        const { RentalAgreementService } = await import('@/src/lib/rental-agreement-service');
        const agreement = await RentalAgreementService.getAgreement(agreementId);
        
        if (!agreement) {
          return NextResponse.json(
            { error: 'Agreement not found' },
            { status: 404 }
          );
        }

        const canAccess = agreement.owner.id === session.user.id || 
                         agreement.renter.id === session.user.id;
        
        if (!canAccess) {
          return NextResponse.json(
            { error: 'Unauthorized to cancel reminders for this agreement' },
            { status: 403 }
          );
        }

        await ReminderService.cancelAgreementReminders(agreementId);

        return NextResponse.json({
          success: true,
          message: 'Reminders cancelled successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid reminder type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error processing reminder request:', error);
    return NextResponse.json(
      { error: 'Failed to process reminder request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reminderId, status, metadata } = body;

    // Allow any authenticated user for now
    // TODO: Implement proper role-based access control
    // Users can only mark their own reminders as read/dismissed
    if (!['delivered', 'opened', 'clicked'].includes(status)) {
      // For now, allow all status updates for authenticated users
      // TODO: Add check to ensure user owns the reminder or has admin role
    }

    await ReminderService.updateReminderStatus(reminderId, status, metadata);

    return NextResponse.json({
      success: true,
      message: 'Reminder status updated successfully'
    });

  } catch (error) {
    console.error('Error updating reminder status:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder status' },
      { status: 500 }
    );
  }
}