import { supabase } from "./supabase";

export async function runMigrations() {
  try {
    await createProfilesTableDirectly();
    console.log("All migrations completed");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// This function creates the profiles table directly with SQL
async function createProfilesTableDirectly() {
  console.log("Setting up profiles table...");

  try {
    // Try to select from the table to check if it exists
    const { error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    // If no error, table exists
    if (!checkError) {
      console.log("Profiles table already exists");
      return;
    }

    // Create the table with SQL query
    const { error } = await supabase.rpc("exec_sql", {
      sql: `
          CREATE TABLE IF NOT EXISTS public.profiles (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
            first_name text,
            last_name text,
            phone text,
            address text,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
          );
          
          -- Enable Row Level Security
          ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
          
          -- Create policies
          CREATE POLICY "Users can read their own profile"
            ON public.profiles FOR SELECT
            USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can update their own profile"
            ON public.profiles FOR UPDATE
            USING (auth.uid() = user_id);
            
          CREATE POLICY "Users can insert their own profile"
            ON public.profiles FOR INSERT
            WITH CHECK (auth.uid() = user_id);
        `,
    });

    if (error) {
      throw error;
    }

    console.log("Profiles table created successfully");
  } catch (error) {
    console.error("Failed to create profiles table:", error);
    throw error;
  }
}
