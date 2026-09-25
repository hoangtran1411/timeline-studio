import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'timeline.db');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(dbPath);
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS timelines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT 'default',
      parent_timeline_id TEXT,
      branch_point_node_id TEXT,
      order_index INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      timeline_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT DEFAULT 'planned',
      priority TEXT DEFAULT 'medium',
      order_index INTEGER DEFAULT 0,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS dependencies (
      id TEXT PRIMARY KEY,
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      type TEXT DEFAULT 'blocks',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (to_node_id) REFERENCES nodes(id) ON DELETE CASCADE
    );
  `);

  // Run column migration for existing databases
  const columns = db.prepare('PRAGMA table_info(timelines)').all() as Array<{ name: string }>;
  const colNames = new Set(columns.map(c => c.name));
  if (!colNames.has('is_archived')) {
    db.exec('ALTER TABLE timelines ADD COLUMN is_archived INTEGER DEFAULT 0');
  }
  if (!colNames.has('is_visible')) {
    db.exec('ALTER TABLE timelines ADD COLUMN is_visible INTEGER DEFAULT 1');
  }

  // Seed default data if timelines table is empty
  const count = (db.prepare('SELECT COUNT(*) as count FROM timelines').get() as { count: number }).count;
  if (count === 0) {
    seedDefaultData(db);
  }
}

function seedDefaultData(db: DatabaseSync) {
  const insertTimeline = db.prepare(`
    INSERT INTO timelines (id, title, description, color, parent_timeline_id, branch_point_node_id, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertNode = db.prepare(`
    INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDep = db.prepare(`
    INSERT INTO dependencies (id, from_node_id, to_node_id, type)
    VALUES (?, ?, ?, ?)
  `);

  // Track 1: Main Roadmap
  insertTimeline.run(
    'track-main',
    'Main Roadmap (Core v1.0)',
    'Primary development track for core platform features',
    'zinc',
    null,
    null,
    0
  );

  // Track 2: Competitor Tracking (Independent)
  insertTimeline.run(
    'track-competitor',
    'Competitor Benchmark (TechNova)',
    'External market release tracking and comparative milestones',
    'stone',
    null,
    null,
    1
  );

  // Track 3: Branch from Track 1 (Marketing / Feature branch)
  insertTimeline.run(
    'track-branch-gtm',
    'Go-To-Market & Launch (Branch from Alpha)',
    'Branched off Alpha testing for PR, media rollout, and beta access',
    'neutral',
    'track-main',
    'node-alpha',
    2
  );

  // Track 1 Nodes
  insertNode.run(
    'node-research',
    'track-main',
    'Market Research & UX Prototyping',
    'Wireframes and user feedback interviews',
    '2026-07-12',
    '2026-07-28',
    'completed',
    'medium',
    0,
    '#ux,#research'
  );

  insertNode.run(
    'node-core-api',
    'track-main',
    'Core Architecture & Microservices',
    'Database modeling, auth and high-throughput pipelines',
    '2026-08-05',
    '2026-08-25',
    'completed',
    'high',
    1,
    '#backend,#api'
  );

  insertNode.run(
    'node-alpha',
    'track-main',
    'Internal Alpha Testing (Closed)',
    'End-to-end dogfooding with security regression audit',
    '2026-09-15',
    '2026-10-10',
    'in_progress',
    'high',
    2,
    '#qa,#release'
  );

  insertNode.run(
    'node-public-beta',
    'track-main',
    'Public Beta Release',
    'Early access program for 5,000 waitlisted teams',
    '2026-10-20',
    '2026-11-15',
    'planned',
    'high',
    3,
    '#beta,#product'
  );

  insertNode.run(
    'node-launch',
    'track-main',
    'Official Global Launch v1.0',
    'General availability rollout',
    '2026-12-05',
    null,
    'planned',
    'high',
    4,
    '#milestone'
  );

  // Track 2 Nodes (Competitor)
  insertNode.run(
    'node-comp-ai',
    'track-competitor',
    'Competitor AI Teaser',
    'Prototype announcement made at tech conference',
    '2026-08-15',
    null,
    'completed',
    'low',
    0,
    '#competitor,#ai'
  );

  insertNode.run(
    'node-comp-pricing',
    'track-competitor',
    'Enterprise Price Hike (+15%)',
    'Opens window for mid-market acquisition',
    '2026-10-01',
    null,
    'completed',
    'medium',
    1,
    '#pricing'
  );

  insertNode.run(
    'node-comp-summit',
    'track-competitor',
    'Competitor Annual Summit',
    'Expected announcement of competitor v2.0',
    '2026-11-18',
    null,
    'planned',
    'medium',
    2,
    '#conference'
  );

  // Track 3 Nodes (Branch)
  insertNode.run(
    'node-teaser',
    'track-branch-gtm',
    'Teaser & Awareness Campaign',
    'Social preview and developer waitlist signups',
    '2026-09-10',
    '2026-09-30',
    'completed',
    'medium',
    0,
    '#gtm,#social'
  );

  insertNode.run(
    'node-kol-press',
    'track-branch-gtm',
    'Press Briefing & Tech Reviews',
    'Embargoed reviews with key industry analysts',
    '2026-10-25',
    null,
    'planned',
    'high',
    1,
    '#press,#reviews'
  );

  insertNode.run(
    'node-early-bird',
    'track-branch-gtm',
    'Early-Bird Launch Offer',
    'Special early-adopter tier launch campaign',
    '2026-11-24',
    '2026-11-30',
    'planned',
    'medium',
    2,
    '#campaign'
  );

  // Dependency: Alpha testing must pass before Press Briefing
  insertDep.run('dep-1', 'node-alpha', 'node-kol-press', 'blocks');
}
