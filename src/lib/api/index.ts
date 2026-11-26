import { supabase } from "@/lib/supabase";
import { localApi } from "./local";
import { createSupabaseApi } from "./supabase";
import type { Api } from "./types";

export const api: Api = supabase ? createSupabaseApi(supabase) : localApi;
export type { Api, CheckoutResult } from "./types";
