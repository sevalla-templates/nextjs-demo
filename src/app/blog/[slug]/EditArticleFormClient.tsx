"use client";
import EditArticleForm from "./EditArticleForm";

export default function EditArticleFormClient({ article }: { article: any }) {
  return <EditArticleForm article={article} onSave={() => window.location.reload()} />;
}
