import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import FollowHeader from "@/components/follow/FollowHeader";
import { useAuth } from "@/contexts/AuthContext";
import {
  claimImageUrl,
  claimNoteText,
  createApprovedNameClaim,
  createPost,
  deleteDestination,
  deletePost,
  deleteWallPost,
  geocodeCity,
  getAllTestimonialsAdmin,
  getAllWallPostsAdmin,
  getDestinations,
  getEventLogs,
  getLocation,
  getNameClaimsAdmin,
  getPosts,
  getSettingsAdmin,
  hideWallPost,
  notifyFollowers,
  requestRouteOutreach,
  decideRouteOutreach,
  type RouteEmailAction,
  type RouteEmailRun,
  publishPublicLocation,
  reviewNameClaim,
  reviewTestimonial,
  deleteTestimonial,
  deleteNameClaim,
  describeFollowError,
  setNameClaimImage,
  updateLocation,
  updatePost,
  updateSettings,
  upsertDestination,
  getGiveawayStatus,
  drawGiveawayWinner,
  renameGiveawayEntry,
  removeGiveawayEntry,
  confirmTripGiveawayEntry,
  dismissPendingGiveawaySignup,
  getAllFoodTipsAdmin,
  hideFoodTip,
  deleteFoodTip,
  type GiveawayAction,
  type GiveawayEntry,
  type GiveawayMetrics,
} from "@/lib/follow/api";
import type {
  Destination,
  DestinationStatus,
  FoodTip,
  LocationCurrent,
  NameClaim,
  NameTier,
  Post,
  SiteSettings,
  Testimonial,
  WallPost,
  EventLog,
} from "@/lib/follow/types";
import { matchDestination } from "@/lib/follow/matchStop";
import RouteEmailPanel from "@/components/follow/RouteEmailPanel";
import ImageCropModal from "@/components/follow/ImageCropModal";
import StarRating from "@/components/StarRating";
import { testimonialRating } from "@/lib/follow/rating";

type Tab =
  | "location"
  | "destinations"
  | "posts"
  | "wall"
  | "foodies"
  | "claims"
  | "reviews"
  | "settings"
  | "giveaway"
  | "log";

function aheadStops(list: Destination[]) {
  return list
    .filter((d) => d.status === "upcoming" && d.lat != null && d.lng != null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 2)
    .map((d) => ({ label: d.city_label || d.name, lat: d.lat as number, lng: d.lng as number }));
}

