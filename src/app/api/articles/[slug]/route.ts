import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/articles';
import type { UpdateArticleRequest } from '@/lib/types';
import fs from 'fs/promises';
import path from 'path';

// GET /api/articles/[slug] - Get specific article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);
    
    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}

// PUT /api/articles/[slug] - Update specific article
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data: UpdateArticleRequest = await request.json();
    
    // Read current articles
    const articlesPath = path.join(process.cwd(), 'src/data/articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);
    
    // Find and update article
    const index = articles.findIndex((article: any) => article.slug === slug);
    if (index === -1) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    // Update article (keep original slug and date)
    articles[index] = {
      ...articles[index],
      title: data.title,
      content: data.content,
      image: data.image,
      tags: data.tags,
      description: data.description,
    };
    
    // Write back to file
    await fs.writeFile(articlesPath, JSON.stringify(articles, null, 2));
    
    return NextResponse.json(articles[index]);
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

// DELETE /api/articles/[slug] - Delete specific article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Read current articles
    const articlesPath = path.join(process.cwd(), 'src/data/articles.json');
    const articlesData = await fs.readFile(articlesPath, 'utf8');
    const articles = JSON.parse(articlesData);
    
    // Find and remove article
    const index = articles.findIndex((article: any) => article.slug === slug);
    if (index === -1) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }
    
    const deletedArticle = articles.splice(index, 1)[0];
    
    // Write back to file
    await fs.writeFile(articlesPath, JSON.stringify(articles, null, 2));
    
    return NextResponse.json(deletedArticle);
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
