const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eldlzdyqntbymmoxykff.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZGx6ZHlxbnRieW1tb3h5a2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjE3MTM0OCwiZXhwIjoyMDkxNzQ3MzQ4fQ.A36EuHaEfiefxfGSBJFpmCLDtSLyfnZx6Zl_TfCT6PE';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@argrounds.test',
    password: 'TestAdminPassword123!',
    email_confirm: true
  });

  if (error) {
    console.error('Error creating user:', error.message);
  } else {
    console.log('Test Admin user created successfully:', data.user.email);
  }
}

createAdminUser();
