import { createClient, Client } from '@libsql/client';
import path from 'node:path';
import fs from 'node:fs';

let _client: Client | null = null;
let _schemaInitialized = false;

export function getDb(): Client {
  if (!_client) {
    const isCloud = !!process.env.TURSO_DATABASE_URL;
    let url = process.env.TURSO_DATABASE_URL;

    if (!isCloud) {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      url = `file:${path.join(dataDir, 'timeline.db').replace(/\\/g, '/')}`;
    }

    _client = createClient({
      url: url!,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
  }
  return _client;
}

export async function ensureSchema(db: Client = getDb()): Promise<void> {
  if (_schemaInitialized) return;

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT 'indigo',
      icon TEXT DEFAULT 'folder',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS timelines (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT 'default',
      parent_timeline_id TEXT,
      branch_point_node_id TEXT,
      order_index INTEGER DEFAULT 0,
      is_archived INTEGER DEFAULT 0,
      is_visible INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
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
  try {
    const columnsRes = await db.execute('PRAGMA table_info(timelines)');
    const colNames = new Set(columnsRes.rows.map(c => String(c.name)));
    if (!colNames.has('is_archived')) {
      await db.execute('ALTER TABLE timelines ADD COLUMN is_archived INTEGER DEFAULT 0');
    }
    if (!colNames.has('is_visible')) {
      await db.execute('ALTER TABLE timelines ADD COLUMN is_visible INTEGER DEFAULT 1');
    }
    if (!colNames.has('project_id')) {
      await db.execute('ALTER TABLE timelines ADD COLUMN project_id TEXT');
    }
  } catch (err) {
    console.warn('Column check warning:', err);
  }

  // Seed default projects if projects table is empty
  const projectCountRes = await db.execute('SELECT COUNT(*) as count FROM projects');
  const projectCount = Number(projectCountRes.rows[0]?.count ?? 0);
  if (projectCount === 0) {
    await seedProjects(db);
  }

  // Ensure any existing timelines are assigned to the historical project
  await db.execute("UPDATE timelines SET project_id = 'proj-historical' WHERE project_id IS NULL");

  // Normalize project icons if they were saved as raw text names
  await db.executeMultiple(`
    UPDATE projects SET icon = '📜' WHERE icon = 'landmark' OR icon = 'history';
    UPDATE projects SET icon = '💡' WHERE icon = 'lightbulb' OR icon = 'idea';
  `);

  // Seed default data if timelines table is empty
  const timelineCountRes = await db.execute('SELECT COUNT(*) as count FROM timelines');
  const count = Number(timelineCountRes.rows[0]?.count ?? 0);
  if (count === 0) {
    await seedDefaultData(db);
  }

  _schemaInitialized = true;
}

async function seedProjects(db: Client) {
  await db.batch([
    {
      sql: `INSERT INTO projects (id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)`,
      args: [
        'proj-historical',
        'Historical Chronology (Lịch Sử)',
        'Comparative dynasties, civilizational milestones, and historical clashes',
        'amber',
        '📜'
      ]
    },
    {
      sql: `INSERT INTO projects (id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)`,
      args: [
        'proj-ideas',
        'Product Ideas & Roadmap (Ý Tưởng)',
        'Product brainstorming, startup experiments, feature architectures, and marketing plans',
        'emerald',
        '💡'
      ]
    },
    {
      sql: `INSERT INTO timelines (id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'track-idea-core',
        'proj-ideas',
        'AI Timeline Studio Platform v2.0',
        'Architecture and key features for next-gen timeline workspace',
        'emerald',
        null,
        null,
        0
      ]
    },
    {
      sql: `INSERT INTO timelines (id, project_id, title, description, color, parent_timeline_id, branch_point_node_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'track-idea-growth',
        'proj-ideas',
        'Growth & Launch Experiments',
        'Community engagement, developer showcase, and interactive demo templates',
        'teal',
        null,
        null,
        1
      ]
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'node-idea-multiproject',
        'track-idea-core',
        'Multi-Project Workspace Architecture',
        'Separation of concerns between historical timelines, personal workflows, and tech roadmaps',
        '2026-10-01',
        '2026-10-18',
        'in_progress',
        'high',
        0,
        '#core,#workspace'
      ]
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'node-idea-export',
        'track-idea-core',
        'High-Res PNG / SVG / Markdown Exporter',
        'Export interactive visual timelines into presentation decks and documentation',
        '2026-10-25',
        '2026-11-12',
        'planned',
        'medium',
        1,
        '#export,#canvas'
      ]
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        'node-idea-showcase',
        'track-idea-growth',
        'Open Source Developer Showcase',
        'Interactive historical and technical timeline templates for the developer community',
        '2026-10-15',
        '2026-10-30',
        'planned',
        'high',
        0,
        '#growth,#launch'
      ]
    }
  ]);
}

