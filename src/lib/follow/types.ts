export type UserRole = "member" | "admin";
export type DestinationStatus = "upcoming" | "current" | "done";
export type ReactionType = "like" | "cheer";
export type ReactionTarget = "post" | "wall";
export type NameTier = "car" | "windshield";
export type ClaimStatus = "pending" | "approved" | "rejected";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string;
  notify_opt_in: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type LocationCurrent = {
  id: number;
  city_label: string;
  lat: number;
  lng: number;
  updated_at: string;
};

export type LocationPublic = {
  id: number;
  city_label: string;
  lat: number;
  lng: number;
  published_at: string;
};

export type Destination = {
  id: string;
  name: string;
  status: DestinationStatus;
  sort_order: number;
  city_label: string | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
};

export type Post = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WallPost = {
  id: string;
  author_id: string;
  body: string;
  hidden: boolean;
  created_at: string;
  profiles?: Pick<Profile, "display_name"> | null;
};

export type Reaction = {
  id: string;
  user_id: string;
  target_type: ReactionTarget;
  target_id: string;
  reaction_type: ReactionType;
  created_at: string;
};

export type NameClaim = {
  id: string;
  user_id: string;
  display_name: string;
  amount: number;
  tier: NameTier;
  payment_note: string | null;
  status: ClaimStatus;
  created_at: string;
  reviewed_at: string | null;
  profiles?: Pick<Profile, "display_name" | "email"> | null;
};

export type SiteSettings = {
  id: number;
  streamelements_url: string;
  buy_me_a_coffee_url: string;
  cash_app_url: string;
  cash_app_tag: string;
  venmo_url: string;
  venmo_tag: string;
  amazon_wishlist_url: string;
  mailbox_address: string;
  mailbox_notes: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      location_current: {
        Row: LocationCurrent;
        Insert: Partial<LocationCurrent>;
        Update: Partial<LocationCurrent>;
        Relationships: [];
      };
      location_public: {
        Row: LocationPublic;
        Insert: Partial<LocationPublic>;
        Update: Partial<LocationPublic>;
        Relationships: [];
      };
      destinations: {
        Row: Destination;
        Insert: Omit<Destination, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Destination>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Post>;
        Relationships: [];
      };
      wall_posts: {
        Row: WallPost;
        Insert: Omit<WallPost, "id" | "created_at" | "hidden" | "profiles"> & {
          id?: string;
          created_at?: string;
          hidden?: boolean;
        };
        Update: Partial<WallPost>;
        Relationships: [];
      };
      reactions: {
        Row: Reaction;
        Insert: Omit<Reaction, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Reaction>;
        Relationships: [];
      };
      name_claims: {
        Row: NameClaim;
        Insert: Omit<NameClaim, "id" | "created_at" | "reviewed_at" | "status" | "profiles"> & {
          id?: string;
          created_at?: string;
          reviewed_at?: string | null;
          status?: ClaimStatus;
        };
        Update: Partial<NameClaim>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettings;
        Insert: Partial<SiteSettings>;
        Update: Partial<SiteSettings>;
        Relationships: [];
      };
      notification_log: {
        Row: {
          id: string;
          event_type: string;
          event_key: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          event_key: string;
          sent_at?: string;
        };
        Update: {
          event_type?: string;
          event_key?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
