import type { PathBranch, StudentProfile } from "@/lib/schemas";

export type PathMapState = {
  profile: StudentProfile;
  branches: PathBranch[];
  selectedBranchId: string | null;
};

export type PathMapAction =
  | { type: "select"; branchId: string }
  | { type: "clear" };

export function createPathMapState(
  profile: StudentProfile,
  branches: PathBranch[],
): PathMapState {
  return {
    profile,
    branches,
    selectedBranchId: null,
  };
}

export function pathMapReducer(
  state: PathMapState,
  action: PathMapAction,
): PathMapState {
  if (action.type === "clear") {
    return state.selectedBranchId === null
      ? state
      : { ...state, selectedBranchId: null };
  }

  if (!state.branches.some((branch) => branch.id === action.branchId)) {
    return state;
  }

  return state.selectedBranchId === action.branchId
    ? state
    : { ...state, selectedBranchId: action.branchId };
}
