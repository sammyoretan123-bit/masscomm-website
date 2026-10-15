/* ============================================
   MASS COMMUNICATION DEPARTMENT
   File: js/supabase-client.js
   Purpose: Initialize Supabase client (shared by all pages)
   ============================================ */

const SUPABASE_URL = "https://rpiprkuhovhpwinmufgs.supabase.co";
const SUPABASE_KEY = "sb_publishable_Nu2_cquccOvjJ_9VS0bthQ_J-rLQmoa";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);