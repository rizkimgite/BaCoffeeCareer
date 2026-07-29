export type RegistrationStatus = "pending" | "verified" | "rejected";

export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export type BusinessRegistration = {
  id: string;
  phoneNumber: string;
  ownerFullName: string;
  ownerNik: string;
  ownerNpwp: string;
  ownerEmail: string;
  ktpPhotoUrl?: string;
  selfiePhotoUrl?: string;
  businessFrontPhotoUrl?: string;
  menuPhotoUrl?: string;
  businessName: string;
  businessCategory: string;
  businessNib: string;
  businessAddress: string;
  facilities?: string[];
  status: RegistrationStatus;
  submittedAt?: FirestoreTimestamp | null;
};

export type ConsumerRegistration = {
  id: string;
  phoneNumber: string;
  status: RegistrationStatus;
  submittedAt?: FirestoreTimestamp | null;
};
