import { FirebaseDbService } from './firebase-db';

export async function checkProfileCompletion(userId: string): Promise<{
  needsProfileSetup: boolean;
  hasBusinessProfile: boolean;
  hasClientProfile: boolean;
  profileComplete: boolean;
}> {
  try {
    // Get user data
    const userResult = await FirebaseDbService.getUserById(userId);
    if (!userResult.success || !userResult.user) {
      return {
        needsProfileSetup: true,
        hasBusinessProfile: false,
        hasClientProfile: false,
        profileComplete: false
      };
    }

    // Check for client profile
    const clientProfileResult = await FirebaseDbService.getClientProfileByUserId(userId);
    const hasClientProfile = clientProfileResult.success && 
      clientProfileResult.profile &&
      clientProfileResult.profile.province &&
      clientProfileResult.profile.city &&
      clientProfileResult.profile.preferences;

    // Check for business profile
    const businessProfileResult = await FirebaseDbService.getBusinessProfileByUserId(userId);
    const hasBusinessProfile = businessProfileResult.success && 
      businessProfileResult.profile &&
      businessProfileResult.profile.businessName &&
      businessProfileResult.profile.province &&
      businessProfileResult.profile.city &&
      businessProfileResult.profile.suburb &&
      businessProfileResult.profile.phone &&
      businessProfileResult.profile.access;

    // User needs profile setup if they don't have a complete profile
    const needsProfileSetup = !hasClientProfile && !hasBusinessProfile;
    const profileComplete = hasClientProfile || hasBusinessProfile;

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
