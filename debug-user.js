const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', 'cds5233%');
  
  if (error) {
    console.error('Error fetching profile:', error);
  } else {
    console.log('--- Profile Data ---');
    console.log(JSON.stringify(data, null, 2));
  }

  // We can't check auth metadata easily without service role, 
  // but let's check Employer table too
}

check();
