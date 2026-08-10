import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function FollowHeader() {
  const { user, profile, isAdmin, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" className="shrink-0 text-sm font-medium text-muted-foreground hover:text-primary">
            Home
          </Link>
          <Link to="/Follow" className="truncate font-display text-lg font-bold tracking-tight text-foreground">
            Follow Mike
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!loading && user ? (
            <>
              <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline">
                {profile?.display_name || user.email}
              </span>
              {isAdmin && (
                <Link to="/Follow/admin" className="btn-secondary py-2 text-sm">
                  Admin
                </Link>
              )}
              <button type="button" onClick={() => void signOut()} className="btn-secondary py-2 text-sm">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/Follow/login" className="btn-secondary py-2 text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
