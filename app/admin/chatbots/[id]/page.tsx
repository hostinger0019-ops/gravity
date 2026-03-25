"use client";

import { useParams } from "next/navigation";
import { BuilderPage } from "@/components/builder/BuilderPage";

export default function EditChatbotPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  return <BuilderPage id={id} />;
}

