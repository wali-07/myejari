# Blog Agents — Multi-Pass Article Pipeline

A 4-stage pipeline that turns a topic brief into a publish-ready
`BlogPost` JSON for `src/lib/posts.ts`. Each stage is a focused agent
with its own role prompt. The pipeline runs as **subagents inside a
Claude Code session**, using the active Claude subscription — no
Anthropic API key required, no per-token cost on top of the subscription
already powering the session.

## Why this exists

Single-shot article generation produces flabby, hedge-everything prose
and misses brand/liability rules. Separating drafting, SEO, editing, and
legal review into role-specific passes — each with the same brand
context but a different lens — produces tighter copy and a real gate
against liability exposure.

## Pipeline shape

```
Topic brief
    ↓
[Drafter]  — produces a complete 1.5–2.5k word BlogPost JSON
    ↓
[SEO]      — revises title, meta, keywords, H2 sequencing, internal links
    ↓
[Editor]   — polishes prose for brand voice, tightens CTAs, verifies structure
    ↓
[Legal]    — scans for liability, fixes inline, returns approved=true|false
    ↓
If approved → insert into posts.ts → commit → push
If not     → halt and surface issues to the human
```

## How Claude Code invokes the pipeline

When the user asks for the next article (e.g. "next article", "write the
next one", "go"), Claude Code follows this procedure:

### Step 1 — Pick the topic

1. Read
   `~/.claude/projects/.../memory/project_blog_publishing_queue.md` to
   find the next `⏳` article. The queue carries slug, target keywords,
   and category.
2. If the user named a specific topic in their request, use that
   instead.
3. Pull GSC data for related keywords from `data/gsc/` (if present and
   recent) to bias the SEO pass toward queries with high impressions /
   low CTR.

### Step 2 — Assemble the topic brief

The brief is a plain object passed to each agent:

```ts
interface TopicBrief {
  topic: string;            // Working title or topic phrase
  slug: string;              // kebab-case
  category: string;          // One of the allowed categories
  targetKeywords: string[];  // 5–6 search-intent phrases
  outline?: string[];        // Optional H2 hints
  existingSlugs: string[];   // All slugs currently in posts.ts (for cross-linking)
  gscQueries?: Array<{       // Optional — recent high-impression queries
    query: string;
    impressions: number;
    position: number;
    ctr: number;
  }>;
}
```

The "existingSlugs" list is derived from `posts.ts` at orchestration
time (read the file, extract every `slug:` field).

### Step 3 — Run the 4 subagents in sequence

Claude Code spawns each subagent via the `Agent` tool with
`subagent_type: "general-purpose"`. Each invocation passes:

1. The role-specific system prompt (one of the four `prompts/*.ts`
   exports).
2. The topic brief as JSON.
3. The previous stage's output as JSON.

The subagent reads the role prompt + brand context (already embedded in
the prompt), processes the input, and returns a JSON code block. The
orchestrator parses it and feeds it to the next stage.

```
Drafter:   { topic brief }                            → BlogPost #1
SEO:       { topic brief, gscQueries, BlogPost #1 }   → BlogPost #2
Editor:    { topic brief, BlogPost #2 }               → BlogPost #3
Legal:     { BlogPost #3 }                            → { approved, issues, revisedPost }
```

### Step 4 — Handle the legal verdict

- `approved: true, issues: []` → straight to commit
- `approved: true, issues: [...]` → commit; the issues list goes into
  the commit message body as "Legal review: ..."
- `approved: false, issues: [...]` → halt. Surface the issues to the
  user with the unmodified post. Ask whether to manually rework or
  abandon.

### Step 5 — Insert and ship

If approved:

1. Use the `Edit` tool to insert the `revisedPost` JSON as a new entry
   in the `posts` array in `src/lib/posts.ts` (after the last existing
   entry, before the closing `]`). Maintain the comment-block visual
   style ("// ────── N) Title ──────").
2. Run `npx tsc --noEmit -p tsconfig.json` and fix any type errors.
3. Update the publishing queue memory file
   (`project_blog_publishing_queue.md`): change the topic's `⏳` to
   `✅` with the date.
4. Commit with message:

   ```
   blog: add "{title}"

   Pipeline: drafter → seo → editor → legal (auto).
   Legal review: {summary of issues fixed, or "no issues found"}.

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```

5. Push to `main`. Vercel auto-deploys.
6. Remind the user to request indexing in Google Search Console for
   the new URL.

## Cost model

Each pipeline run = 4 subagent invocations. Each subagent is a full
Claude session under the user's subscription. For a 1-article-per-week
cadence the impact on the 5-hour rolling quota is negligible. For
volume publishing (multiple articles in one sitting) the quota may
become the bottleneck.

This pipeline does NOT use the Anthropic API and does NOT require an
`ANTHROPIC_API_KEY`. It is bound to Claude Code sessions specifically.

## Future migration to API

If the workflow ever needs to run outside Claude Code (CI, scheduled
job, bulk publish), the same prompt files plug straight into a Node
script using `@anthropic-ai/sdk`. The brand context is already isolated
in `brand-context.ts` and the role prompts each import it — nothing to
restructure. Recommended target models (mix strategy):

- Drafter: Opus 4.7 (quality matters most for the foundational draft)
- SEO: Sonnet 4.6
- Editor: Sonnet 4.6
- Legal: Opus 4.7 (sharper scrutiny worth the cost on the gate)

Estimated API cost per article with that mix: ~$0.10–0.20.
