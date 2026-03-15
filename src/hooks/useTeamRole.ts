import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useTeamRole() {
  const { user } = useAuth();
  const [teamRole, setTeamRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTeamRole(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("team_role")
        .eq("id", user.id)
        .single();

      setTeamRole((data as any)?.team_role ?? null);
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { teamRole, loading };
}
