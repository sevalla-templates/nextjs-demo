import { articles } from "../articles";

export async function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}
