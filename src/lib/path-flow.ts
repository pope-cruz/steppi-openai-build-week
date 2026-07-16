import type { PathBranch, StudentProfile } from "@/lib/schemas";

export type PathRequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; branches: PathBranch[] }
  | {
      status: "error";
      code: string;
      message: string;
      retryable: boolean;
    };

export type PathFlowState = {
  confirmedProfile: StudentProfile;
  request: PathRequestState;
};

export type PathFlowAction =
  | { type: "confirm"; profile: StudentProfile }
  | { type: "start" }
  | { type: "succeed"; branches: PathBranch[] }
  | {
      type: "fail";
      code: string;
      message: string;
      retryable: boolean;
    };

export function pathFlowReducer(
  state: PathFlowState | null,
  action: PathFlowAction,
): PathFlowState | null {
  if (action.type === "confirm") {
    return { confirmedProfile: action.profile, request: { status: "idle" } };
  }

  if (!state) {
    return state;
  }

  if (action.type === "start") {
    return { ...state, request: { status: "loading" } };
  }

  if (action.type === "succeed") {
    return {
      ...state,
      request: { status: "success", branches: action.branches },
    };
  }

  return {
    ...state,
    request: {
      status: "error",
      code: action.code,
      message: action.message,
      retryable: action.retryable,
    },
  };
}
