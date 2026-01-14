import { getCurrentUserProfile } from "@/app/auth/utils";
import { createClient } from "@/utils/supabase/server";

export default async function DebugPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  const profile = await getCurrentUserProfile();

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold">调试信息</h1>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">认证状态</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify({
            user: user ? { id: user.id, email: user.email } : null,
            authError: authError?.message || null,
          }, null, 2)}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Profile 状态</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>

      {user && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">直接查询 Profile</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(
              await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single(),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
