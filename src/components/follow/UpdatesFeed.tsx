import type { Post } from "@/lib/follow/types";

type UpdatesFeedProps = {
  posts: Post[];
};

export default function UpdatesFeed({ posts }: UpdatesFeedProps) {
  const latest = posts.slice(0, 5);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">Road notes</h2>
        <p className="mt-1 text-sm text-muted-foreground">Occasional updates from the trip.</p>
      </div>

      <div className="space-y-3">
        {latest.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        {latest.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-md border border-white/60 bg-white/55"
          >
            {post.image_url && (
              <img src={post.image_url} alt="" className="h-40 w-full object-cover sm:h-48" loading="lazy" />
            )}
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-bold">{post.title}</h3>
                <time className="text-xs text-muted-foreground" dateTime={post.created_at}>
                  {new Date(post.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{post.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
