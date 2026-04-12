"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import type { MenuSection, MenuItem } from "@/types";
import { MenuChatbot } from "@/components/ui/MenuChatbot";

function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col shadow-sm hover:shadow-md hover:border-[var(--accent)]/30 transition-all duration-150">
      {item.imageUrl ? (
        <div className="aspect-video overflow-hidden bg-[var(--border)] relative">
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-[var(--border)] flex items-center justify-center text-[var(--muted)] text-sm">
          No image
        </div>
      )}

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{item.title}</h3>
          <p className="text-[var(--muted)] text-sm mt-1">{item.description}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">{item.price1Description}</span>
            <span className="font-semibold text-[var(--foreground)]">{item.price1}</span>
          </div>
          {item.price2Description && item.price2 && (
            <div className="flex items-center justify-between text-sm border-t border-[var(--border)] pt-2">
              <span className="text-[var(--muted)]">{item.price2Description}</span>
              <span className="font-semibold text-[var(--foreground)]">{item.price2}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MenuPage() {
  const [sections, setSections] = useState<MenuSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.menu.list().then((res) => {
      if (res.success && res.data) {
        setSections(res.data);
      } else {
        setErrorMessage(res.error ?? "Failed to load menu");
      }
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1
            className="text-4xl font-bold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-family-heading)" }}
          >
            Our Menu
          </h1>
          <p className="text-[var(--muted)]">Explore our selection of dishes</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                <div className="aspect-video bg-[var(--border)] animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[var(--border)] rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-[var(--border)] rounded animate-pulse w-full" />
                  <div className="h-3 bg-[var(--border)] rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] p-6 text-center text-[var(--error)]">
            {errorMessage}
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center text-[var(--muted)] shadow-sm">
            No menu items available at the moment.
          </div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.name}>
                {section.name && (
                  <h2
                    className="text-2xl font-bold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--border)]"
                    style={{ fontFamily: "var(--font-family-heading)" }}
                  >
                    {section.name}
                  </h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {section.items.map((item, index) => (
                    <MenuItemCard key={index} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="pt-4 text-center">
          <Link
            href="/"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-150 text-sm"
          >
            ← Back to home
          </Link>
        </div>
      </div>
      <MenuChatbot />
    </main>
  );
}
