"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SearchModal = dynamic(() => import("./SearchModal"), { ssr: false });

export default function SearchModalWrapper() {
  const [tickers, setTickers] = useState<Record<string, { cik: string; title: string }>>({});

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        const response = await fetch("/api/tickers");
        const data = await response.json();
        setTickers(data);
      } catch (error) {
        console.error("Failed to fetch tickers:", error);
      }
    };

    fetchTickers();
  }, []);

  return <SearchModal tickers={tickers} />;
}