function milesApart(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);

  const [destName, setDestName] = useState("");
  const [destStatus, setDestStatus] = useState<DestinationStatus>("upcoming");
  const [routeRun, setRouteRun] = useState<RouteEmailRun | null>(null);
  const [routeBusy, setRouteBusy] = useState(false);

  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropTarget, setCropTarget] = useState<"post" | "claim" | { id: string }>("post");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [savingPost, setSavingPost] = useState(false);
  const [claimName, setClaimName] = useState("");
  const [claimAmount, setClaimAmount] = useState("10");
  const [claimPlace, setClaimPlace] = useState<NameTier>("car");
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [savingClaim, setSavingClaim] = useState(false);
  const [claimPhotoBusy, setClaimPhotoBusy] = useState<string | null>(null);
  const [giveawayEntries, setGiveawayEntries] = useState<GiveawayEntry[]>([]);
  const [giveawayMetrics, setGiveawayMetrics] = useState<GiveawayMetrics | null>(null);
  const [giveawayActions, setGiveawayActions] = useState<GiveawayAction[]>([]);
  const [giveawayBusy, setGiveawayBusy] = useState(false);
  const [giveawayRefreshing, setGiveawayRefreshing] = useState(false);
  const [giveawayRefreshedAt, setGiveawayRefreshedAt] = useState<Date | null>(null);
  const [foodTips, setFoodTips] = useState<FoodTip[]>([]);

  const load = useCallback(async () => {
    const settled = await Promise.allSettled([
      getLocation(),
      getDestinations(),
      getPosts(),
      getAllWallPostsAdmin(),
      getNameClaimsAdmin(),
      getAllTestimonialsAdmin(),
      getSettingsAdmin(),
      getEventLogs(),
      getAllFoodTipsAdmin(),
    ]);
    const value = <T,>(index: number, fallback: T): T => {
      const item = settled[index];
      return item.status === "fulfilled" ? (item.value as T) : fallback;
    };
    const locResult = settled[0];
    if (locResult.status === "fulfilled") {
      setLocation(locResult.value);
      setCityInput(locResult.value?.city_label ?? "");
    }
    setDestinations((prev) => value(1, prev));
    setPosts((prev) => value(2, prev));
    setWall((prev) => value(3, prev));
    setClaims((prev) => value(4, prev));
    setReviews((prev) => value(5, prev));
    setSettings((prev) => value(6, prev));
    setEventLogs((prev) => value(7, prev));
    setFoodTips((prev) => value(8, prev));
    try {
      const giveaway = await getGiveawayStatus();
      setGiveawayEntries(giveaway.entries ?? []);
      setGiveawayMetrics(giveaway.metrics ?? null);
      setGiveawayActions(giveaway.needs_action ?? []);
      setGiveawayRefreshedAt(new Date());
      if (giveaway.settings) {
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                giveaway_ends_at: giveaway.settings?.giveaway_ends_at ?? prev.giveaway_ends_at ?? "2026-12-31",
                giveaway_winner_email: giveaway.settings?.giveaway_winner_email ?? prev.giveaway_winner_email ?? "",
                giveaway_winner_name: giveaway.settings?.giveaway_winner_name ?? prev.giveaway_winner_name ?? "",
                giveaway_drawn_at: giveaway.settings?.giveaway_drawn_at ?? prev.giveaway_drawn_at ?? null,
              }
            : prev,
        );
      }
    } catch {
      setGiveawayEntries([]);
      setGiveawayMetrics(null);
      setGiveawayActions([]);
    }
  }, []);

  const refreshGiveaway = useCallback(async () => {
    setGiveawayRefreshing(true);
    setError(null);
    try {
      const giveaway = await getGiveawayStatus();
      setGiveawayEntries(giveaway.entries ?? []);
      setGiveawayMetrics(giveaway.metrics ?? null);
      setGiveawayActions(giveaway.needs_action ?? []);
      setGiveawayRefreshedAt(new Date());
      if (giveaway.settings) {
        setSettings((prev) =>
          prev
            ? {
                ...prev,
                giveaway_ends_at: giveaway.settings?.giveaway_ends_at ?? prev.giveaway_ends_at ?? "2026-12-31",
                giveaway_winner_email: giveaway.settings?.giveaway_winner_email ?? prev.giveaway_winner_email ?? "",
                giveaway_winner_name: giveaway.settings?.giveaway_winner_name ?? prev.giveaway_winner_name ?? "",
                giveaway_drawn_at: giveaway.settings?.giveaway_drawn_at ?? prev.giveaway_drawn_at ?? null,
              }
            : prev,
        );
      }
    } catch (err) {
      setError(describeFollowError(err, "Could not refresh giveaway"));
    } finally {
      setGiveawayRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void load().catch((err) => setError(describeFollowError(err, "Failed to load admin data")));
  }, [isAdmin, load]);

  useEffect(() => {
    if (!isAdmin || tab !== "giveaway") return;
    const id = window.setInterval(() => {
      void refreshGiveaway();
    }, 45_000);
    return () => window.clearInterval(id);
  }, [isAdmin, tab, refreshGiveaway]);

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

  const syncStopToCurrent = async (list: Destination[], cityLabel: string) => {
    const match = matchDestination(list, cityLabel);
    if (!match) return list;
    const next = list.map((d) => {
      if (d.id === match.id) return { ...d, status: "current" as const };
      if (d.status === "current") return { ...d, status: "done" as const };
      return d;
    });
    await Promise.all(
      next
        .filter((d, i) => d.status !== list[i]?.status)
        .map((d) => upsertDestination({ ...d, status: d.status })),
    );
    return next;
  };

  const onSaveLocation = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const geo = await geocodeCity(cityInput);
      if (!geo) throw new Error("Could not find that city/area. Try a clearer name.");
      const label = cityInput.trim() || geo.label;
      const updated = await updateLocation({
        city_label: label,
        lat: geo.lat,
        lng: geo.lng,
      });
      await publishPublicLocation();
      const dests = await syncStopToCurrent(destinations, label);
      setDestinations(dests);
      setLocation(updated);
      flash("Map updated now.");
      void notifyFollowers("location", `${updated.lat},${updated.lng}`, updated.city_label).catch(() => undefined);
      const prev = location;
      const citySame = (prev?.city_label || "").trim().toLowerCase() === label.trim().toLowerCase();
      const moved =
        prev && Number.isFinite(prev.lat) && Number.isFinite(prev.lng)
          ? milesApart(prev.lat, prev.lng, geo.lat, geo.lng)
          : Number.POSITIVE_INFINITY;
      if (citySame && moved < 15) return;
      try {
        const run = await requestRouteOutreach({ label, lat: geo.lat, lng: geo.lng }, aheadStops(dests));
        setRouteRun(run);
        if (run.skipped) {
          flash("Map updated. Route email is not configured.");
        } else if (!run.run_id) {
          flash(run.note || "Map updated. No new shops to email.");
        } else {
          flash(
            run.telegram_sent
              ? "Map updated. Approve the example on Telegram, then the shop list. Nothing sends before that."
              : "Map updated. Approve the example below, then the shop list. Nothing sends before that.",
          );
        }
      } catch (err) {
        setMessage("Map updated.");
        setError(describeFollowError(err, "The map saved, but the route email sweep failed."));
      }
    } catch (err) {
      setError(describeFollowError(err, "Failed to update location"));
    }
  };

  const onSimulateRoute = async () => {
    setRouteBusy(true);
    try {
      const geo = await geocodeCity(cityInput);
      if (!geo) throw new Error("Could not find that city/area. Try a clearer name.");
      const label = cityInput.trim() || geo.label;
      const run = await requestRouteOutreach(
        { label, lat: geo.lat, lng: geo.lng },
        aheadStops(destinations),
        { simulate: true },
      );
      setRouteRun(run);
      if (run.skipped) {
        flash("Route email is not configured.");
      } else {
        flash(
          run.telegram_sent
            ? "Simulation is on Telegram. Sample shops only. The last step still will not email anyone."
            : "Simulation is ready below. Sample shops only. The last step still will not email anyone.",
        );
      }
    } catch (err) {
      setError(describeFollowError(err, "Could not start the route email simulation"));
    } finally {
      setRouteBusy(false);
    }
  };

  const onRouteDecision = async (action: RouteEmailAction) => {
    if (!routeRun?.run_id) return;
    setRouteBusy(true);
    try {
      const run = await decideRouteOutreach(routeRun.run_id, action);
      setRouteRun(run);
      flash(run.note || "Route email updated.");
    } catch (err) {
      setError(describeFollowError(err, "Could not update the route email"));
    } finally {
      setRouteBusy(false);
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
      setError(describeFollowError(err, "Failed to save destination"));
    }
  };

  const onStatusChange = async (d: Destination, status: DestinationStatus) => {
    try {
      if (status === "current") {
        await Promise.all(
          destinations
            .filter((row) => row.status === "current" && row.id !== d.id)
            .map((row) => upsertDestination({ ...row, status: "done" })),
        );
      }
      await upsertDestination({ ...d, status });
      if (status === "current" && d.lat != null && d.lng != null) {
        const updated = await updateLocation({
          city_label: d.city_label || d.name,
          lat: d.lat,
          lng: d.lng,
        });
        await publishPublicLocation();
        setLocation(updated);
        setCityInput(updated.city_label);
      }
      await load();
      if (status === "current") flash("Map updated now.");
    } catch (err) {
      setError(describeFollowError(err, "Failed to update destination"));
    }
  };

  const onSavePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || savingPost) return;
    setSavingPost(true);
    setError(null);
    try {
      if (editingPostId) {
        await updatePost(editingPostId, {
          title: postTitle.trim(),
          body: postBody.trim(),
          image: postFile,
        });
        flash("Post updated.");
      } else {
        const created = await createPost({
          title: postTitle.trim(),
          body: postBody.trim(),
          image: postFile,
          author_id: user.id,
        });
        flash("Post published.");
        void notifyFollowers("post", created.id, created.title).catch(() => {
          // best-effort
        });
      }

      setPostTitle("");
      setPostBody("");
      setPostFile(null);
      setEditingPostId(null);
      try {
        await load();
      } catch {
        // Publish already succeeded; list refresh is best-effort.
      }
    } catch (err) {
      setError(describeFollowError(err, "Failed to save post. Check your connection and try again."));
    } finally {
      setSavingPost(false);
    }
  };

  const onAddClaim = async (e: FormEvent) => {
    e.preventDefault();
    if (savingClaim) return;
    const amount = Number(claimAmount);
    if (!claimName.trim()) {
      setError("Enter the name to put on the car.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (claimPlace === "windshield" && amount < 100) {
      setError("Windshield starts at $100.");
      return;
    }
    setSavingClaim(true);
    setError(null);
    try {
      await createApprovedNameClaim({
        display_name: claimName.trim(),
        amount,
        tier: claimPlace,
        image: claimFile,
      });
      setClaimName("");
      setClaimAmount(amount >= 100 ? "100" : "10");
      setClaimFile(null);
      await load();
      flash("Name added.");
    } catch (err) {
      setError(describeFollowError(err, "Failed to add that name."));
    } finally {
      setSavingClaim(false);
    }
  };

  const onClaimPhoto = async (id: string, file: File) => {
    setClaimPhotoBusy(id);
    setError(null);
    try {
      await setNameClaimImage(id, file);
      await load();
      flash("Photo saved.");
    } catch (err) {
      setError(describeFollowError(err, "Failed to save that photo."));
    } finally {
      setClaimPhotoBusy(null);
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
      setError(describeFollowError(err, "Failed to save settings"));
    }
  };

  const onDrawGiveaway = async () => {
    setGiveawayBusy(true);
    try {
      const result = await drawGiveawayWinner();
      await load();
      if (result.emailError) {
        flash(`Winner: ${result.winner?.name || result.winner?.email}. Email failed: ${result.emailError}`);
      } else {
        flash(`Winner drawn: ${result.winner?.name || result.winner?.email}`);
      }
    } catch (err) {
      setError(describeFollowError(err, "Could not draw a winner"));
    } finally {
      setGiveawayBusy(false);
    }
  };

  const onRenameGiveaway = async (entry: GiveawayEntry) => {
    const next = window.prompt(`Display name for ${entry.email}`, entry.name || "");
    if (next == null) return;
    const name = next.trim();
    if (!name) {
      setError("Name cannot be empty.");
      return;
    }
    setGiveawayBusy(true);
    try {
      await renameGiveawayEntry(entry.email, name);
      await refreshGiveaway();
      flash(`Renamed entry to “${name}”.`);
    } catch (err) {
      setError(describeFollowError(err, "Could not rename that entry"));
    } finally {
      setGiveawayBusy(false);
    }
  };

  const onRemoveGiveaway = async (entry: GiveawayEntry) => {
    const label = entry.name || entry.email;
    const ok = window.confirm(
      `Remove “${label}” (${entry.email}) from the giveaway?\n\nThey will be unsubscribed from trip updates and any approved/pending name claim for that email will be rejected. This cannot be undone from here.`,
    );
    if (!ok) return;
    setGiveawayBusy(true);
    try {
      await removeGiveawayEntry(entry.email);
      await refreshGiveaway();
      flash(`Removed ${label} from the giveaway.`);
    } catch (err) {
      setError(describeFollowError(err, "Could not remove that entry"));
    } finally {
      setGiveawayBusy(false);
    }
  };

  const onConfirmPendingSignup = async (row: GiveawayAction) => {
    if (!row.email) return;
    const ok = window.confirm(
      `Mark ${row.name || row.email} as confirmed without the email link?\n\nThey become an eligible giveaway entry.`,
    );
    if (!ok) return;
    setGiveawayBusy(true);
    try {
      await confirmTripGiveawayEntry(row.email);
      await refreshGiveaway();
      flash(`Confirmed ${row.email}.`);
    } catch (err) {
      setError(describeFollowError(err, "Could not confirm that signup"));
    } finally {
      setGiveawayBusy(false);
    }
  };

  const onDismissPendingSignup = async (row: GiveawayAction) => {
    if (!row.email) return;
    const ok = window.confirm(
      `Delete the pending signup for ${row.name || row.email} (${row.email})?\n\nThey will need to sign up again.`,
    );
    if (!ok) return;
    setGiveawayBusy(true);
    try {
      await dismissPendingGiveawaySignup(row.email);
      await refreshGiveaway();
      flash(`Dismissed pending signup for ${row.email}.`);
    } catch (err) {
      setError(describeFollowError(err, "Could not dismiss that signup"));
    } finally {
      setGiveawayBusy(false);
    }
  };

  const onApprovePendingClaim = async (row: GiveawayAction) => {
    if (!row.claim_id) {
      setError("That claim is missing an id — use the Car names tab.");
      return;
    }
    const ok = window.confirm(`Approve name claim for ${row.name || row.email}? It will count as a giveaway entry.`);
    if (!ok) return;
    setGiveawayBusy(true);
    try {
      await reviewNameClaim(row.claim_id, "approved");
      await refreshGiveaway();
      flash(`Approved ${row.name || "claim"}.`);
    } catch (err) {
      setError(describeFollowError(err, "Could not approve that claim"));
    } finally {
      setGiveawayBusy(false);
    }
  };

  const onRejectPendingClaim = async (row: GiveawayAction) => {
    if (!row.claim_id) {
      setError("That claim is missing an id — use the Car names tab.");
      return;
    }
    const ok = window.confirm(`Reject name claim for ${row.name || row.email}?`);
    if (!ok) return;
    setGiveawayBusy(true);
    try {
      await reviewNameClaim(row.claim_id, "rejected");
      await refreshGiveaway();
      flash(`Rejected ${row.name || "claim"}.`);
    } catch (err) {
      setError(describeFollowError(err, "Could not reject that claim"));
    } finally {
      setGiveawayBusy(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "location", label: "Where I am" },
    { id: "destinations", label: "Route stops" },
    { id: "posts", label: "Road notes" },
    { id: "giveaway", label: "Giveaway" },
    { id: "settings", label: "Support links" },
    { id: "claims", label: "Car names" },
    { id: "reviews", label: "Reviews" },
    { id: "wall", label: "Guestbook" },
    { id: "foodies", label: "Foodies" },
    { id: "log", label: "Log" },
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
              City / area only — saved to the public map immediately. If it matches a route stop, that stop becomes current.
              A new city, or a move of about 15 miles, gathers nearby shops and waits for two approvals: the example email, then the shop list. Nothing is emailed before both.
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
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn-primary text-sm">
                Save location (updates map now)
              </button>
              <button type="button" className="btn-secondary text-sm" disabled={routeBusy} onClick={() => void onSimulateRoute()}>
                Simulate route email
              </button>
            </div>
          </form>
        )}

        {tab === "location" && routeRun && (
          <RouteEmailPanel run={routeRun} busy={routeBusy} onDecide={(action) => void onRouteDecision(action)} />
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
              <label className="block space-y-1">
                <span className="text-sm font-medium">Photo (optional)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (next) setCropFile(next);
                  }}
                />
                <span className="block text-xs text-muted-foreground">
                  Crop the view window, preview, then publish. JPEG or PNG works best.
                </span>
                {postFile && <p className="text-xs text-primary">Cropped photo ready.</p>}
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary text-sm" disabled={savingPost}>
                  {savingPost ? "Saving…" : editingPostId ? "Save changes" : "Publish"}
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

        {tab === "reviews" && (
          <ul className="space-y-2">
            {reviews.length === 0 && <li className="text-sm text-muted-foreground">No reviews yet.</li>}
            {reviews.map((row) => {
              const stars = testimonialRating(row.answers);
              return (
                <li key={row.id} className="rounded-md border border-white/60 bg-white/55 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{row.status}</p>
                  {stars ? (
                    <div className="mt-1">
                      <StarRating value={stars} readOnly size="sm" />
                    </div>
                  ) : null}
                  <p className="mt-1 text-sm">{row.final_text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {row.display_name}
                    {row.city ? ` · ${row.city}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.status === "pending_hitl" && (
                      <>
                        <button
                          type="button"
                          className="btn-primary py-1.5 text-xs"
                          onClick={() => void reviewTestimonial(row.id, "published").then(load)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn-secondary py-1.5 text-xs"
                          onClick={() => void reviewTestimonial(row.id, "rejected").then(load)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn-secondary py-1.5 text-xs"
                      onClick={() =>
                        void deleteTestimonial(row.id)
                          .then(() => {
                            flash("Review deleted.");
                            return load();
                          })
                          .catch((err) => setError(describeFollowError(err, "Failed to delete review")))
                      }
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "wall" && (
          <ul className="space-y-2">
            {wall.map((w) => (
              <li key={w.id} className="rounded-md border border-white/60 bg-white/55 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {w.profiles?.display_name || w.display_name || "Guest"}
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
                {w.parent_id && <p className="mt-1 text-xs text-muted-foreground">Reply</p>}
              </li>
            ))}
          </ul>
        )}

        {tab === "foodies" && (
          <ul className="space-y-2">
            {foodTips.length === 0 && (
              <li className="text-sm text-muted-foreground">No food tips yet.</li>
            )}
            {foodTips.map((tip) => (
              <li key={tip.id} className="rounded-md border border-white/60 bg-white/55 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">
                    {tip.place_name}
                    {tip.hidden ? " (hidden)" : ""}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary py-1.5 text-xs"
                      onClick={() => void hideFoodTip(tip.id, !tip.hidden).then(load)}
                    >
                      {tip.hidden ? "Unhide" : "Hide"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary py-1.5 text-xs"
                      onClick={() => void deleteFoodTip(tip.id).then(load)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm">
                  {tip.display_name} · {tip.city_label}
                  {tip.tip_amount != null && Number(tip.tip_amount) > 0
                    ? ` · $${Number(tip.tip_amount).toFixed(2)}${tip.pay_method ? ` ${tip.pay_method}` : ""}`
                    : ""}
                </p>
                {tip.note ? <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{tip.note}</p> : null}
              </li>
            ))}
          </ul>
        )}

        {tab === "claims" && (
          <div className="space-y-4">
            <form
              onSubmit={(e) => void onAddClaim(e)}
              className="space-y-3 rounded-md border border-white/60 bg-white/55 p-4"
            >
              <h2 className="font-display text-lg font-bold">Add a name</h2>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Name on the car</span>
                <input
                  className="field-input"
                  value={claimName}
                  onChange={(e) => setClaimName(e.target.value)}
                  maxLength={40}
                  placeholder="How it should appear"
                  required
                />
              </label>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Window</legend>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setClaimPlace("car")}
                    className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                      claimPlace === "car" ? "border-primary bg-primary text-primary-foreground" : "border-border/80 bg-white/80"
                    }`}
                  >
                    Hatch window
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClaimPlace("windshield");
                      if (Number(claimAmount) < 100) setClaimAmount("100");
                    }}
                    className={`rounded-md border px-3 py-1.5 text-sm font-semibold ${
                      claimPlace === "windshield"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/80 bg-white/80"
                    }`}
                  >
                    Windshield
                  </button>
                </div>
              </fieldset>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Amount</span>
                <input
                  className="field-input max-w-[12rem]"
                  type="number"
                  min="1"
                  step="0.01"
                  value={claimAmount}
                  onChange={(e) => setClaimAmount(e.target.value)}
                  required
                />
                <span className="block text-xs text-muted-foreground">
                  Windshield starts at $100. The hatch window can be any amount.
                </span>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium">Photo (optional)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    if (next) {
                      setCropTarget("claim");
                      setCropFile(next);
                    }
                  }}
                />
                <span className="block text-xs text-muted-foreground">
                  Shown next to the name on the Follow page.
                </span>
                {claimFile && <p className="text-xs text-primary">Cropped photo ready.</p>}
              </label>
              <button type="submit" className="btn-primary text-sm" disabled={savingClaim}>
                {savingClaim ? "Adding…" : "Add name"}
              </button>
            </form>
            {claims.length === 0 && <p className="text-sm text-muted-foreground">No names yet.</p>}
            <ul className="space-y-2">
              {claims.map((c) => {
                const photo = claimImageUrl(c);
                const note = claimNoteText(c.payment_note);
                return (
                <li key={c.id} className="rounded-md border border-white/60 bg-white/55 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-3">
                      {photo && (
                        <img
                          src={photo}
                          alt=""
                          className="h-14 w-20 shrink-0 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {c.display_name} — ${Number(c.amount).toFixed(2)} ({c.tier === "windshield" ? "windshield" : "hatch window"})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.profiles?.email || c.user_id || "Guest"} · {c.status}
                          {note ? ` · ${note}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <label className="btn-secondary cursor-pointer py-1.5 text-xs">
                        {claimPhotoBusy === c.id ? "Saving photo…" : photo ? "Replace photo" : "Add photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/*"
                          className="sr-only"
                          disabled={claimPhotoBusy === c.id}
                          onChange={(e) => {
                            const next = e.target.files?.[0] ?? null;
                            e.target.value = "";
                            if (next) {
                              setCropTarget({ id: c.id });
                              setCropFile(next);
                            }
                          }}
                        />
                      </label>
                      {c.status === "pending" && (
                        <>
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
                            Decline
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="btn-secondary py-1.5 text-xs"
                        onClick={() => {
                          if (!window.confirm(`Delete the request for “${c.display_name}”?`)) return;
                          void deleteNameClaim(c.id).then(load);
                        }}
                      >
                      Delete
                    </button>
                  </div>
                  </div>
                </li>
                );
              })}
            </ul>
          </div>
        )}

        {tab === "log" && (
          <ul className="space-y-2">
            {eventLogs.length === 0 && (
              <li className="text-sm text-muted-foreground">No events logged yet.</li>
            )}
            {eventLogs.map((row) => (
              <li key={row.id} className="rounded-md border border-white/60 bg-white/55 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{row.event_type}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{row.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}

        {tab === "settings" && settings && (
          <form onSubmit={(e) => void onSaveSettings(e)} className="space-y-3 rounded-md border border-white/60 bg-white/55 p-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">StreamElements tip URL</span>
              <input
                className="field-input"
                value={settings.streamelements_url ?? ""}
                onChange={(e) => setSettings({ ...settings, streamelements_url: e.target.value })}
                placeholder="https://streamelements.com/AzmaticPyro/tip"
              />
            </label>
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
              <span className="text-sm font-medium">Venmo URL</span>
              <input
                className="field-input"
                value={settings.venmo_url ?? ""}
                onChange={(e) => setSettings({ ...settings, venmo_url: e.target.value })}
                placeholder="https://venmo.com/code?user_id=…"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Venmo username</span>
              <input
                className="field-input"
                value={settings.venmo_tag ?? ""}
                onChange={(e) => setSettings({ ...settings, venmo_tag: e.target.value })}
                placeholder="@Michael-Pyro"
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
            <label className="block space-y-1">
              <span className="text-sm font-medium">Giveaway end date</span>
              <input
                className="field-input"
                type="date"
                value={settings.giveaway_ends_at || "2026-12-31"}
                onChange={(e) => setSettings({ ...settings, giveaway_ends_at: e.target.value })}
              />
            </label>
            <button type="submit" className="btn-primary text-sm">
              Save support links
            </button>
          </form>
        )}

        {tab === "giveaway" && (
          <section className="space-y-4">
            <div className="sticky top-[3.25rem] z-30 flex flex-wrap items-center justify-between gap-2 rounded-md border border-primary/20 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md">
              <div className="min-w-0 text-sm">
                <span className="font-semibold text-foreground">Giveaway live</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {giveawayEntries.length} eligible
                  {giveawayMetrics ? ` · ${giveawayMetrics.needs_action} need action` : ""}
                  {giveawayRefreshedAt
                    ? ` · updated ${giveawayRefreshedAt.toLocaleTimeString()}`
                    : ""}
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary py-1.5 text-xs"
                disabled={giveawayRefreshing}
                onClick={() => void refreshGiveaway()}
              >
                {giveawayRefreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            <div className="space-y-4 rounded-md border border-white/60 bg-white/55 p-4">
              <div>
                <h2 className="font-display text-xl font-bold">Name on the Metro giveaway</h2>
                <p className="text-sm text-muted-foreground">
                  Prize: name on the hatch window plus a shirt with the windshield name art. Entries are confirmed trip
                  emails plus approved name-on-car tips. One entry per email. Drawing closes{" "}
                  {settings?.giveaway_ends_at || "2026-12-31"}.
                </p>
              </div>

              {giveawayMetrics && (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Attempted signups", value: giveawayMetrics.attempted, hint: "All trip list attempts" },
                    {
                      label: "Need confirm",
                      value: giveawayMetrics.pending_confirm,
                      hint: "Signed up — email link not opened",
                    },
                    { label: "Confirmed trip", value: giveawayMetrics.confirmed_trip, hint: "Counted as entries" },
                    { label: "Eligible to draw", value: giveawayEntries.length, hint: "Unique emails in the hat" },
                    { label: "Approved car names", value: giveawayMetrics.approved_claims, hint: "Also count once" },
                    { label: "Needs your action", value: giveawayMetrics.needs_action, hint: "Confirm or approve" },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className="rounded-md border border-white/70 bg-white/70 px-3 py-2.5"
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
                      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{card.value}</p>
                      <p className="text-xs text-muted-foreground">{card.hint}</p>
                    </div>
                  ))}
                </div>
              )}

              {giveawayActions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Needs action</h3>
                  <ul className="max-h-56 space-y-2 overflow-y-auto">
                    {giveawayActions.map((row) => (
                      <li
                        key={`${row.kind}-${row.email}-${row.claim_id || ""}-${row.created_at}`}
                        className="rounded-md border border-amber-500/25 bg-amber-50/80 px-3 py-2 text-sm"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-semibold">
                            {row.name}
                            {row.email ? (
                              <span className="font-normal text-muted-foreground"> · {row.email}</span>
                            ) : null}
                          </span>
                          <span className="text-xs font-medium uppercase tracking-wide text-amber-800/80">
                            {row.kind === "confirm_email" ? "Confirm email" : "Approve claim"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{row.detail}</p>
                        {row.created_at && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString()}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {row.kind === "confirm_email" ? (
                            <>
                              <button
                                type="button"
                                className="btn-primary py-1 text-xs"
                                disabled={giveawayBusy}
                                onClick={() => void onConfirmPendingSignup(row)}
                              >
                                Confirm now
                              </button>
                              <button
                                type="button"
                                className="btn-secondary py-1 text-xs"
                                disabled={giveawayBusy}
                                onClick={() => void onDismissPendingSignup(row)}
                              >
                                Delete signup
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn-primary py-1 text-xs"
                                disabled={giveawayBusy || !row.claim_id}
                                onClick={() => void onApprovePendingClaim(row)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-secondary py-1 text-xs"
                                disabled={giveawayBusy || !row.claim_id}
                                onClick={() => void onRejectPendingClaim(row)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {settings?.giveaway_drawn_at || settings?.giveaway_winner_email ? (
                <p className="rounded-md border border-primary/25 bg-primary/5 px-3 py-2 text-sm text-primary">
                  Winner: {settings.giveaway_winner_name || "drawn"}
                  {settings.giveaway_drawn_at
                    ? ` · drawn ${new Date(settings.giveaway_drawn_at).toLocaleString()}`
                    : ""}
                </p>
              ) : (
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={giveawayBusy || giveawayEntries.length === 0}
                  onClick={() => void onDrawGiveaway()}
                >
                  {giveawayBusy ? "Drawing…" : `Draw winner (${giveawayEntries.length} entries)`}
                </button>
              )}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Eligible names</h3>
                <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
                  {giveawayEntries.length === 0 && (
                    <li className="text-muted-foreground">No confirmed entries yet.</li>
                  )}
                  {giveawayEntries.map((entry) => (
                    <li
                      key={entry.email}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-white/70 bg-white/70 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {entry.name || "—"}
                          <span className="font-normal text-muted-foreground"> · {entry.email}</span>
                        </p>
                        {entry.sources && entry.sources.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            via {entry.sources.map((s) => (s === "trip" ? "trip email" : "car name")).join(" + ")}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-secondary py-1 text-xs"
                          disabled={giveawayBusy}
                          onClick={() => void onRenameGiveaway(entry)}
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          className="btn-secondary py-1 text-xs text-red-700"
                          disabled={giveawayBusy}
                          onClick={() => void onRemoveGiveaway(entry)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
      {cropFile && (
        <ImageCropModal
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={(file) => {
            if (cropTarget === "claim") setClaimFile(file);
            else if (typeof cropTarget === "object") void onClaimPhoto(cropTarget.id, file);
            else setPostFile(file);
            setCropFile(null);
          }}
        />
      )}
    </div>
  );
}
