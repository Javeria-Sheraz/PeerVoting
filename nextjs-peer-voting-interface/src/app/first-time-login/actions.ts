"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

export async function handleFirstTimeLogin(
  rollNumber: string,
  temporaryPassword: string,
  newPassword: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Validate inputs
    if (!rollNumber || !temporaryPassword || !newPassword) {
      return { success: false, error: "All fields are required." };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters." };
    }

    if (rollNumber.length === 0) {
      return { success: false, error: "Invalid roll number format." };
    }

    // Create Supabase client for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Format email as ${rollNumber}@cohort.local
    const email = `${rollNumber.trim()}@cohort.local`;

    // Step 1: Attempt to sign in with temporary password
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: temporaryPassword.trim(),
    });

    if (signInError || !signInData.session) {
      return {
        success: false,
        error: "Invalid roll number or temporary password. Please contact your administrator.",
      };
    }

    const userId = signInData.user.id;

    // Step 2: Update password to the new password
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword.trim(),
    });

    if (updateError) {
      return {
        success: false,
        error: `Failed to update password: ${updateError.message}`,
      };
    }

    // Step 3: Create/Update profile in the database
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        roll_number: rollNumber.trim(),
        is_admin: false,
        can_create_polls: false,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't return error here - profile may already exist
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("First-time login error:", err);
    return {
      success: false,
      error: "An unexpected error occurred. Please try again or contact support.",
    };
  }
}
