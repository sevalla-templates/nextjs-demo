import type { Article, CreateArticleRequest } from './types';
import articlesData from '../data/articles.json';

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Get all articles (newest first)
export async function getAllArticles(): Promise<Article[]> {
  return [...articlesData].reverse();
}

// Get article by slug
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  return articles.find(article => article.slug === slug) || null;
}

// Create new article
export async function createArticle(data: CreateArticleRequest): Promise<Article> {
  const slug = generateSlug(data.title);
  const date = new Date().toISOString().slice(0, 10);
  
  const newArticle: Article = {
    slug,
    title: data.title,
    content: data.content,
    image: data.image,
    date,
    tags: data.tags,
    description: data.description,
  };

  return newArticle;
}

// Filter articles by tag (supports partial matching)
export async function getArticlesByTag(tag: string): Promise<Article[]> {
  const articles = await getAllArticles();
  const searchTerm = tag.toLowerCase().trim();
  
  return articles.filter(article =>
    article.tags
      .split(',')
      .map(t => t.trim().toLowerCase())
      .some(t => t.includes(searchTerm) || searchTerm.includes(t))
  );
}

// Get unique tags
export async function getAllTags(): Promise<string[]> {
  const articles = await getAllArticles();
  const tagSet = new Set<string>();
  
  articles.forEach(article => {
    article.tags.split(',').forEach(tag => {
      const trimmedTag = tag.trim();
      if (trimmedTag) tagSet.add(trimmedTag);
    });
  });
  
  return Array.from(tagSet).sort();
}
