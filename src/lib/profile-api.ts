import type { StudentProfile } from "@/lib/schemas";

export type ProfileApiErrorCode =
  | "invalid_input"
  | "configuration_missing"
  | "invalid_model_configuration"
  | "timeout"
  | "api_failure"
  | "malformed_model_output";

export type ProfileApiSuccess = {
  ok: true;
  profile: StudentProfile;
};

export type ProfileApiFailure = {
  ok: false;
  error: {
    code: ProfileApiErrorCode;
    message: string;
    retryable: boolean;
  };
};

export type ProfileApiResponse = ProfileApiSuccess | ProfileApiFailure;
