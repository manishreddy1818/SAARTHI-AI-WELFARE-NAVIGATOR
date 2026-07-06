import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import listRecommendationsTool from "./tools/list-recommendations";
import listApplicationsTool from "./tools/list-applications";

// Direct Supabase host required for OAuth issuer (see app-mcp-server-authoring).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "saarthi-mcp",
  title: "SAARTHI Welfare Navigator",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in citizen's SAARTHI account. Use `get_profile` to read their profile, `list_recommendations` to find welfare schemes they may qualify for, and `list_applications` to see the schemes they have saved or applied to.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfileTool, listRecommendationsTool, listApplicationsTool],
});