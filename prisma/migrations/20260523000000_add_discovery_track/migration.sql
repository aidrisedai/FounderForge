-- CreateTable: Domain
CREATE TABLE "Domain" (
    "id"          TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon"        TEXT NOT NULL,
    "keywords"    TEXT[],
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Domain_slug_key" ON "Domain"("slug");

-- CreateTable: DomainVideo
CREATE TABLE "DomainVideo" (
    "id"                 TEXT NOT NULL,
    "youtubeId"          TEXT NOT NULL,
    "title"              TEXT NOT NULL,
    "description"        TEXT,
    "thumbnailUrl"       TEXT,
    "channelTitle"       TEXT,
    "domainId"           TEXT NOT NULL,
    "transcript"         TEXT,
    "extractedProblems"  JSONB,
    "transcriptCachedAt" TIMESTAMP(3),
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DomainVideo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DomainVideo_youtubeId_key" ON "DomainVideo"("youtubeId");
CREATE INDEX "DomainVideo_domainId_idx" ON "DomainVideo"("domainId");

ALTER TABLE "DomainVideo"
    ADD CONSTRAINT "DomainVideo_domainId_fkey"
    FOREIGN KEY ("domainId") REFERENCES "Domain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: DiscoveredProblem
CREATE TABLE "DiscoveredProblem" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "videoId"     TEXT,
    "domainId"    TEXT,
    "problemText" TEXT NOT NULL,
    "notes"       TEXT,
    "graduated"   BOOLEAN NOT NULL DEFAULT false,
    "projectId"   TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DiscoveredProblem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DiscoveredProblem_userId_idx" ON "DiscoveredProblem"("userId");

ALTER TABLE "DiscoveredProblem"
    ADD CONSTRAINT "DiscoveredProblem_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DiscoveredProblem"
    ADD CONSTRAINT "DiscoveredProblem_videoId_fkey"
    FOREIGN KEY ("videoId") REFERENCES "DomainVideo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: 10 domains
INSERT INTO "Domain" ("id", "name", "slug", "description", "icon", "keywords", "createdAt") VALUES
  (gen_random_uuid(), 'HealthTech', 'healthtech', 'Healthcare technology, telehealth, patient care, medical devices, and digital health', '🏥', ARRAY['healthcare technology problems startup', 'digital health challenges opportunities', 'medical software pain points'], NOW()),
  (gen_random_uuid(), 'FinTech', 'fintech', 'Financial technology, payments, lending, personal finance, and banking', '💰', ARRAY['fintech startup problems opportunities', 'financial technology pain points', 'payments banking challenges founders'], NOW()),
  (gen_random_uuid(), 'EdTech', 'edtech', 'Education technology, online learning, tutoring, upskilling, and schools', '📚', ARRAY['edtech startup problems opportunities', 'education technology challenges', 'online learning pain points founders'], NOW()),
  (gen_random_uuid(), 'Climate & CleanTech', 'cleantech', 'Climate change, renewable energy, sustainability, and clean technology', '🌱', ARRAY['climate tech startup opportunities', 'cleantech problems founders', 'sustainability technology challenges'], NOW()),
  (gen_random_uuid(), 'Logistics & Supply Chain', 'logistics', 'Shipping, fulfillment, warehousing, last-mile delivery, and supply chain', '🚚', ARRAY['logistics startup problems opportunities', 'supply chain technology challenges', 'shipping fulfillment pain points'], NOW()),
  (gen_random_uuid(), 'Real Estate & PropTech', 'proptech', 'Property technology, real estate transactions, rentals, and smart buildings', '🏢', ARRAY['proptech startup problems opportunities', 'real estate technology challenges', 'property management pain points'], NOW()),
  (gen_random_uuid(), 'B2B SaaS', 'b2b-saas', 'Business software, productivity tools, workflow automation, and enterprise applications', '⚙️', ARRAY['b2b saas startup problems opportunities', 'business software challenges founders', 'enterprise software pain points'], NOW()),
  (gen_random_uuid(), 'HR & Future of Work', 'future-of-work', 'Hiring, remote work, talent management, workforce development, and HR tools', '👥', ARRAY['hr tech startup problems opportunities', 'future of work challenges founders', 'hiring talent management pain points'], NOW()),
  (gen_random_uuid(), 'Legal Tech', 'legaltech', 'Legal software, compliance, contract management, and access to justice', '⚖️', ARRAY['legal tech startup problems opportunities', 'legaltech challenges founders', 'compliance contract management pain points'], NOW()),
  (gen_random_uuid(), 'Consumer Apps', 'consumer', 'Consumer mobile apps, social platforms, marketplace apps, and lifestyle products', '📱', ARRAY['consumer app startup problems opportunities', 'mobile app challenges founders', 'consumer product pain points market'], NOW());
