import { FirestoreService } from './firestore';

export async function checkProfileCompletion(userId: string): Promise<{
  needsProfileSetup: boolean;
  hasBusinessProfile: boolean;
  hasClientProfile: boolean;
  profileComplete: boolean;
}> {
  try {
    // Check for user profile in Firestore
    const userProfileResult = await FirestoreService.getDocuments('users', {
      where: { field: 'uid', operator: '==', value: userId }
    });

    if (!userProfileResult.success || !userProfileResult.data || userProfileResult.data.length === 0) {
      // No user profile found, needs profile setup
      return {
        needsProfileSetup: true,
        hasBusinessProfile: false,
        hasClientProfile: false,
        profileComplete: false
      };
    }

    // Check for client profile in Firestore
    const clientProfileResult = await FirestoreService.getDocuments('clientProfiles', {
      where: { field: 'uid', operator: '==', value: userId }
    });

    const hasClientProfile = clientProfileResult.success &&
      Array.isArray(clientProfileResult.data) &&
      clientProfileResult.data.length > 0;

    // Check for business profile in Firestore
    const businessProfileResult = await FirestoreService.getDocuments('businessProfiles', {
      where: { field: 'uid', operator: '==', value: userId }
    });

    const hasBusinessProfile = businessProfileResult.success &&
      Array.isArray(businessProfileResult.data) &&
      businessProfileResult.data.length > 0;

    // User needs profile setup if they don't have any profile
    const needsProfileSetup = !hasClientProfile && !hasBusinessProfile;
    const profileComplete = !!(hasClientProfile || hasBusinessProfile);

    return {
      needsProfileSetup,
      hasBusinessProfile: !!hasBusinessProfile,
      hasClientProfile: !!hasClientProfile,
      profileComplete
    };
  } catch (error) {
    console.error('Error checking profile completion:', error);
    return {
      needsProfileSetup: true,
      hasBusinessProfile: false,
      hasClientProfile: false,
      profileComplete: false
    };
  }
}
