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

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '5f29e48300ae379ebe15c20185d15ac8';
const CLOUDFLARE_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.CLOUDFLARE_D1_ID || 'c0ad9039-d1e4-4c01-856d-5d5971514255';
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

/**
 * Schema initialization is done once in migration/admin setup.
 * Made a no-op here to conserve Cloudflare Worker subrequest budget (max 50 per invocation).
 */
export async function initializeD1Database(): Promise<void> {
  return Promise.resolve();
}

/**
 * Perform a database query against Cloudflare D1.
 */
export async function queryD1(sql: string, params: any[] = []): Promise<D1QueryResult> {
  return queryD1Raw(sql, params);
}
