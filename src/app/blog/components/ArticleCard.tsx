"use client";
import Link from "next/link";
import type { Article } from "@/lib/types";

interface ArticleCardProps {
  article: Article;
  index?: number;
}

export default function ArticleCard({ article, index = 0 }: ArticleCardProps) {
  const isEven = index % 2 === 0;
  
  return (
    <li className={`border-b pb-6 flex items-start gap-4 ${!isEven ? 'flex-row-reverse' : ''}`}>
      {article.image && (article.image.startsWith('http') || article.image.startsWith('data:image')) && (
        <img
          src={article.image}
          alt={article.title}
          className={`w-20 h-14 object-cover rounded shadow-sm flex-shrink-0 mt-1 ${!isEven ? 'ml-4' : 'mr-4'}`}
          width={80}
          height={56}
          loading="lazy"
        />
      )}
      <div className="flex-1">
        <Link 
          href={`/blog/${article.slug}`}
          className="text-2xl font-semibold hover:underline"
        >
          {article.title}
        </Link>
        <p className="text-gray-600 text-sm mt-1">{article.date}</p>
        <p className="mt-2 text-gray-800">{article.tags}</p>
        {article.description && (
          <p className="mt-2 text-gray-700 text-sm">
            {article.description.slice(0, 150)}
            {article.description.length > 150 ? "..." : ""}
          </p>
        )}
      </div>
    </li>
  );
}
