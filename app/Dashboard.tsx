"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
type Row = Record<string, unknown>;
type Review = {
  id: string;
  name: string;
  business: string;
  project: string;
  text: string;
  rating: number;
  status: string;
  created_at: string;
  images: string[];
  edited: boolean;
};
type RequestItem = {
  id: string;
  data: Record<string, string>;
  status: string;
  created_at: string;
  attachments: { id: string; filename: string; mime: string }[];
};
type Portfolio = {
  id: string;
  category: string;
  url: string;
  source: string;
  hidden: boolean;
  caption: string;
};
async function api(path: string, method = "GET", body?: unknown) {
  const multipart = body instanceof FormData;
  const res = await fetch(`/api/backend/${path}`, {
    method,
    headers: {
      "x-requested-with": "fetch",
      ...(body && !multipart ? { "content-type": "application/json" } : {}),
    },
    body: body ? (multipart ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json();
  if (res.status === 401) window.location.assign("/login");
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
const settingsLabels: Record<string, string> = {
  phoneDisplay: "Phone (display)",
  phoneRaw: "Phone (international format)",
  email: "Email address",
  city: "Street address",
  hours: "Weekday hours",
  saturday: "Weekend hours / appointments",
  facebook: "Facebook URL",
  instagram: "Instagram URL",
  linkedin: "LinkedIn URL",
};
function ReviewEditor({
  review,
  save,
  remove,
  removePhoto,
  publicUrl,
}: {
  review: Review;
  save: (b: Row) => Promise<void>;
  remove: () => Promise<void>;
  removePhoto: (id: string) => Promise<void>;
  publicUrl: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        ...Object.fromEntries(new FormData(e.currentTarget)),
        rating: Number(new FormData(e.currentTarget).get("rating")),
      });
      setMessage("Saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="card">
      <div className="card-top">
        <span className={`badge ${review.status}`}>
          {review.status === "rejected" ? "Hidden" : review.status}
        </span>
        <time>{new Date(review.created_at).toLocaleDateString()}</time>
      </div>
      <form onSubmit={submit}>
        <div className="two-col">
          <label>
            Name
            <input
              name="name"
              defaultValue={review.name}
              required
              maxLength={80}
            />
          </label>
          <label>
            Business
            <input
              name="business"
              defaultValue={review.business}
              maxLength={100}
            />
          </label>
        </div>
        <label>
          Work completed
          <input
            name="project"
            defaultValue={review.project}
            required
            maxLength={100}
          />
        </label>
        <label>
          Review
          <textarea
            name="text"
            defaultValue={review.text}
            required
            minLength={20}
            maxLength={1500}
            rows={4}
          />
        </label>
        <div className="two-col">
          <label>
            Rating
            <select name="rating" defaultValue={review.rating}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            Visibility
            <select name="status" defaultValue={review.status}>
              <option value="published">Published</option>
              <option value="rejected">Hidden</option>
            </select>
          </label>
        </div>
        <p className="muted">
          Text changes are marked “Edited by administrator” on the website.
        </p>
        <div className="actions">
          <button disabled={busy}>{busy ? "Saving…" : "Save review"}</button>
          <button
            type="button"
            className="danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm("Permanently delete this review and its photos?"))
                return;
              setBusy(true);
              try {
                await remove();
              } catch (e) {
                setMessage(
                  e instanceof Error ? e.message : "Could not delete.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            Delete
          </button>
        </div>
        {message && <p role="status">{message}</p>}
      </form>
      {review.images.length > 0 && (
        <div className="photos">
          {review.images.map((url) => (
            <div key={url}>
              <a
                href={new URL(url, publicUrl).href}
                target="_blank"
                rel="noopener noreferrer"
              >
                Customer photo
              </a>
              <button
                className="secondary"
                disabled={busy}
                onClick={async () => {
                  if (!confirm("Delete this photo?")) return;
                  try {
                    await removePhoto(url.split("/").pop()!);
                  } catch (e) {
                    setMessage(
                      e instanceof Error ? e.message : "Could not delete.",
                    );
                  }
                }}
              >
                Remove photo
              </button>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
export default function Dashboard({ publicUrl }: { publicUrl: string }) {
  const [tab, setTab] = useState("reviews"),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]),
    [requests, setRequests] = useState<RequestItem[]>([]),
    [items, setItems] = useState<Portfolio[]>([]),
    [categories, setCategories] = useState<{ slug: string; title: string }[]>(
      [],
    ),
    [settings, setSettings] = useState<Record<string, string>>({});
  const [offset, setOffset] = useState(0),
    [more, setMore] = useState(false),
    [category, setCategory] = useState(""),
    [showHidden, setShowHidden] = useState(false),
    [visibleCount, setVisibleCount] = useState(24);
  async function refresh(current = tab, start = offset) {
    setLoading(true);
    setMessage("");
    try {
      const data = await api(
        `${current}${["reviews", "requests"].includes(current) ? `/${start}` : ""}`,
      );
      if (current === "reviews") {
        setReviews(data.reviews);
        setMore(data.reviews.length === 30);
      }
      if (current === "requests") {
        setRequests(data.requests);
        setMore(data.requests.length === 30);
      }
      if (current === "portfolio") {
        setItems(data.items);
        setCategories(data.categories);
      }
      if (current === "settings") setSettings(data);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not load.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    api(`${tab}${["reviews", "requests"].includes(tab) ? `/${offset}` : ""}`)
      .then((data) => {
        if (!active) return;
        if (tab === "reviews") {
          setReviews(data.reviews);
          setMore(data.reviews.length === 30);
        }
        if (tab === "requests") {
          setRequests(data.requests);
          setMore(data.requests.length === 30);
        }
        if (tab === "portfolio") {
          setItems(data.items);
          setCategories(data.categories);
        }
        if (tab === "settings") setSettings(data);
      })
      .catch((e) => {
        if (active)
          setMessage(e instanceof Error ? e.message : "Could not load.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, offset]);
  async function mutate(path: string, method: string, body?: unknown) {
    await api(path, method, body);
    await refresh();
  }
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSaving(true);
    try {
      await api("portfolio", "POST", new FormData(form));
      form.reset();
      await refresh();
      setMessage("Image added to the website.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }
  async function saveSettings(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(
        "settings",
        "PUT",
        Object.fromEntries(new FormData(e.currentTarget)),
      );
      setMessage("Business details saved to the website.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }
  const filtered = items.filter(
    (i) => (!category || i.category === category) && (showHidden || !i.hidden),
  );
  return (
    <div className="shell">
      <header>
        <Link className="brand" href="/">
          <span className="brand-mark">M</span>
          <span>
            Mongoose <small>Website dashboard</small>
          </span>
        </Link>
        <div className="actions">
          <a
            className="secondary"
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View website ↗
          </a>
          <button
            className="secondary"
            onClick={async () => {
              const res = await fetch("/api/auth", {
                method: "DELETE",
                headers: { "x-requested-with": "fetch" },
              });
              if (res.ok) window.location.assign("/login");
              else setMessage("Sign-out failed. Please retry.");
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <nav aria-label="Dashboard sections">
        {["reviews", "requests", "portfolio", "settings"].map((name) => (
          <button
            aria-current={tab === name ? "page" : undefined}
            className={tab === name ? "active" : ""}
            key={name}
            onClick={() => {
              if (name === tab) return;
              setLoading(true);
              setMessage("");
              setOffset(0);
              setTab(name);
            }}
          >
            {name === "requests"
              ? "Contact requests"
              : name === "settings"
                ? "Business details"
                : name[0].toUpperCase() + name.slice(1)}
          </button>
        ))}
      </nav>
      <main>
        <div className="page-heading">
          <div>
            <p className="eyebrow">WEBSITE MANAGEMENT</p>
            <h1>
              {tab === "requests"
                ? "Contact requests"
                : tab === "settings"
                  ? "Business details"
                  : tab[0].toUpperCase() + tab.slice(1)}
            </h1>
            <p>
              {tab === "reviews"
                ? "Reviews are published automatically. Edit, hide or delete them here."
                : tab === "requests"
                  ? "Every website contact submission arrives in this inbox."
                  : tab === "portfolio"
                    ? "Add work to a category, or manage uploads and existing folder images."
                    : "Update the contact information your customers see."}
            </p>
          </div>
          <button
            className="secondary"
            disabled={loading}
            onClick={() => void refresh()}
          >
            Refresh
          </button>
        </div>
        {message && (
          <div className="notice" role="status">
            {message}
          </div>
        )}
        {loading ? (
          <p role="status">Loading…</p>
        ) : (
          <>
            {tab === "reviews" && (
              <div className="content-grid">
                {reviews.map((r) => (
                  <ReviewEditor
                    key={`${r.id}:${r.created_at}:${r.status}:${r.text}:${r.images.length}`}
                    review={r}
                    publicUrl={publicUrl}
                    save={(b) => mutate(`reviews/${r.id}`, "PATCH", b)}
                    remove={() => mutate(`reviews/${r.id}`, "DELETE")}
                    removePhoto={(id) =>
                      mutate(`review-images/${id}`, "DELETE")
                    }
                  />
                ))}
                {!reviews.length && (
                  <div className="empty">No reviews on this page.</div>
                )}
              </div>
            )}
            {tab === "requests" && (
              <div className="content-grid">
                {requests.map((r) => (
                  <article className="card" key={r.id}>
                    <div className="card-top">
                      <span className={`badge ${r.status}`}>{r.status}</span>
                      <time>{new Date(r.created_at).toLocaleString()}</time>
                    </div>
                    <h2>{r.data.fullName}</h2>
                    <dl>
                      {Object.entries(r.data).map(([k, v]) => (
                        <div key={k}>
                          <dt>
                            {(
                              {
                                fullName: "Name",
                                companyName: "Business",
                                preferredDate: "Preferred date",
                              } as Record<string, string>
                            )[k] || k}
                          </dt>
                          <dd>{v || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="attachments">
                      {r.attachments.map((a) => (
                        <a key={a.id} href={`/api/backend/attachments/${a.id}`}>
                          Download {a.filename}
                        </a>
                      ))}
                    </div>
                    {r.attachments.some(
                      (a) => a.mime === "application/pdf",
                    ) && (
                      <p className="muted">
                        PDFs are untrusted customer files. Download only if
                        expected; they are never displayed inline.
                      </p>
                    )}
                    <div className="actions">
                      <select
                        aria-label="Request status"
                        value={r.status}
                        disabled={saving}
                        onChange={async (e) => {
                          setSaving(true);
                          try {
                            await mutate(`requests/${r.id}`, "PATCH", {
                              status: e.target.value,
                            });
                          } catch (e) {
                            setMessage(
                              e instanceof Error
                                ? e.message
                                : "Could not save.",
                            );
                          } finally {
                            setSaving(false);
                          }
                        }}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        className="danger"
                        disabled={saving}
                        onClick={async () => {
                          if (
                            !confirm("Delete this request and its attachments?")
                          )
                            return;
                          try {
                            await mutate(`requests/${r.id}`, "DELETE");
                          } catch (e) {
                            setMessage(
                              e instanceof Error
                                ? e.message
                                : "Could not delete.",
                            );
                          }
                        }}
                      >
                        Delete request
                      </button>
                    </div>
                  </article>
                ))}
                {!requests.length && (
                  <div className="empty">No contact requests on this page.</div>
                )}
              </div>
            )}
            {tab === "portfolio" && (
              <>
                <form className="card upload" onSubmit={upload}>
                  <h2>Add a project image</h2>
                  <div className="two-col">
                    <label>
                      Portfolio category
                      <select name="category" required>
                        <option value="">Select category</option>
                        {categories.map((c) => (
                          <option key={c.slug} value={c.slug}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Image
                      <input
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Caption (optional)
                    <input name="caption" maxLength={200} />
                  </label>
                  <p className="muted">
                    JPG, PNG or WebP, up to 2 MB. Images are resized and
                    stripped of metadata.
                  </p>
                  <button disabled={saving}>
                    {saving ? "Uploading…" : "Add image"}
                  </button>
                </form>
                <div className="filters">
                  <select
                    aria-label="Filter portfolio category"
                    value={category}
                    onChange={(e) => {
                      setVisibleCount(24);
                      setCategory(e.target.value);
                    }}
                  >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                      <option value={c.slug} key={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={showHidden}
                      onChange={(e) => {
                        setVisibleCount(24);
                        setShowHidden(e.target.checked);
                      }}
                    />
                    Show hidden images
                  </label>
                  <span>{filtered.length} images</span>
                </div>
                <div className="portfolio-grid">
                  {filtered.slice(0, visibleCount).map((i) => (
                    <article className="card image-card" key={i.id}>
                      <a
                        href={new URL(i.url, publicUrl).href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Image
                          unoptimized
                          width={400}
                          height={300}
                          src={
                            i.source === "upload"
                              ? `/api/backend/images/${i.id}`
                              : `/api/backend/folder-images/${Array.from(
                                  new TextEncoder().encode(i.url),
                                )
                                  .map((b) => b.toString(16).padStart(2, "0"))
                                  .join("")}`
                          }
                          alt={i.caption || `${i.category} project`}
                          loading="lazy"
                        />
                      </a>
                      <div className="image-info">
                        <strong>
                          {categories.find((c) => c.slug === i.category)?.title}
                        </strong>
                        <p className="muted">
                          {i.source === "folder"
                            ? "Folder image"
                            : "Dashboard upload"}
                          {i.hidden ? " · Hidden" : ""}
                        </p>
                        <div className="actions">
                          <button
                            className="secondary"
                            disabled={saving}
                            onClick={async () => {
                              setSaving(true);
                              try {
                                await mutate("portfolio", "PATCH", {
                                  id: i.id,
                                  source: i.source,
                                  hidden: !i.hidden,
                                });
                              } catch (e) {
                                setMessage(
                                  e instanceof Error
                                    ? e.message
                                    : "Could not save.",
                                );
                              } finally {
                                setSaving(false);
                              }
                            }}
                          >
                            {i.hidden ? "Restore" : "Hide"}
                          </button>
                          {i.source === "upload" && (
                            <button
                              className="danger"
                              disabled={saving}
                              onClick={async () => {
                                if (
                                  !confirm(
                                    "Delete this uploaded image permanently?",
                                  )
                                )
                                  return;
                                try {
                                  await mutate(`portfolio/${i.id}`, "DELETE");
                                } catch (e) {
                                  setMessage(
                                    e instanceof Error
                                      ? e.message
                                      : "Could not delete.",
                                  );
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <button
                    className="secondary"
                    onClick={() => setVisibleCount((n) => n + 24)}
                  >
                    More images
                  </button>
                )}
                <p className="muted">
                  Folder images can be hidden and restored here. You can still
                  add files to public/portfolio/&lt;category&gt; in the public
                  repository and redeploy.
                </p>
              </>
            )}
            {tab === "settings" && (
              <form className="card settings" onSubmit={saveSettings}>
                {Object.entries(settingsLabels).map(([key, label]) => (
                  <label key={key}>
                    {label}
                    {key === "city" ? (
                      <textarea
                        name={key}
                        defaultValue={settings[key]}
                        required
                        maxLength={300}
                        rows={3}
                      />
                    ) : (
                      <input
                        name={key}
                        type={
                          key === "email"
                            ? "email"
                            : ["facebook", "instagram", "linkedin"].includes(
                                  key,
                                )
                              ? "url"
                              : "text"
                        }
                        defaultValue={settings[key]}
                        required={[
                          "phoneDisplay",
                          "phoneRaw",
                          "email",
                          "hours",
                        ].includes(key)}
                        maxLength={
                          key === "email"
                            ? 254
                            : ["facebook", "instagram", "linkedin"].includes(
                                  key,
                                )
                              ? 500
                              : key === "phoneDisplay"
                                ? 40
                                : key === "phoneRaw"
                                  ? 30
                                  : 150
                        }
                      />
                    )}
                  </label>
                ))}
                <button disabled={saving}>
                  {saving ? "Saving…" : "Save business details"}
                </button>
              </form>
            )}
            {["reviews", "requests"].includes(tab) && (
              <div className="pagination">
                <button
                  className="secondary"
                  disabled={offset === 0}
                  onClick={() => {
                    setLoading(true);
                    setOffset((n) => Math.max(0, n - 30));
                  }}
                >
                  Previous
                </button>
                <span>Page {offset / 30 + 1}</span>
                <button
                  className="secondary"
                  disabled={!more}
                  onClick={() => {
                    setLoading(true);
                    setOffset((n) => n + 30);
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <footer>Mongoose · Secure website management</footer>
    </div>
  );
}
