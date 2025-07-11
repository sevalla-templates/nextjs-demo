"use client";
import { useState } from "react";

export default function EditArticleForm({ article, onSave }: { article: any; onSave: () => void }) {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [image, setImage] = useState(article.image || "");
  const [description, setDescription] = useState(article.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/articles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: article.slug,
        title,
        content,
        image,
        date: article.date,
        description,
      }),
    });
    setSaving(false);
    if (res.ok) {
      onSave();
    } else {
      setError("Failed to save article");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8 p-4 bg-[#181d23] border border-[#23272f] rounded">
      <h2 className="text-xl font-bold mb-2">Edit Article</h2>
      <input
        className="border p-2 rounded"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        className="border p-2 rounded"
        placeholder="Content (HTML allowed)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        required
      />
      <input
        className="border p-2 rounded"
        placeholder="Image URL (optional)"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />
      <input
        className="border p-2 rounded"
        placeholder="Short Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
}
