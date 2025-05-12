// Add the isActive property to the User type
declare global {
  namespace PrismaJson {
    interface UserExtensions {
      isActive?: boolean;
      reactivationRequested?: boolean;
      deactivationReason?: string | null;
      reactivationRequestedAt?: Date | null;
    }
  }
}

// Extend the User model with our new properties
declare module "@prisma/client" {
  interface User {
    isActive?: boolean;
    reactivationRequested?: boolean;
    deactivationReason?: string | null;
    reactivationRequestedAt?: Date | null;
  }
}

export {};
