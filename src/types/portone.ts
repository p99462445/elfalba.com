/**
 * PortOne V2 Identity Verification Type Definitions
 */

export type PortOneVersion = "V1" | "V2";

export type IdentityVerificationOperator = "SKT" | "KT" | "LGU" | "SKT_ALTE" | "KT_ALTE" | "LGU_ALTE";

export type IdentityVerificationMethod = "SMS" | "APP";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type IdentityVerificationStatus = "READY" | "VERIFIED" | "FAILED";

export interface IdentityVerificationVerifiedCustomer {
    id?: string;
    name: string;
    birthDate: string; // YYYY-MM-DD
    gender: Gender;
    phoneNumber: string;
    operator: IdentityVerificationOperator;
    ci: string;
    di?: string;
}

export interface VerifiedIdentityVerification {
    status: "VERIFIED";
    id: string; // identityVerificationId
    channel: {
        id: string;
        key: string;
        name: string;
    };
    verifiedCustomer: IdentityVerificationVerifiedCustomer;
    requestedAt: string;
    verifiedAt: string;
}

export interface ReadyIdentityVerification {
    status: "READY";
    id: string;
}

export interface FailedIdentityVerification {
    status: "FAILED";
    id: string;
    failure: {
        reason: string;
        pgCode?: string;
        pgMessage?: string;
    };
}

export type IdentityVerification =
    | ReadyIdentityVerification
    | VerifiedIdentityVerification
    | FailedIdentityVerification;

// Error Types
export interface PortOneError {
    type: string;
    message?: string;
}

export interface PgProviderError extends PortOneError {
    type: "PG_PROVIDER";
    pgCode: string;
    pgMessage: string;
}