async function seedDefaultData(db: Client) {
  await db.batch([
    {
      sql: `INSERT INTO timelines (id, title, description, color, parent_timeline_id, branch_point_node_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['track-main', 'Main Roadmap (Core v1.0)', 'Primary development track for core platform features', 'zinc', null, null, 0]
    },
    {
      sql: `INSERT INTO timelines (id, title, description, color, parent_timeline_id, branch_point_node_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['track-competitor', 'Competitor Benchmark (TechNova)', 'External market release tracking and comparative milestones', 'stone', null, null, 1]
    },
    {
      sql: `INSERT INTO timelines (id, title, description, color, parent_timeline_id, branch_point_node_id, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['track-branch-gtm', 'Go-To-Market & Launch (Branch from Alpha)', 'Branched off Alpha testing for PR, media rollout, and beta access', 'neutral', 'track-main', 'node-alpha', 2]
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-research', 'track-main', 'Market Research & UX Prototyping', 'Wireframes and user feedback interviews', '2026-07-12', '2026-07-28', 'completed', 'medium', 0, '#ux,#research']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-core-api', 'track-main', 'Core Architecture & Microservices', 'Database modeling, auth and high-throughput pipelines', '2026-08-05', '2026-08-25', 'completed', 'high', 1, '#backend,#api']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-alpha', 'track-main', 'Internal Alpha Testing (Closed)', 'End-to-end dogfooding with security regression audit', '2026-09-15', '2026-10-10', 'in_progress', 'high', 2, '#qa,#release']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-public-beta', 'track-main', 'Public Beta Release', 'Early access program for 5,000 waitlisted teams', '2026-10-20', '2026-11-15', 'planned', 'high', 3, '#beta,#product']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-launch', 'track-main', 'Official Global Launch v1.0', 'General availability rollout', '2026-12-05', null, 'planned', 'high', 4, '#milestone']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-comp-ai', 'track-competitor', 'Competitor AI Teaser', 'Prototype announcement made at tech conference', '2026-08-15', null, 'completed', 'low', 0, '#competitor,#ai']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-comp-pricing', 'track-competitor', 'Enterprise Price Hike (+15%)', 'Opens window for mid-market acquisition', '2026-10-01', null, 'completed', 'medium', 1, '#pricing']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-comp-summit', 'track-competitor', 'Competitor Annual Summit', 'Expected announcement of competitor v2.0', '2026-11-18', null, 'planned', 'medium', 2, '#conference']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-teaser', 'track-branch-gtm', 'Teaser & Awareness Campaign', 'Social preview and developer waitlist signups', '2026-09-10', '2026-09-30', 'completed', 'medium', 0, '#gtm,#social']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-kol-press', 'track-branch-gtm', 'Press Briefing & Tech Reviews', 'Embargoed reviews with key industry analysts', '2026-10-25', null, 'planned', 'high', 1, '#press,#reviews']
    },
    {
      sql: `INSERT INTO nodes (id, timeline_id, title, description, start_date, end_date, status, priority, order_index, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ['node-early-bird', 'track-branch-gtm', 'Early-Bird Launch Offer', 'Special early-adopter tier launch campaign', '2026-11-24', '2026-11-30', 'planned', 'medium', 2, '#campaign']
    },
    {
      sql: `INSERT INTO dependencies (id, from_node_id, to_node_id, type) VALUES (?, ?, ?, ?)`,
      args: ['dep-1', 'node-alpha', 'node-kol-press', 'blocks']
    }
  ]);
}
