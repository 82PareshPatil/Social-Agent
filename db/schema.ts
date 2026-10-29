// Application table mappings for the final state of Free/migrations/*.sql.
// SQL migrations remain authoritative for RLS, checks, indexes and auth.users FKs.
// Declaring these mappings does not create tables in the remote database.
import { sql } from 'drizzle-orm';
import {
  pgTable, pgSchema, serial, bigserial, bigint, integer, text, uuid, boolean,
  timestamp, jsonb, primaryKey, unique, customType,
} from 'drizzle-orm/pg-core';

const id = () => bigserial('id', { mode: 'bigint' }).primaryKey();
const owner = () => uuid('user_id').notNull();
const campaign = () => integer('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' });
const created = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();
const metadata = () => jsonb('metadata').notNull().default({});
const planRef = () => bigint('plan_id', { mode: 'bigint' }).references(() => agentPlans.id, { onDelete: 'cascade' });
const taskRef = () => bigint('task_id', { mode: 'bigint' }).references(() => agentTasks.id, { onDelete: 'cascade' });
const runRef = () => bigint('task_run_id', { mode: 'bigint' }).references(() => agentTaskRuns.id, { onDelete: 'set null' });
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });

// InsForge owns auth.users; this is only a foreign-key reference.
const authUsers = pgSchema('auth').table('users', { id: uuid('id').primaryKey() });

export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'cascade' }),
  name: text('name'),
  email: text('email').notNull().unique(),
  createdAt: created(),
});

export type UserProfile = typeof users.$inferSelect;

