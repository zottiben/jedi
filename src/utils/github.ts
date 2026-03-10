import { exec } from "./git";

export interface ThreadComment {
  id: number;
  author: string;
  body: string;
  createdAt: string;
  isJedi: boolean;
}

export async function postGitHubComment(
  repo: string,
  issueNumber: number,
  body: string,
): Promise<void> {
  await exec([
    "gh", "api",
    `repos/${repo}/issues/${issueNumber}/comments`,
    "-f", `body=${body}`,
  ]);
}

export async function reactToComment(
  repo: string,
  commentId: number,
  reaction: string,
): Promise<void> {
  await exec([
    "gh", "api",
    `repos/${repo}/issues/comments/${commentId}/reactions`,
    "-f", `content=${reaction}`,
  ]);
}

/**
 * Fetch all comments on an issue/PR to reconstruct conversation history.
 */
export async function fetchCommentThread(
  repo: string,
  issueNumber: number,
): Promise<ThreadComment[]> {
  const { stdout, exitCode } = await exec([
    "gh", "api",
    `repos/${repo}/issues/${issueNumber}/comments`,
    "--paginate",
    "--jq",
    `.[] | {id: .id, author: .user.login, body: .body, createdAt: .created_at}`,
  ]);

  if (exitCode !== 0 || !stdout.trim()) return [];

  const comments: ThreadComment[] = [];
  for (const line of stdout.trim().split("\n")) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      comments.push({
        id: parsed.id,
        author: parsed.author,
        body: parsed.body,
        createdAt: parsed.createdAt,
        // Detect Jedi's own comments by the header
        isJedi: parsed.body.includes("### ⚔️ Jedi"),
      });
    } catch {
      // skip malformed lines
    }
  }

  return comments;
}

/**
 * Build a conversation history string from the comment thread.
 * Includes previous "Hey Jedi" commands, Jedi responses, and user feedback.
 */
export function buildConversationContext(
  thread: ThreadComment[],
  currentCommentId: number,
): { history: string; previousJediRuns: number; isFollowUp: boolean } {
  // Filter to only Jedi-related comments (commands, responses, feedback between them)
  const jediSegments: ThreadComment[] = [];
  let inJediConversation = false;

  for (const comment of thread) {
    // Don't include the current triggering comment
    if (comment.id === currentCommentId) break;

    if (/hey\s+jedi/i.test(comment.body)) {
      inJediConversation = true;
      jediSegments.push(comment);
    } else if (inJediConversation) {
      // Include all comments between "Hey Jedi" triggers and Jedi responses
      jediSegments.push(comment);
      if (comment.isJedi) {
        // Jedi responded — keep tracking for follow-up feedback
      }
    }
  }

  const previousJediRuns = jediSegments.filter((c) => c.isJedi).length;

  // Determine if this is a follow-up to an existing Jedi conversation
  const isFollowUp = previousJediRuns > 0;

  if (jediSegments.length === 0) {
    return { history: "", previousJediRuns: 0, isFollowUp: false };
  }

  // Format as conversation log
  const lines: string[] = ["## Previous Conversation", ""];
  for (const comment of jediSegments) {
    const role = comment.isJedi ? "Jedi" : `@${comment.author}`;
    // Truncate long Jedi responses to keep context manageable
    let body = comment.body;
    if (comment.isJedi && body.length > 2000) {
      body = body.slice(0, 2000) + "\n\n... (truncated)";
    }
    lines.push(`**${role}** (${comment.createdAt}):`);
    lines.push(body);
    lines.push("");
  }

  return { history: lines.join("\n"), previousJediRuns, isFollowUp };
}

export function formatJediComment(
  response: string,
): string {
  return [
    `### ⚔️ Jedi`,
    ``,
    response,
  ].join("\n");
}

export function formatErrorComment(
  command: string,
  summary: string,
): string {
  return [
    `### ⚔️ Jedi`,
    ``,
    `**${command} failed.** ${summary}`,
  ].join("\n");
}
