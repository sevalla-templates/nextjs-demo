"use client";
import { useState, useEffect } from "react";
import type { Article, UpdateArticleRequest } from "@/lib/types";

interface EditArticleFormProps {
  article: Article;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditArticleForm({ article, onSuccess, onCancel }: EditArticleFormProps) {
  const [formData, setFormData] = useState<UpdateArticleRequest>({
    slug: article.slug,
    title: article.title || "",
    content: article.content || "",
    image: article.image || "",
    tags: article.tags || "",
    description: article.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/articles/${article.slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update article");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="mt-4 p-4 bg-[#181d23] border border-[#23272f] rounded">
      <h3 className="text-xl font-bold mb-4">Edit Article</h3>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          name="title"
          placeholder="Article Title"
          value={formData.title}
          onChange={handleChange}
          className="border p-2 rounded text-black"
          required
        />
        
        <textarea
          name="description"
          placeholder="Short Description"
          value={formData.description}
          onChange={handleChange}
          className="border p-2 rounded text-black"
          rows={2}
          required
        />
        
        <textarea
          name="content"
          placeholder="Article Content (HTML allowed)"
          value={formData.content}
          onChange={handleChange}
          className="border p-2 rounded text-black"
          rows={8}
          required
        />
        
        <input
          type="url"
          name="image"
          placeholder="Image URL (optional)"
          value={formData.image}
          onChange={handleChange}
          className="border p-2 rounded text-black"
        />
        
        <input
          type="text"
          name="tags"
          placeholder="Tags (comma-separated)"
          value={formData.tags}
          onChange={handleChange}
          className="border p-2 rounded text-black"
          required
        />
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
        
        {error && (
          <div className="p-4 bg-red-100 text-red-900 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
