import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { serviceBlueprint } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  description: "Service packages for Los Angeles maintenance and construction operations.",
};

async function getServiceCatalog() {
  try {
    const packages = await prisma.servicePackage.findMany({
      orderBy: [{ createdAt: "asc" }],
    });

    if (packages.length > 0) {
      return packages.map((item) => ({
        slug: item.slug,
        name: item.name,
        summary: item.summary,
        responseSlaHours: item.responseSlaHours,
        coverageArea: item.coverageArea,
        startingPrice: item.startingPrice,
        featured: item.featured,
      }));
    }
  } catch {
    return serviceBlueprint;
  }

  return serviceBlueprint;
}

export default async function ServicesPage() {
  const services = await getServiceCatalog();

  return (
    <>
      <section className="page-banner">
        <div className="container">
          <p className="section-label">Service Catalog</p>
          <h1 className="page-title">Flexible Programs for Demanding Properties</h1>
          <p className="page-lead">
            Packages are structured for repeatability and clear handoff. SLA expectations,
            coverage boundaries, and pricing tiers are defined up front.
          </p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="grid-3">
            {services.map((service) => (
              <article key={service.slug} className="service-card">
                <h3>{service.name}</h3>
                <p>{service.summary}</p>
                <div className="service-meta">
                  <span>SLA Target: {service.responseSlaHours} hours</span>
                  <span>Coverage: {service.coverageArea}</span>
                  <span>Starting Price: {service.startingPrice}</span>
                </div>
                {service.featured ? <span className="featured-tag">Featured</span> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
