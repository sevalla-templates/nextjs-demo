import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllArticles } from "../getAllArticles";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const articles = await getAllArticles();
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.tags,
    openGraph: {
      title: article.title,
      description: article.tags,
      images: article.image ? [article.image] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.tags,
      images: article.image ? [article.image] : [],
    },
  };
}

const ArticleDetailPage = async ({ params }: { params: { slug: string } }) => {
  const articles = await getAllArticles();
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return notFound();

  return (
    <article className="max-w-2xl mx-auto py-12">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-600 text-sm mb-4">{article.date}</p>
      {/* ...rest of the article... */}
    </article>
  );
};

export default ArticleDetailPage;
