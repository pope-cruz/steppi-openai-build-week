import type { PathBranch, ResearchNode, StudentProfile } from "@/lib/schemas";

export type ResearchRequestState =
  | { status: "idle" }
  | {
      status: "starting" | "queued" | "in_progress" | "cancelling";
      branchId: string;
      question: string;
    }
  | { status: "cancelled"; branchId: string; question: string }
  | { status: "success"; branchId: string; question: string; nodes: ResearchNode[] }
  | { status: "no_useful_sources"; branchId: string; question: string }
  | {
      status: "error";
      branchId: string;
      question: string;
      code: string;
      message: string;
      retryable: boolean;
    };

export type ResearchFlowState = {
  profile: StudentProfile;
  branches: PathBranch[];
  request: ResearchRequestState;
};

export type ResearchFlowAction =
  | { type: "start"; branchId: string; question: string }
  | {
      type: "pending";
      branchId: string;
      question: string;
      status: "queued" | "in_progress";
    }
  | { type: "cancelling"; branchId: string; question: string }
  | { type: "cancelled"; branchId: string; question: string }
  | { type: "succeed"; branchId: string; question: string; nodes: ResearchNode[] }
  | { type: "no_useful_sources"; branchId: string; question: string }
  | {
      type: "fail";
      branchId: string;
      question: string;
      code: string;
      message: string;
      retryable: boolean;
    };

export function createResearchFlowState(
  profile: StudentProfile,
  branches: PathBranch[],
): ResearchFlowState {
  return { profile, branches, request: { status: "idle" } };
}

type ActiveResearchRequest = Extract<
  ResearchRequestState,
  { status: "starting" | "queued" | "in_progress" | "cancelling" }
>;

export function isResearchRequestActive(
  request: ResearchRequestState,
): request is ActiveResearchRequest {
  return (
    request.status === "starting" ||
    request.status === "queued" ||
    request.status === "in_progress" ||
    request.status === "cancelling"
  );
}

export function researchFlowReducer(
  state: ResearchFlowState,
  action: ResearchFlowAction,
): ResearchFlowState {
  if (!state.branches.some((branch) => branch.id === action.branchId)) {
    return state;
  }

  if (action.type === "start") {
    return {
      ...state,
      request: {
        status: "starting",
        branchId: action.branchId,
        question: action.question,
      },
    };
  }

  if (action.type === "pending") {
    return {
      ...state,
      request: {
        status: action.status,
        branchId: action.branchId,
        question: action.question,
      },
    };
  }

  if (action.type === "cancelling" || action.type === "cancelled") {
    return {
      ...state,
      request: {
        status: action.type,
        branchId: action.branchId,
        question: action.question,
      },
    };
  }

  if (action.type === "succeed") {
    if (action.nodes.some((node) => node.parentBranchId !== action.branchId)) {
      return state;
    }
    return {
      ...state,
      request: {
        status: "success",
        branchId: action.branchId,
        question: action.question,
        nodes: action.nodes,
      },
    };
  }

  if (action.type === "no_useful_sources") {
    return {
      ...state,
      request: {
        status: "no_useful_sources",
        branchId: action.branchId,
        question: action.question,
      },
    };
  }

  return {
    ...state,
    request: {
      status: "error",
      branchId: action.branchId,
      question: action.question,
      code: action.code,
      message: action.message,
      retryable: action.retryable,
    },
  };
}
