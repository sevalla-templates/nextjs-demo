"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

export default function SearchModalWrapper() {
  const [articles, setArticles] = useState<any[]>([]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles");
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error("Failed to fetch articles:", error);
      }
    };

    fetchArticles();
  }, []);

  return <SearchModal articles={articles} />;
}
