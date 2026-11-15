const fs = require('fs');

async function syncEnv() {
  const envFile = fs.existsSync('.env.local') ? '.env.local' : '.env';
  console.log(`Reading environment variables from ${envFile}...`);
  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};
  let token = process.env.CLOUDFLARE_API_TOKEN;

  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key === 'CLOUDFLARE_API_TOKEN' && !token) {
      token = val;
    }
    if (val !== undefined && val !== '') {
      envVars[key] = { value: val, type: 'plain_text' };
    }
  }

  // Ensure Node version & compatibility are present
  envVars['NODE_VERSION'] = { value: '20.18.0', type: 'plain_text' };
  envVars['NEXT_PUBLIC_SITE_URL'] = { value: 'https://meteorit.my.id', type: 'plain_text' };
  envVars['NEXT_PUBLIC_R2_PUBLIC_URL'] = { value: 'https://cdn.meteorit.my.id', type: 'plain_text' };
  envVars['R2_PUBLIC_URL'] = { value: 'https://cdn.meteorit.my.id', type: 'plain_text' };

  const accountId = '5f29e48300ae379ebe15c20185d15ac8';
  const projectName = 'meteorit-indonesia';

  console.log(`Sending ${Object.keys(envVars).length} environment variables to Cloudflare Pages...`);

  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deployment_configs: {
        production: {
          env_vars: envVars
        },
        preview: {
          env_vars: envVars
        }
      }
    })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    console.error('Failed to update Cloudflare Pages env:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('✅ Successfully updated Cloudflare Pages environment variables!');
  const setKeys = Object.keys(data.result?.deployment_configs?.production?.env_vars || {});
  console.log(`Total active production env vars: ${setKeys.length}`);
}

syncEnv().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
