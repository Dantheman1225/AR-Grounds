const { createClient } = require('@supabase/supabase-js');

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
];

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Load them from a local .dev.vars file or your shell; never commit them.'
  );
}

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} = process.env;

if (ADMIN_PASSWORD.length < 16) {
  throw new Error('ADMIN_PASSWORD must be at least 16 characters long.');
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAdminUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Unable to create admin user: ${error.message}`);
  }

  console.log(`Admin user created successfully: ${data.user.email}`);
}

createAdminUser().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
