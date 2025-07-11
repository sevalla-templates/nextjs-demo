export interface Article {
  slug: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  tags: string;
  description: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  image?: string;
  tags: string;
  description: string;
}

export interface UpdateArticleRequest extends CreateArticleRequest {
  slug: string;
}
