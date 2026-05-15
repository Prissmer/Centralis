import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ktbtlvanekmzsmcvivcs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0YnRsdmFuZWttenNtY3ZpdmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNDE4ODYsImV4cCI6MjA5MTkxNzg4Nn0.w8I_XNL4N321TitimWyz1nq207TYQtvAEsTuZ3P7r9E";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);