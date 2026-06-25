import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost";
const key = process.env.SUPABASE_SERVICE_KEY ?? "missing-supabase-service-key";

export const supabase = createClient(url, key);
