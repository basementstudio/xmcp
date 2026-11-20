import { z } from "zod";
import {
  acceptedContent,
  inputRequired,
  inputResponse,
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";

export const schema = {
  project: z.string().describe("The project to invite the teammate to"),
};

export const metadata: ToolMetadata = {
  name: "invite-teammate",
  description:
    "Invite a teammate to a project, asking the user who and with which role",
};

const invitation = z.object({
  email: z.string().email(),
  role: z.enum(["viewer", "editor"]),
});

export default function inviteTeammate(
  { project }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const response = inputResponse(extra.inputResponses, "invitation");
  if (response.kind === "elicit" && response.action !== "accept") {
    return `No invitation sent for "${project}".`;
  }

  const invite = acceptedContent(
    extra.inputResponses,
    "invitation",
    invitation
  );
  if (!invite) {
    return inputRequired({
      inputRequests: {
        invitation: inputRequired.elicit({
          message: `Who should join "${project}"?`,
          requestedSchema: {
            type: "object",
            properties: {
              email: { type: "string", format: "email", title: "Email" },
              role: {
                type: "string",
                title: "Role",
                enum: ["viewer", "editor"],
                default: "viewer",
              },
            },
            required: ["email", "role"],
          },
        }),
      },
    });
  }

  return `Invited ${invite.email} to "${project}" as ${invite.role}.`;
}
