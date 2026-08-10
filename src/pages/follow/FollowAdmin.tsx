import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import FollowHeader from "@/components/follow/FollowHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  createPost,
  deleteDestination,
  deletePost,
  deleteWallPost,
  geocodeCity,
  getAllWallPostsAdmin,
  getDestinations,
  getLocation,
  getNameClaimsAdmin,
  getPosts,
  getSettings,
  hideWallPost,
  notifyFollowers,
  reviewNameClaim,
  updateLocation,
  updatePost,
  updateSettings,
  uploadPostImage,
  upsertDestination,
} from "@/lib/follow/api";
import type {
  Destination,
  DestinationStatus,
  LocationCurrent,
  NameClaim,
  Post,
  SiteSettings,
  WallPost,
} from "@/lib/follow/types";

type Tab = "location" | "destinations" | "posts" | "wall" | "claims" | "settings";

export default function FollowAdmin() {
  const { loading, isAdmin, configured, user } = useAuth();
  const [tab, setTab] = useState<Tab>("location");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState<LocationCurrent | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [wall, setWall] = useState<WallPost[]>([]);
  const [claims, setClaims] = useState<NameClaim[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const [destName, setDestName] = useState("");
  const [destStatus, setDestStatus] = useState<DestinationStatus>("upcoming");

  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [loc, dest, feed, wallPosts, nameClaims, site] = await Promise.all([
      getLocation(),
      getDestinations(),
      getPosts(),
      getAllWallPostsAdmin(),
      getNameClaimsAdmin(),
      getSettings(),
    ]);
    setLocation(loc);
    setCityInput(loc?.city_label ?? "");
    setDestinations(dest);
    setPosts(feed);
    setWall(wallPosts);
    setClaims(nameClaims);
    setSettings(site);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void load().catch((err) => setError(err instanceof Error ? err.message : "Failed to load admin data"));
  }, [isAdmin, load]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <FollowHeader />
        <p className="px-4 py-12 text-center text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!configured) return <Navigate to="/Follow" replace />;
  if (!isAdmin) return <Navigate to="/Follow/login" replace />;

  const flash = (ok: string) => {
    setMessage(ok);
    setError(null);
  };

  const onSaveLocation = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const geo = await geocodeCity(cityInput);
      if (!geo) throw new Error("Could not find that city/area. Try a clearer name.");
      const updated = await updateLocation({
        city_label: cityInput.trim() || geo.label,
        lat: geo.lat,
        lng: geo.lng,
      });
      setLocation(updated);
      flash("Location updated.");
      try {
        await notifyFollowers("location", `${updated.updated_at}`, `Mike is now in ${updated.city_label}`);
      } catch {
        // Email is best-effort
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update location");
    }
  };

  const onAddDestination = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const name = destName.trim();
      const geo = await geocodeCity(name);
      await upsertDestination({
        name,
        status: destStatus,
        sort_order: destinations.length,
        city_label: geo?.label ?? name,
        lat: geo?.lat ?? null,
        lng: geo?.lng ?? null,
      });
      setDestName("");
      await load();
      flash(geo ? "Stop added to the map." : "Stop saved (couldn’t pin on map — try a clearer city name).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save destination");
    }
  };

  const onStatusChange = async (d: Destination, status: DestinationStatus) => {
    try {
      await upsertDestination({ ...d, status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update destination");
    }
  };

  const onSavePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      let image_url: string | null | undefined;
      if (postFile) {
        image_url = await uploadPostImage(postFile, user.id);
      }

      if (editingPostId) {
        await updatePost(editingPostId, {
          title: postTitle.trim(),
          body: postBody.trim(),
          ...(image_url ? { image_url } : {}),
        });
        flash("Post updated.");
      } else {
        const created = await createPost({
          title: postTitle.trim(),
          body: postBody.trim(),
          image_url: image_url ?? null,
          author_id: user.id,
        });
        flash("Post published.");
        try {
          await notifyFollowers("post", created.id, created.title);
        } catch {
          // best-effort
        }
      }

      setPostTitle("");
      setPostBody("");
      setPostFile(null);
      setEditingPostId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save post");
    }
  };

  const onSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const next = await updateSettings(settings);
      setSettings(next);
      flash("Support settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "location", label: "Where I am" },
    { id: "destinations", label: "Route stops" },
    { id: "posts", label: "Road notes" },
    { id: "settings", label: "Support links" },
    { id: "claims", label: "Car names" },
    { id: "wall", label: "Guestbook" },
  ];

  return (
    <div className="min-h-screen pb-16">
      <FollowHeader />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Journey admin</h1>
            <p className="text-sm text-muted-foreground">Update the map, route stops, and light extras.</p>
          </div>
          <Link to="/Follow" className="btn-secondary py-2 text-sm">
            View public page
          </Link>
        </div>

        {message && <p className="text-sm text-primary">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-white/70 text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "location" && (
          <form onSubmit={(e) => void onSaveLocation(e)} className="space-y-3 rounded-md border border-white/60 bg-white/55 p-4">
            <p className="text-sm text-muted-foreground">
              City / area only — geocoded to a city center pin (never a street address).
            </p>
            <label className="block space-y-1">
              <span className="text-sm font-medium">City or area</span>
              <input
                className="field-input"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="Nashville, TN"
                required
              />
            </label>
            {location && (
              <p className="text-xs text-muted-foreground">
                Current: {location.city_label} ({location.lat.toFixed(3)}, {location.lng.toFixed(3)})
              </p>
            )}
            <button type="submit" className="btn-primary text-sm">
              Update location
            </button>
          </form>
        )}

        {tab === "destinations" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => void onAddDestination(e)}
              className="grid gap-3 rounded-md border border-white/60 bg-white/55 p-4 sm:grid-cols-[1fr_auto_auto]"
            >
              <input
                className="field-input"
                placeholder="City or stop (e.g. Nashville, TN)"
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                required
              />
              <select
                className="field-input"
                value={destStatus}
                onChange={(e) => setDestStatus(e.target.value as DestinationStatus)}
              >
                <option value="upcoming">Upcoming</option>
                <option value="current">Current</option>
                <option value="done">Done</option>
              </select>
              <button type="submit" className="btn-primary text-sm">
                Add
              </button>
            </form>
            <ul className="space-y-2">
              {destinations.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/60 bg-white/55 px-3 py-2"
                >
                  <span className="font-medium">{d.name}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="field-input py-2 text-sm"
                      value={d.status}
                      onChange={(e) => void onStatusChange(d, e.target.value as DestinationStatus)}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="current">Current</option>
                      <option value="done">Done</option>
                    </select>
                    <button
                      type="button"
                      className="btn-secondary py-2 text-sm"
                      onClick={() => void deleteDestination(d.id).then(load)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "posts" && (
          <div className="space-y-4">
            <form onSubmit={(e) => void onSavePost(e)} className="space-y-3 rounded-md border border-white/60 bg-white/55 p-4">
              <h2 className="font-display text-lg font-bold">
                {editingPostId ? "Edit update" : "New update"}
              </h2>
              <input
                className="field-input"
                placeholder="Title"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                required
              />
              <textarea
                className="field-input min-h-[120px]"
                placeholder="Body"
                value={postBody}
                onChange={(e) => setPostBody(e.target.value)}
                required
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPostFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary text-sm">
                  {editingPostId ? "Save changes" : "Publish"}
                </button>
                {editingPostId && (
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    onClick={() => {
                      setEditingPostId(null);
                      setPostTitle("");
                      setPostBody("");
                      setPostFile(null);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <ul className="space-y-2">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/60 bg-white/55 px-3 py-2"
                >
                  <span className="font-medium">{p.title}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary py-2 text-sm"
                      onClick={() => {
                        setEditingPostId(p.id);
                        setPostTitle(p.title);
                        setPostBody(p.body);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-secondary py-2 text-sm"
                      onClick={() => void deletePost(p.id).then(load)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === "wall" && (
          <ul className="space-y-2">
            {wall.map((w) => (
              <li key={w.id} className="rounded-md border border-white/60 bg-white/55 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {w.profiles?.display_name || "Member"}
                    {w.hidden ? " (hidden)" : ""}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary py-1.5 text-xs"
                      onClick={() => void hideWallPost(w.id, !w.hidden).then(load)}
                    >
                      {w.hidden ? "Unhide" : "Hide"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary py-1.5 text-xs"
                      onClick={() => void deleteWallPost(w.id).then(load)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm whitespace-pre-wrap">{w.body}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === "claims" && (
          <ul className="space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="rounded-md border border-white/60 bg-white/55 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {c.display_name} — ${Number(c.amount).toFixed(2)} ({c.tier})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.profiles?.email || c.user_id} · {c.status}
                      {c.payment_note ? ` · ${c.payment_note}` : ""}
                    </p>
                  </div>
                  {c.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-primary py-1.5 text-xs"
                        onClick={() => void reviewNameClaim(c.id, "approved").then(load)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn-secondary py-1.5 text-xs"
                        onClick={() => void reviewNameClaim(c.id, "rejected").then(load)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "settings" && settings && (
          <form onSubmit={(e) => void onSaveSettings(e)} className="space-y-3 rounded-md border border-white/60 bg-white/55 p-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Buy Me a Coffee URL</span>
              <input
                className="field-input"
                value={settings.buy_me_a_coffee_url}
                onChange={(e) => setSettings({ ...settings, buy_me_a_coffee_url: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Cash App URL</span>
              <input
                className="field-input"
                value={settings.cash_app_url}
                onChange={(e) => setSettings({ ...settings, cash_app_url: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Cash App tag</span>
              <input
                className="field-input"
                value={settings.cash_app_tag}
                onChange={(e) => setSettings({ ...settings, cash_app_tag: e.target.value })}
                placeholder="$YourTag"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Amazon wishlist URL</span>
              <input
                className="field-input"
                value={settings.amazon_wishlist_url}
                onChange={(e) => setSettings({ ...settings, amazon_wishlist_url: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Mailbox address</span>
              <textarea
                className="field-input min-h-[96px]"
                value={settings.mailbox_address}
                onChange={(e) => setSettings({ ...settings, mailbox_address: e.target.value })}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Mailbox notes</span>
              <textarea
                className="field-input min-h-[80px]"
                value={settings.mailbox_notes}
                onChange={(e) => setSettings({ ...settings, mailbox_notes: e.target.value })}
              />
            </label>
            <button type="submit" className="btn-primary text-sm">
              Save support links
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
