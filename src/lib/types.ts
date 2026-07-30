export type RegistrationStatus = "pending" | "verified" | "rejected" | "suspended";

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

export type BroadcastSegment = "bisnis" | "bacoffee" | "keduanya";

export type BroadcastRelatedFeature =
  | "monitoring_kedai"
  | "monitoring_pasar"
  | "ai_helper"
  | "ads"
  | "bundle_premium";

export type PlatformBroadcast = {
  id: string;
  title: string;
  imageUrl: string;
  targetSegment: BroadcastSegment;
  linkTo?: string | null;
  relatedFeature?: BroadcastRelatedFeature | null;
  startAt: FirestoreTimestamp;
  expiresAt: FirestoreTimestamp;
  createdAt?: FirestoreTimestamp | null;
};
