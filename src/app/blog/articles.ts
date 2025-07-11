// Temporary in-memory articles array. In production, use a database or CMS.
export type Article = {
  slug: string;
  title: string;
  content: string;
  image?: string;
  date: string;
  tags: string;
};

export const articles: Article[] = [
  {
    slug: "first-post",
    title: "Welcome to the Blog!",
    content: "This is your first article. You can post text and images here.",
    image: "/blog/sample.jpg",
    date: "2025-07-09",
    tags: "Welcome to the blog! This is your first article.",
  },
];
