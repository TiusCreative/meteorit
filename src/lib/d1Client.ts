export interface D1QueryResult {
  results: any[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
    changes: number;
  };
}

const CLOUDFLARE_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

/**
 * Perform a raw D1 HTTP query without ensuring the table exists (internal use).
 */
async function queryD1Raw(sql: string, params: any[] = []): Promise<D1QueryResult> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params }),
    // Disable caching for D1 API
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`D1 HTTP request failed: status ${response.status} - ${errorText}`);
  }

  const json = await response.json();
  if (!json.success) {
    throw new Error(`D1 API returned success=false: ${JSON.stringify(json.errors)}`);
  }

  const queryResult = json.result?.[0];
  if (!queryResult) {
    throw new Error(`D1 API did not return result array.`);
  }

  if (!queryResult.success) {
    throw new Error(`D1 SQL execution failed: ${JSON.stringify(queryResult.errors || queryResult.messages)}`);
  }

  return queryResult as D1QueryResult;
}

let initPromise: Promise<void> | null = null;

/**
 * Lazy initialization of the articles schema and index in Cloudflare D1.
 */
export async function initializeD1Database(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        console.log('[D1 Client] Initializing articles table schema...');
        const createTableSql = `
          CREATE TABLE IF NOT EXISTS articles (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            r2_path TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            tags TEXT,
            image TEXT,
            excerpt TEXT,
            date TEXT,
            views INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Published',
            review_status TEXT DEFAULT 'Otomatis',
            ai_provider TEXT
          );
        `;
        const createIndexSql = `
          CREATE INDEX IF NOT EXISTS idx_articles_category_created 
          ON articles(category, createdAt DESC);
        `;
        await queryD1Raw(createTableSql);
        await queryD1Raw(createIndexSql);
        // Ensure an encyclopedia table exists for compatibility with some CLI checks.
        const createEncyclopediaSql = `
          CREATE TABLE IF NOT EXISTS encyclopedia (
            id TEXT PRIMARY KEY,
            name TEXT,
            translated_name TEXT,
            description TEXT,
            translated_description TEXT,
            image_url TEXT,
            recclass TEXT,
            mass TEXT,
            year TEXT,
            lat TEXT,
            long TEXT
          );
        `;
        await queryD1Raw(createEncyclopediaSql);
        // Create other tables that mirror Firebase metadata collections so admin sync can upsert safely.
        const createAstronautsSql = `
          CREATE TABLE IF NOT EXISTS astronauts (
            id TEXT PRIMARY KEY,
            name TEXT,
            craft TEXT,
            country TEXT,
            agency TEXT,
            role TEXT,
            launchDate TEXT,
            returnDate TEXT,
            status TEXT,
            mission TEXT,
            biography TEXT,
            imageUrl TEXT,
            updatedAt TEXT
          );
        `;

        const createMeteoritesSql = `
          CREATE TABLE IF NOT EXISTS meteorites (
            id TEXT PRIMARY KEY,
            name TEXT,
            translated_name TEXT,
            mass TEXT,
            year TEXT,
            recclass TEXT,
            lat TEXT,
            long TEXT,
            description TEXT,
            translated_description TEXT,
            image_url TEXT
          );
        `;

        const createGlossarySql = `
          CREATE TABLE IF NOT EXISTS glossary_terms (
            id TEXT PRIMARY KEY,
            term TEXT,
            definition TEXT,
            translations TEXT
          );
        `;

        const createApodSql = `
          CREATE TABLE IF NOT EXISTS apod_history (
            id TEXT PRIMARY KEY,
            date TEXT,
            title TEXT,
            explanation TEXT,
            image_url TEXT,
            translations TEXT,
            processedAt TEXT
          );
        `;

        const createAstronautTranslationsSql = `
          CREATE TABLE IF NOT EXISTS astronaut_translations (
            id TEXT PRIMARY KEY,
            biography TEXT,
            role TEXT,
            country TEXT,
            updatedAt TEXT
          );
        `;

        const createUsersSql = `
          CREATE TABLE IF NOT EXISTS users (
            uid TEXT PRIMARY KEY,
            displayName TEXT,
            email TEXT,
            photoURL TEXT,
            role TEXT,
            lastLogin TEXT
          );
        `;

        const createForumPostsSql = `
          CREATE TABLE IF NOT EXISTS forum_posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT NOT NULL,
            imageUrl TEXT,
            votes INTEGER DEFAULT 0,
            votedUsers TEXT DEFAULT '[]',
            authorId TEXT NOT NULL,
            authorName TEXT NOT NULL,
            authorPhoto TEXT,
            createdAt TEXT NOT NULL
          );
        `;

        const createForumCommentsSql = `
          CREATE TABLE IF NOT EXISTS forum_comments (
            id TEXT PRIMARY KEY,
            postId TEXT NOT NULL,
            content TEXT NOT NULL,
            authorName TEXT NOT NULL,
            authorPhoto TEXT,
            createdAt TEXT NOT NULL
          );
        `;

        const createVolcanoesSql = `
          CREATE TABLE IF NOT EXISTS volcanoes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            status TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            status_level TEXT,
            description TEXT,
            last_updated TEXT,
            aviation_code TEXT,
            risk_aviation TEXT,
            risk_resident TEXT,
            risk_hiker TEXT,
            ash_height INTEGER,
            ash_direction TEXT,
            weather TEXT
          );
        `;

        const createVolcanoActivityLogSql = `
          CREATE TABLE IF NOT EXISTS volcano_activity_log (
            id TEXT PRIMARY KEY,
            volcano_name TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            description TEXT,
            status_level TEXT
          );
        `;

        const createDisasterDownloadsSql = `
          CREATE TABLE IF NOT EXISTS disaster_downloads (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_format TEXT NOT NULL,
            record_count INTEGER,
            downloaded_by TEXT,
            timestamp TEXT NOT NULL
          );
        `;

        await queryD1Raw(createAstronautsSql);
        await queryD1Raw(createMeteoritesSql);
        await queryD1Raw(createGlossarySql);
        await queryD1Raw(createApodSql);
        await queryD1Raw(createAstronautTranslationsSql);
        await queryD1Raw(createUsersSql);
        await queryD1Raw(createForumPostsSql);
        await queryD1Raw(createForumCommentsSql);
        await queryD1Raw(createVolcanoesSql);
        await queryD1Raw(createVolcanoActivityLogSql);
        await queryD1Raw(createDisasterDownloadsSql);
        console.log('[D1 Client] Articles, forum, volcano, and disaster_downloads table schemas checked successfully.');
      } catch (err) {
        // Reset promise on failure so we can retry on next request
        initPromise = null;
        console.error('[D1 Client] Failed to initialize database:', err);
        throw err;
      }
    })();
  }
  return initPromise;
}

/**
 * Perform a database query against Cloudflare D1.
 * Automatically checks and initializes the database tables first.
 */
export async function queryD1(sql: string, params: any[] = []): Promise<D1QueryResult> {
  // Lazy initialize tables
  await initializeD1Database();
  return queryD1Raw(sql, params);
}
