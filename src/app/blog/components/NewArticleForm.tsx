"use client";
import { useState } from "react";
import type { CreateArticleRequest } from "@/lib/types";

interface NewArticleFormProps {
  onSuccess?: () => void;
}

export default function NewArticleForm({ onSuccess }: NewArticleFormProps) {
  const [formData, setFormData] = useState<CreateArticleRequest>({
    title: "",
    content: "",
    image: "",
    tags: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create article");
      }

      const newArticle = await response.json();
      setSuccess(true);
      setFormData({
        title: "",
        content: "",
        image: "",
        tags: "",
        description: "",
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create article");
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

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="p-4 bg-green-100 text-green-900 rounded mb-4">
          Article created successfully!
        </div>
        <button
          onClick={() => setSuccess(false)}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Create Another Article
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-4">Create New Article</h1>
      
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
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? "Creating..." : "Create Article"}
        </button>
        
        {error && (
          <div className="p-4 bg-red-100 text-red-900 rounded">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
