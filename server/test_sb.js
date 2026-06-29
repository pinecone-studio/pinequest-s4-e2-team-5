const { supabase } = require('./lib/supabase');
async function test() {
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .limit(1);
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('Supabase query succeeded:', data);
  }
}
test().catch(console.error);