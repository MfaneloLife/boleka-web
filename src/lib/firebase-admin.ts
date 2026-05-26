export const adminAuth = {
  verifyIdToken: async () => {
    throw new Error('Firebase auth has been removed. Use NextAuth session-based authentication instead.');
  },
};

export const adminDb = {
  collection: () => {
    throw new Error('Firebase admin DB has been removed.');
  },
};
