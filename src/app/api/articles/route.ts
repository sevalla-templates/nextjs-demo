import { NextRequest, NextResponse } from 'next/server';
import { getAllArticles, createArticle } from '@/lib/articles';
import type { CreateArticleRequest } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

// GET /api/articles - Get all articles or filter by tag
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    
    if (tag) {
      const articles = await getAllArticles();
      const filtered = articles.filter(article =>
        article.tags
          .split(',')
          .map(t => t.trim().toLowerCase())
          .includes(tag.toLowerCase())
      );
      return NextResponse.json(filtered);
    }
    
    const articles = await getAllArticles();
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

// POST /api/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const data: CreateArticleRequest = await request.json();
    
    // Validate required fields
    if (!data.title || !data.content || !data.description) {
      return NextResponse.json(
        { error: 'Title, content, and description are required' },
        { status: 400 }
      );
    }
    
    const newArticle = await createArticle(data);
    
    // Read current articles
    const articlesPath = path.join(process.cwd(), 'src/data/articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);
    
    // Add new article
    articles.push(newArticle);
    
    // Write back to file
    await fs.writeFile(articlesPath, JSON.stringify(articles, null, 2));
    
    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
