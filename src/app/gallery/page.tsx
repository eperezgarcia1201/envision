import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { galleryFallback } from "@/lib/content";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Recent project snapshots from Envision Maintenence operations.",
};

async function getGalleryItems() {
  try {
    const rows = await prisma.galleryAsset.findMany({
      orderBy: [{ capturedAt: "desc" }],
      take: 18,
    });

    if (rows.length > 0) {
      return rows.map((item) => ({
        title: item.title,
        caption: item.caption,
        category: item.category,
        imageUrl: item.imageUrl,
        location: item.location,
        capturedAt: item.capturedAt,
      }));
    }
  } catch {
    return galleryFallback.map((item) => ({
      ...item,
      capturedAt: null,
    }));
  }

  return galleryFallback.map((item) => ({
    ...item,
    capturedAt: null,
  }));
}

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Project Gallery</p>
          <h1 className="page-title">Field Work and Delivery Highlights</h1>
          <p className="page-lead">
            Placeholder visuals are used for now. The gallery is connected to backend records so
            future uploads can be managed through the platform.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="gallery-grid">
            {items.map((item) => (
              <article key={`${item.title}-${item.location}`} className="gallery-card">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={1200}
                  height={800}
                  unoptimized
                  className="gallery-image"
                />
                <div className="gallery-content">
                  <h3>{item.title}</h3>
                  <p>{item.caption}</p>
                  <div className="gallery-meta">
                    <span>{item.category}</span>
                    <span>{item.capturedAt ? formatDate(item.capturedAt) : item.location}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
