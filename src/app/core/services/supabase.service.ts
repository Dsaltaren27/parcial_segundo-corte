import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
   private supabase: SupabaseClient;

  constructor() {

this.supabase = createClient(environment.supabase.Url, environment.supabase.Key);
   }

   getSupabase(){
    return this.supabase;
   }
}