export const campaigns = pgTable('campaigns', {
  id: serial('id').primaryKey(), userId: owner(), name: text('name').notNull(),
  icon: text('icon'), iconUrl: text('icon_url'), iconKey: text('icon_key'),
  officeImage: text('office_image').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agentMessages = pgTable('agent_messages', {
  id: id(), userId: owner(), campaignId: campaign(),
  agentId: text('agent_id', { enum: ['master', 'research', 'creator', 'scheduler', 'analytics'] }).notNull(),
  sender: text('sender', { enum: ['user', 'agent'] }).notNull(), text: text('text').notNull(),
  failed: boolean('failed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agentPlans = pgTable('agent_plans', {
  id: id(), userId: owner(), campaignId: campaign(), title: text('title').notNull(),
  request: text('request').notNull(),
  status: text('status', { enum: ['in_progress', 'awaiting_user', 'completed', 'failed', 'cancelled'] }).notNull().default('in_progress'),
  summary: text('summary'), error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(), completedAt: timestamp('completed_at'),
});

export const agentTasks = pgTable('agent_tasks', {
  id: id(), planId: planRef().notNull(), userId: owner(), campaignId: campaign(),
  agentId: text('agent_id', { enum: ['research', 'creator', 'scheduler', 'analytics'] }).notNull(),
  position: integer('position').notNull().default(0), title: text('title').notNull(),
  instructions: text('instructions').notNull(),
  dependsOn: bigint('depends_on', { mode: 'bigint' }).array().notNull().default(sql`'{}'::bigint[]`),
  status: text('status', { enum: ['pending', 'queued', 'in_progress', 'in_review', 'awaiting_input', 'waiting_for_user', 'completed', 'failed', 'cancelled', 'expired'] }).notNull().default('pending'),
  output: text('output'), question: text('question'), review: text('review'),
  revisions: integer('revisions').notNull().default(0), attempts: integer('attempts').notNull().default(0),
  error: text('error'), startedAt: timestamp('started_at'), completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull().defaultNow(),
  repeat: jsonb('repeat'), nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  runCount: integer('run_count').notNull().default(0),
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  queueSeq: integer('queue_seq').notNull().default(0), runOwner: text('run_owner'),
  sandboxId: text('sandbox_id'), runState: text('run_state'), interruption: jsonb('interruption'),
  currentStep: text('current_step'), waitingSince: timestamp('waiting_since', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export const agentCommunications = pgTable('agent_communications', {
  id: id(), userId: owner(), campaignId: campaign(), planId: planRef().notNull(), taskId: taskRef(),
  fromAgent: text('from_agent').notNull(), toAgent: text('to_agent').notNull(),
  kind: text('kind', { enum: ['assignment', 'question', 'answer', 'update', 'result', 'review', 'clarification', 'error'] }).notNull(),
  text: text('text').notNull(), createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const agentTaskRuns = pgTable('agent_task_runs', {
  id: id(), taskId: taskRef().notNull(), userId: owner(), campaignId: campaign(),
  queueSeq: integer('queue_seq').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  inngestRunId: text('inngest_run_id').notNull(),
  status: text('status', { enum: ['in_progress', 'completed', 'failed', 'cancelled'] }).notNull().default('in_progress'),
  output: text('output'), error: text('error'), result: jsonb('result'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (t) => [unique().on(t.taskId, t.queueSeq)]);

export const agentArtifacts = pgTable('agent_artifacts', {
  id: id(), userId: owner(), campaignId: campaign(), planId: planRef(), taskId: taskRef(), taskRunId: runRef(),
  agentId: text('agent_id'), type: text('type', { enum: ['image', 'video', 'document', 'data', 'link'] }).notNull(),
  name: text('name').notNull(), url: text('url'), imagekitFileId: text('imagekit_file_id'),
  sandboxPath: text('sandbox_path'), mimeType: text('mime_type'), metadata: metadata(), createdAt: created(),
});

export const sandboxPreviews = pgTable('sandbox_previews', {
  campaignId: campaign(), userId: owner(), agentId: text('agent_id').notNull(),
  image: text('image').notNull(), takenAt: timestamp('taken_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.campaignId, t.agentId] })]);

export const agentSandboxes = pgTable('agent_sandboxes', {
  campaignId: campaign(), agentId: text('agent_id').notNull(), userId: owner(), sandboxId: text('sandbox_id'),
  status: text('status', { enum: ['none', 'starting', 'running', 'paused', 'killed'] }).notNull().default('none'),
  activeAt: timestamp('active_at', { withTimezone: true }),
  taskId: bigint('task_id', { mode: 'bigint' }).references(() => agentTasks.id, { onDelete: 'set null' }),
  leaseUntil: timestamp('lease_until', { withTimezone: true }),
  control: text('control', { enum: ['agent', 'user'] }).notNull().default('agent'),
  streamKey: text('stream_key'), viewKey: text('view_key'), createdAt: created(),
}, (t) => [primaryKey({ columns: [t.campaignId, t.agentId] })]);

export const researchFindings = pgTable('research_findings', {
  id: id(), userId: owner(), campaignId: campaign(), planId: planRef(), taskId: taskRef(), taskRunId: runRef(),
  agentId: text('agent_id').notNull(), topic: text('topic').notNull(), summary: text('summary').notNull(),
  method: text('method', { enum: ['knowledge', 'live', 'mixed'] }).notNull(),
  platforms: text('platforms').array().notNull().default(sql`'{}'::text[]`),
  hashtags: text('hashtags').array().notNull().default(sql`'{}'::text[]`),
  findings: jsonb('findings').notNull().default([]), sources: jsonb('sources').notNull().default([]),
  createdAt: created(), updatedAt: updated(),
});

export const contentDrafts = pgTable('content_drafts', {
  id: id(), userId: owner(), campaignId: campaign(), planId: planRef(), taskId: taskRef(), taskRunId: runRef(),
  agentId: text('agent_id').notNull(),
  kind: text('kind', { enum: ['post', 'caption', 'thread', 'script', 'carousel', 'hashtags', 'idea'] }).notNull(),
  platform: text('platform').notNull(), title: text('title').notNull(), hook: text('hook'),
  body: text('body').notNull(), cta: text('cta'),
  hashtags: text('hashtags').array().notNull().default(sql`'{}'::text[]`),
  media: jsonb('media').notNull().default([]), notes: text('notes'),
  status: text('status', { enum: ['draft', 'approved', 'archived'] }).notNull().default('draft'),
  metadata: metadata(), createdAt: created(), updatedAt: updated(),
});

export const agentOutputs = pgTable('agent_outputs', {
  id: id(), userId: owner(), campaignId: campaign(), planId: planRef().notNull(),
  taskId: taskRef().notNull(), taskRunId: runRef(), runNumber: integer('run_number').notNull(),
  agentId: text('agent_id').notNull(), kind: text('kind', { enum: ['research', 'content', 'schedule', 'report'] }).notNull(),
  title: text('title').notNull(), summary: text('summary'), details: text('details'),
  output: text('output').notNull(), review: text('review'), metadata: metadata(), createdAt: created(),
  search: tsvector('search').generatedAlwaysAs(sql`to_tsvector('english', title || ' ' || coalesce(summary, '') || ' ' || coalesce(details, output))`),
}, (t) => [unique().on(t.taskId, t.runNumber)]);

export const posts = pgTable('posts', {
  id: id(), userId: owner(), campaignId: campaign(),
  source: text('source', { enum: ['manual', 'ai'] }).notNull().default('manual'),
  draftId: bigint('draft_id', { mode: 'bigint' }).references(() => contentDrafts.id, { onDelete: 'set null' }),
  title: text('title').notNull(), caption: text('caption').notNull().default(''),
  hashtags: text('hashtags').array().notNull().default(sql`'{}'::text[]`),
  platforms: text('platforms').array().notNull(), media: jsonb('media').notNull().default([]),
  status: text('status', { enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'] }).notNull().default('scheduled'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }), timeZone: text('time_zone').notNull().default('UTC'),
  platformResults: jsonb('platform_results').notNull().default({}), accountIds: jsonb('account_ids').notNull().default({}),
  error: text('error'), publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: created(), updatedAt: updated(),
});

export const userIntegrations = pgTable('user_integrations', {
  id: id(), userId: owner(), provider: text('provider', { enum: ['blotato'] }).notNull(),
  apiKeyEncrypted: text('api_key_encrypted').notNull(), keyHint: text('key_hint').notNull(),
  accounts: jsonb('accounts').notNull().default([]),
  accountsRefreshedAt: timestamp('accounts_refreshed_at', { withTimezone: true }),
  createdAt: created(), updatedAt: updated(),
}, (t) => [unique().on(t.userId, t.provider)]);

export const postAnalytics = pgTable('post_analytics', {
  id: id(), userId: owner(), blotatoPostId: text('blotato_post_id').notNull(),
  campaignId: integer('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
  postId: bigint('post_id', { mode: 'bigint' }).references(() => posts.id, { onDelete: 'set null' }),
  accountId: text('account_id'), platform: text('platform').notNull(),
  state: text('state', { enum: ['published', 'failed'] }).notNull(),
  postedAt: timestamp('posted_at', { withTimezone: true }).notNull(),
  text: text('text'), postUrl: text('post_url'), error: text('error'),
  views: bigint('views', { mode: 'bigint' }), likes: bigint('likes', { mode: 'bigint' }),
  comments: bigint('comments', { mode: 'bigint' }), shares: bigint('shares', { mode: 'bigint' }),
  saves: bigint('saves', { mode: 'bigint' }), reach: bigint('reach', { mode: 'bigint' }),
  impressions: bigint('impressions', { mode: 'bigint' }), rawMetrics: jsonb('raw_metrics'),
  metricsHistory: jsonb('metrics_history').notNull().default([]),
  metricsFetchedAt: timestamp('metrics_fetched_at', { withTimezone: true }),
  syncedAt: timestamp('synced_at', { withTimezone: true }).notNull().defaultNow(), createdAt: created(),
}, (t) => [unique().on(t.userId, t.blotatoPostId)]);

export const analyticsSyncs = pgTable('analytics_syncs', {
  userId: owner().primaryKey(), lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }).notNull().defaultNow(),
  lastError: text('last_error'), postsSynced: integer('posts_synced').notNull().default(0),
});
