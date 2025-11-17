import { UserProfile } from "./types";

type LoadResult = {
  value: string;
};

export function toResult(input: string): LoadResult {
  return { value: input };
}

export function resolveUser(profile: UserProfile): string {
  return `${profile.id}-${profile.name}`;
}
