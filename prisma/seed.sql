-- FounderForge Discovery Module - Curated Video Seed
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING)
-- Run AFTER: npx prisma migrate deploy

-- HEALTHTECH
INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'fzcUaxTmuV0',
  'Health Tech Founders: The Future of Care Is Personalized, Proactive—and AI-Powered',
  'a16z Bio & Health partners discuss what happens when AI meets healthcare: personalization, proactive monitoring, and the startup opportunities inside clinical workflows.',
  'https://img.youtube.com/vi/fzcUaxTmuV0/hqdefault.jpg',
  'a16z',
  (SELECT id FROM "Domain" WHERE slug='healthtech'),
  '{"domainContext":"Digital health is shifting from reactive treatment to proactive, AI-powered personalization. Data bottlenecks, clinician burnout, and fragmented EHR systems create massive startup opportunities for founders who can navigate healthcare''s regulatory complexity.","problems":[{"title":"Clinician burnout from documentation overload","description":"Physicians spend 2+ hours on administrative documentation for every hour of patient care, leading to burnout and reduced capacity. AI tools that automate EHR notes at the point of care are in high demand."},{"title":"Care is reactive, not preventive","description":"Most healthcare systems only engage patients when they''re already sick. Founders who can build continuous monitoring tools that flag risk before a crisis occurs address a core structural gap."},{"title":"Health data is siloed and non-interoperable","description":"Patient records, lab results, imaging, and wearable data live in disconnected systems. Startups that unify this data — while maintaining HIPAA compliance — unlock personalized care paths that don''t exist today."},{"title":"Mental health access has a supply-demand mismatch","description":"There are not enough licensed therapists to meet demand, especially in rural areas and underserved communities. Scalable digital mental health tools that complement (rather than replace) clinical care have a large addressable market."}],"questions":["Have you ever struggled to navigate a healthcare system — scheduling, records, referrals — and wondered why it felt so broken?","Do you know clinicians who spend more time on paperwork than with patients? What would they pay to fix that?","What would change if a patient''s full health picture was available in real time to every provider they interact with?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'pfbiHmRPmV8',
  'The Future of Personalized Healthcare Technology',
  'Dr. Jessica Mega from Stanford walks through the convergence of genomics, wearables, and AI models to deliver n-of-1 medical treatments tailored to individual biology.',
  'https://img.youtube.com/vi/pfbiHmRPmV8/hqdefault.jpg',
  'Stanford Online',
  (SELECT id FROM "Domain" WHERE slug='healthtech'),
  '{"domainContext":"Precision medicine is moving from population-level treatment protocols to individualized therapies based on a patient''s genome, microbiome, and real-time biomarkers. The infrastructure to collect, analyze, and act on this data is still being built.","problems":[{"title":"Genomic data collection lacks patient incentives","description":"Most people have never had their genome sequenced despite costs dropping below $200. There''s a business model gap between collecting genomic data at scale and translating it into actionable health guidance patients will pay for."},{"title":"Clinical trial recruitment is slow and unrepresentative","description":"Drug trials take years partly because finding qualified, diverse participants is expensive and manual. AI-matched patient registries that connect trials to eligible participants faster could cut years off drug development timelines."},{"title":"Wearable health data is not integrated into clinical decisions","description":"Millions of people generate continuous health signals from smartwatches and CGMs, but physicians have no practical way to incorporate this data into treatment decisions. The middleware layer between consumer devices and clinical care is mostly unbuilt."}],"questions":["If your doctor could see your health data from the past year — sleep, activity, heart rate, glucose — would your care be better? What would you pay for that?","Why do you think your genome isn''t already part of your standard medical record?","Have you or someone you know participated in a clinical trial? What made it hard to find or join?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'x0yt31WSGIs',
  'AI: The Ultimate Healthcare Hire',
  'The healthcare system faces a structural shortage of clinicians. This a16z discussion explores how AI can fill roles that would otherwise require expensive human specialists.',
  'https://img.youtube.com/vi/x0yt31WSGIs/hqdefault.jpg',
  'a16z Bio & Health',
  (SELECT id FROM "Domain" WHERE slug='healthtech'),
  '{"domainContext":"A growing shortage of nurses, physicians, and specialists — combined with an aging global population — creates a capacity crisis in healthcare that cannot be solved by training more humans alone. AI-native clinical tools are moving from experimental to essential.","problems":[{"title":"Nursing shortage is structural, not cyclical","description":"The US is projected to be short 450,000 nurses by 2025. AI tools that handle intake, triage, and follow-up — reducing the cognitive load on existing nursing staff — address a problem that will only get worse."},{"title":"Specialist access outside major cities is nearly nonexistent","description":"Most Americans live more than an hour from a specialist, leading to delayed diagnoses and worse outcomes for treatable conditions. Telehealth with AI-assisted triage can extend specialist reach but the UX and workflow integration remain unsolved."},{"title":"Prior authorization creates dangerous care delays","description":"Insurance prior authorization for procedures and medications delays care by days or weeks and consumes enormous clinician time. Startups automating this process have clear ROI and a frustrated buyer in every hospital system."}],"questions":["When was the last time you (or someone you know) had to wait weeks for a specialist appointment? What were the consequences of that delay?","If an AI could give you a preliminary diagnosis and triage recommendation at 2am, would you trust it? What would it take?","What part of the healthcare experience feels most like it should have been automated 10 years ago?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- FINTECH
INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'nuC-UGxmAks',
  'The Future of Money: Banking on Fintech',
  'An in-depth a16z discussion on how fintech startups are rebuilding financial infrastructure across payments, lending, insurance, and banking — and where the next wave of opportunity lies.',
  'https://img.youtube.com/vi/nuC-UGxmAks/hqdefault.jpg',
  'a16z',
  (SELECT id FROM "Domain" WHERE slug='fintech'),
  '{"domainContext":"Legacy financial infrastructure — built on batch processing, physical branches, and risk-averse compliance culture — is being dismantled layer by layer by software-native companies. The opportunity in fintech is not just making existing services cheaper, but enabling entirely new financial behaviors.","problems":[{"title":"Cross-border payments are slow, expensive, and opaque","description":"Sending money internationally still takes days and costs 5–10% in fees. Migrant workers sending remittances home are the hardest hit. Startups building on faster rails — SEPA, PIX, UPI — are winning this market region by region."},{"title":"Underwriting still relies on FICO scores that exclude billions","description":"Traditional credit scoring ignores rent payments, utility history, cash flow patterns, and employment stability — leaving 1.4 billion people globally without access to credit. Alternative data underwriting models are underbuilt."},{"title":"SMB back-office finance is a fragmented, manual nightmare","description":"Small businesses stitch together payroll, invoicing, accounting, tax, and banking across 4–6 disconnected tools. An integrated financial OS for small businesses has a massive addressable market and low customer acquisition cost through direct distribution."},{"title":"Real-time fraud detection lags behind real-time payments","description":"As payment rails go real-time, chargebacks and fraud recovery become harder. The fraud detection toolchain needs to move from batch analysis to millisecond inference — an open problem for most banks and payment processors."}],"questions":["Have you ever tried to send money internationally and been frustrated by the fees or delays? Who do you think captures that money?","If you were starting a business today, how would you handle payments, payroll, and accounting? How many tools would you need?","Who in your network has been denied a loan or credit card despite being financially responsible? Why did that happen?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  '4j5vN0gCX90',
  'How AI is Powering Payments, with Greg Ulrich of Mastercard',
  'Mastercard''s AI lead joins a16z to discuss how a global payments network deploys machine learning for fraud detection, transaction routing, and financial inclusion.',
  'https://img.youtube.com/vi/4j5vN0gCX90/hqdefault.jpg',
  'a16z',
  (SELECT id FROM "Domain" WHERE slug='fintech'),
  '{"domainContext":"Payments infrastructure is becoming the substrate on which new financial products are built. AI is not just improving fraud detection — it''s enabling real-time decisioning, dynamic routing, and embedded financial services at the point of transaction.","problems":[{"title":"Merchant chargeback dispute resolution is manual and slow","description":"Merchants lose an estimated $20 billion annually to chargeback fraud, and dispute resolution often takes 60–90 days. An AI-assisted evidence-gathering and dispute management product has a clear B2B buyer in every e-commerce merchant."},{"title":"Card-not-present fraud is rising with e-commerce growth","description":"As physical card usage declines, card-not-present fraud is now the primary fraud vector. Real-time behavioral biometrics and device fingerprinting that detect fraud before authorization — not after — are the next frontier."},{"title":"Embedded finance implementation is complex for non-financial companies","description":"Every company wants to embed financial products (BNPL, rewards, insurance) into their customer experience, but the compliance, banking partner, and technical integration work is prohibitive for most product teams. The middleware stack is still being built."}],"questions":["Have you ever had a legitimate transaction declined by fraud detection? How did that feel as a customer?","What would it mean for a retailer to offer instant financing at the point of sale without sending the customer to a separate app?","How many places in your daily life touch a payment rail without you realizing it?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'Z8JFCJP70rg',
  'The Open Source Movement in Fintech',
  'How open banking standards, shared APIs, and developer-first infrastructure are lowering barriers to fintech innovation and enabling new classes of financial products.',
  'https://img.youtube.com/vi/Z8JFCJP70rg/hqdefault.jpg',
  'a16z',
  (SELECT id FROM "Domain" WHERE slug='fintech'),
  '{"domainContext":"Open banking mandates in the UK, EU, and Brazil — combined with the rise of API-first financial infrastructure providers — are making it possible to build a full-featured bank in months rather than years. The question now is which new financial behaviors this unlocks.","problems":[{"title":"Account aggregation APIs are unreliable and consent-heavy","description":"Open banking promises users a unified view of their finances, but screen-scraping failures and consent friction make aggregation products fragile. Standardized, permissioned data APIs with high uptime remain a gap in most markets."},{"title":"Fintech compliance costs are regressive — crushing small players","description":"KYC, AML, and BSA compliance infrastructure costs $500K–$2M to build initially, which advantages large incumbents and crushes early-stage fintech. Compliance-as-a-service platforms that let startups rent this infrastructure could 10x the number of fintech companies that get built."}],"questions":["If your bank could see all your other financial accounts (with permission), what better products could they offer you?","What financial product would you love to exist but doesn''t seem to be built anywhere?","Why do you think financial compliance is still largely a manual, human-intensive process?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- CLEANTECH
INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'IQF5mWuBd-o',
  'We don''t need to expand the grid – we just need to make it smarter',
  'Instead of building more physical grid infrastructure, software-defined demand response, grid edge intelligence, and distributed energy resources can dramatically increase grid capacity.',
  'https://img.youtube.com/vi/IQF5mWuBd-o/hqdefault.jpg',
  'Abundance Institute',
  (SELECT id FROM "Domain" WHERE slug='cleantech'),
  '{"domainContext":"The energy transition is fundamentally a software problem. The physical infrastructure for renewable generation exists or is being built — the gap is in grid intelligence, demand flexibility, and the software layer that coordinates millions of distributed energy assets.","problems":[{"title":"Grid operators can''t see or control distributed energy resources","description":"Millions of rooftop solar panels, EV chargers, and home batteries are connected to the grid but invisible to grid operators. Software that aggregates and controls these assets as a virtual power plant has enormous value but requires complex coordination across many hardware platforms."},{"title":"Energy consumption is price-insensitive because pricing signals don''t reach end users","description":"Time-of-use pricing exists but most consumers don''t respond to it because devices lack intelligence and utilities lack the customer UX to make it salient. Smart home energy management that automatically shifts load to cheap periods has a clear consumer value proposition."},{"title":"Long-duration storage is still economically unproven at scale","description":"Lithium batteries work for 4-hour storage but grid-scale renewable intermittency requires 12–100 hour storage. Iron-air batteries, gravity storage, and green hydrogen are all in early deployment — the business models and offtake markets are still being defined."},{"title":"Commercial building energy management is low-tech despite massive opportunity","description":"Commercial buildings account for 40% of US energy use. Most building management systems are 20-year-old HVAC controllers with no machine learning. AI-native energy management systems that reduce commercial energy bills 20–30% have a straightforward B2B sell."}],"questions":["Do you know how much energy your home or office uses during peak demand hours? Would knowing change your behavior?","What would it take for you to let a software system automatically shift your energy usage to save money?","Have you seen the massive transmission lines in your region and wondered who decides where they go and who pays for them?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- SKIPPED duplicate youtubeId: Z8JFCJP70rg

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'Sq-y-wiZduE',
  'How to Fix Renewable Energy''s Hidden Infrastructure Problem',
  'The US has ambitious renewable energy goals but the transmission grid is a 50-year-old bottleneck. New projects wait 5+ years in interconnection queues, strangling the clean energy transition.',
  'https://img.youtube.com/vi/Sq-y-wiZduE/hqdefault.jpg',
  'The Wall Street Journal',
  (SELECT id FROM "Domain" WHERE slug='cleantech'),
  '{"domainContext":"The US electricity grid was designed for centralized fossil fuel plants. Renewable energy is distributed and geographically variable — the grid architecture, permitting processes, and market rules were not designed for it. The transmission buildout needed is the largest infrastructure project in US history.","problems":[{"title":"Grid interconnection queues take 5+ years and kill clean energy projects","description":"Renewable energy developers wait years for utility approval to connect to the grid, with most projects dropping out. Software that models interconnection feasibility, estimates wait times, and optimizes queue strategy could save developers millions in sunk project costs."},{"title":"Transmission permitting crosses dozens of jurisdictions","description":"A single transmission line may cross federal land, state jurisdictions, and private parcels — each with separate approval processes. Project management and permitting software specifically built for transmission development is a specialized gap with large customers."},{"title":"Energy storage siting is largely guesswork without real-time grid data","description":"Deciding where to site a battery storage project requires knowing where grid congestion is worst, where renewable curtailment is highest, and where capacity payments are available. A data platform that answers these questions for project developers is missing."}],"questions":["Have you heard of a renewable energy project in your region that was delayed or cancelled? What was the reason?","Why do you think building new power lines is harder in the US than in Europe?","If you were developing a solar farm, what information would you need to decide where to build and how to connect to the grid?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'v1BMWczn7JM',
  'How Does the Power Grid Work?',
  'A clear, visual explanation of how the electrical grid transmits power from generators to homes and businesses — covering transmission, distribution, frequency control, and grid balancing.',
  'https://img.youtube.com/vi/v1BMWczn7JM/hqdefault.jpg',
  'Practical Engineering',
  (SELECT id FROM "Domain" WHERE slug='cleantech'),
  '{"domainContext":"The electricity grid is one of the most complex engineered systems ever built, operating in real time with zero tolerance for imbalance. Understanding how it actually works reveals why integrating variable renewables is technically challenging and where software can help.","problems":[{"title":"Grid frequency stability is increasingly difficult with renewable-heavy systems","description":"Traditional generators provide inertia that stabilizes grid frequency. As they''re replaced with solar and wind, the grid becomes more volatile. Grid-forming inverters and synthetic inertia services are early-stage markets with regulatory mandates emerging."},{"title":"Distribution utilities have no real-time visibility into their own network","description":"Most local electric utilities don''t have smart meters or sensors across their distribution network — meaning they learn about outages from customer calls, not sensors. Distribution automation and SCADA modernization is a multi-billion dollar spending category with no dominant software vendor."}],"questions":["Have you ever wondered what happens in the milliseconds between when you flip a switch and the light turns on?","Why does it seem like power outages always happen during the hottest or coldest days? What does that tell you about grid design?","If utilities knew where outages were going to happen before they did, how much would that be worth?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- B2B-SAAS
INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'dvVbA9OcBqs',
  'Box CEO on AI Agents & Why Enterprise Can''t Keep Up',
  'Aaron Levie, CEO of Box, joins a16z to discuss the gap between AI''s capabilities and enterprise''s ability to deploy it — and what it means for incumbents and challengers.',
  'https://img.youtube.com/vi/dvVbA9OcBqs/hqdefault.jpg',
  'a16z',
  (SELECT id FROM "Domain" WHERE slug='b2b-saas'),
  '{"domainContext":"Enterprise AI adoption is lagging behind the hype because of data governance, change management, and integration challenges rather than a shortage of AI tools. Startups that solve these deployment barriers — not just build AI features — have a clear enterprise wedge.","problems":[{"title":"Enterprise AI pilots fail to reach production due to data governance gaps","description":"Most large companies run AI pilots successfully but can''t bring them to production because they lack proper data cataloging, access controls, and lineage tracking. A data governance layer purpose-built for AI deployment is in high demand from enterprise IT teams."},{"title":"AI agents can''t take action in enterprise software without risky broad permissions","description":"Deploying AI agents that interact with ERP, CRM, and HR systems requires giving them access permissions that are too broad for security teams to approve. Fine-grained, audit-logged agent permissioning systems are an unsolved problem blocking enterprise AI deployment."},{"title":"Enterprise change management for AI tooling is a bottleneck no software solves","description":"The people problem of AI adoption — training employees, changing workflows, measuring productivity impact — is larger than the technical problem. Software-assisted change management products that track adoption, identify resistors, and measure ROI are an emerging category."},{"title":"Unstructured data in enterprises is untapped and largely invisible","description":"90% of enterprise data lives in documents, emails, contracts, and call recordings — unindexed and unsearchable. AI that can reliably extract structured insights from unstructured enterprise data is the unlock for dozens of downstream AI applications."}],"questions":["Has your company tried to deploy an AI tool and hit unexpected obstacles? What stopped you from getting it to full production?","Who in your organization would have to approve giving an AI agent access to your CRM data? How long would that take?","What task at work do you do that feels like it should be automated but isn''t? What would it take to automate it?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  '0lzo2tFBFy8',
  'Atlassian CEO on the SaaS Apocalypse, AI Agents & What Comes Next',
  'Mike Cannon-Brookes discusses how AI is restructuring the economics of enterprise software — from per-seat licensing to outcome-based pricing — and what it means for the next generation of B2B companies.',
  'https://img.youtube.com/vi/0lzo2tFBFy8/hqdefault.jpg',
  'a16z',
  (SELECT id FROM "Domain" WHERE slug='b2b-saas'),
  '{"domainContext":"Per-seat SaaS pricing is breaking down as AI agents do work that previously required human seats. The business model shift from software-as-a-service to software-as-an-agent creates massive disruption for incumbents and a clear opening for startups to build outcome-priced alternatives.","problems":[{"title":"Per-seat SaaS pricing becomes absurd when AI can hold a seat","description":"If an AI agent can perform the same tasks as a licensed user, per-seat pricing becomes economically incoherent. Enterprise buyers are already pushing back on seat costs for tools where AI augments or replaces the human. New pricing models tied to outcomes or compute are being invented now."},{"title":"Legacy SaaS products accumulate UI debt that blocks AI integration","description":"Incumbents built for human users — with complex GUIs, manual workflows, and opaque data models — struggle to add AI-native features without rebuilding core architecture. Startups who build AI-first from day one don''t carry this technical debt."},{"title":"Enterprise software procurement doesn''t know how to evaluate AI products","description":"Procurement teams have mature frameworks for evaluating traditional software (security reviews, price benchmarking, reference checks) but no equivalent for AI products (hallucination rates, agent reliability, data privacy). This gap delays every enterprise AI sale."}],"questions":["If an AI could do most of what your team uses your project management software for, should you pay the same price per seat?","What B2B software product do you use that feels 10 years old despite recent AI feature additions?","What would enterprise software look like if it were designed from scratch today with AI agents as primary users?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'cxcb55zr2Q8',
  'How AI is breaking the SaaS business model',
  'A fast-paced technical breakdown of how AI coding, AI workflows, and agent-based automation are eroding the moats of established SaaS companies and opening space for new challengers.',
  'https://img.youtube.com/vi/cxcb55zr2Q8/hqdefault.jpg',
  'Fireship',
  (SELECT id FROM "Domain" WHERE slug='b2b-saas'),
  '{"domainContext":"The SaaS era was built on proprietary data moats, high switching costs, and UI complexity as a feature. AI is collapsing all three simultaneously — making it possible to build SaaS replacements in weeks and migrate data programmatically. The businesses that survive will be those with genuine workflow lock-in.","problems":[{"title":"SaaS switching costs are collapsing as AI can migrate data automatically","description":"Data lock-in was the primary retention mechanism for most SaaS products. AI agents can now extract, transform, and migrate data between systems automatically. Products that relied purely on data lock-in rather than workflow integration are vulnerable to fast-moving challengers."},{"title":"Vertical SaaS in unsexy industries is largely untouched","description":"Construction, agriculture, trucking, and manufacturing use decades-old software or spreadsheets because the TAM appeared too small for traditional SaaS. AI-assisted building makes these vertical niches economical to serve for the first time — and the incumbents are weak."}],"questions":["What SaaS product does your industry use that hasn''t changed meaningfully in 10 years?","If someone could build a direct competitor to your most-used software tool in 3 months, what moat does the current vendor actually have?","Which parts of your work involve the most switching between different software tabs or copy-pasting data between tools?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'aIKfA3gIXwo',
  'How AI Is Changing Enterprise',
  'Box CEO Aaron Levie in conversation with the YC Lightcone podcast on how Fortune 500 companies are actually adopting AI, where they''re getting stuck, and which startup categories will win.',
  'https://img.youtube.com/vi/aIKfA3gIXwo/hqdefault.jpg',
  'Y Combinator',
  (SELECT id FROM "Domain" WHERE slug='b2b-saas'),
  '{"domainContext":"Enterprise AI is not one market — it''s dozens of vertical-specific workflow problems that each require domain expertise, change management, and systems integration. The winners in enterprise AI won''t be the ones with the best model, but those who solve the messiest deployment problems in specific industries.","problems":[{"title":"AI ROI is hard to measure, so enterprise budgets stall","description":"IT buyers need to justify AI spending to CFOs, but the productivity gains from AI are diffuse and hard to attribute. Companies building ROI measurement tools that track pre/post AI productivity for specific workflows have a clear enterprise sale."},{"title":"Enterprise AI security reviews take 6–12 months and kill startup deals","description":"Security questionnaires, SOC 2 audits, and data residency requirements slow every enterprise AI deal. Startups that invest early in compliance infrastructure — or use shared compliance platforms — shorten sales cycles significantly."}],"questions":["Has your organization signed up for an AI tool that sits unused because it wasn''t properly integrated into existing workflows?","What would a CFO need to see to approve a $500K AI software budget? What data exists to make that case?","Which enterprise workflow in your experience is the most painful but least likely to be automated — and why?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  '0fKYVl12VTA',
  'Enterprise Sales | Startup School',
  'Pete Koomen from Y Combinator breaks down enterprise sales for founders — from landing the first pilot to closing multi-year contracts, navigating procurement, and managing champion relationships inside large organizations.',
  'https://img.youtube.com/vi/0fKYVl12VTA/hqdefault.jpg',
  'Y Combinator',
  (SELECT id FROM "Domain" WHERE slug='b2b-saas'),
  '{"domainContext":"Enterprise sales is a distinct skill set from consumer growth. Understanding procurement, legal review, champion dynamics, and the political reality inside large buyers is what separates startups that land enterprise accounts from those that get stuck in perpetual pilot purgatory.","problems":[{"title":"Startup pilots get stranded in procurement because there''s no internal champion","description":"Most enterprise pilots fail not because of product quality but because the internal champion who wanted the product lacks the political capital to push it through procurement. Products that help champions build internal business cases and navigate approval processes have a real value."},{"title":"Legal and security review processes are opaque and unpredictable for startup sellers","description":"Enterprise sales cycles blow out timelines because legal and security reviews surface requirements late that could have been addressed early. A playbook or software tool that pre-surfaces the top 20 enterprise security questions — and helps startups prepare answers — accelerates sales velocity."}],"questions":["Have you tried to sell software to a large company? What was the most unexpected step in the buying process?","If you were a product manager at a big company, what would make you trust a two-year-old startup enough to bet your career on their product?","What would it take to turn a 6-month enterprise sales cycle into a 6-week one?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- FUTURE-OF-WORK
INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'LCEmiRjPEtQ',
  'Software Is Changing (Again) — Andrej Karpathy',
  'Andrej Karpathy''s landmark AI Startup School talk on Software 3.0 — the shift from humans using software to AI agents as the primary software users — and what this means for every software product.',
  'https://img.youtube.com/vi/LCEmiRjPEtQ/hqdefault.jpg',
  'Y Combinator',
  (SELECT id FROM "Domain" WHERE slug='future-of-work'),
  '{"domainContext":"We are at the beginning of a fundamental shift in how software is built and used. AI agents will increasingly do the cognitive work that knowledge workers do today — not by automating specific tasks, but by acting as a new type of user with different needs, interfaces, and reliability requirements.","problems":[{"title":"Software UIs are designed for humans but agents need APIs","description":"AI agents can''t reliably use GUI-based software designed for human eyes and hands. Every software product will need an agent-accessible API layer. Startups that add structured, permissioned APIs to existing workflows — enabling agents to operate them — are building critical infrastructure."},{"title":"Knowledge workers don''t know which parts of their job can be delegated to AI","description":"Most professionals have no framework for identifying which parts of their work AI can reliably take over today versus in 12 months. Tools that help individuals and teams audit their workflows and systematically delegate to AI — with quality controls — are a category waiting to be built."},{"title":"Human oversight of AI agent output is unstructured and inconsistent","description":"When AI agents do work that humans review, the review process is usually ad hoc — people check randomly or not at all. Structured quality assurance systems for AI agent outputs — with sampling, escalation, and feedback loops — are missing from most AI deployments."},{"title":"Hiring processes don''t account for AI-augmented candidates","description":"Job descriptions and interview processes were calibrated for unassisted human performance. Now candidates using AI tools can perform at much higher levels — making traditional hiring signals noisy and unreliable. New evaluation methods that assess judgment and oversight ability rather than raw execution are emerging."}],"questions":["If an AI could do 80% of your current job, which 20% would you most want to keep? Why?","What task at work takes you the most time that you believe an AI could do reliably with the right inputs?","How would you know if an AI agent working on your behalf made a mistake? What would the consequences be?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'eBVi_sLaYsc',
  'Why Vertical LLM Agents Are The New $1 Billion SaaS Opportunities',
  'Y Combinator''s analysis of why narrow, domain-specific AI agents — trained on specific workflows, data, and buyer needs — will build larger and more defensible businesses than horizontal AI platforms.',
  'https://img.youtube.com/vi/eBVi_sLaYsc/hqdefault.jpg',
  'Y Combinator',
  (SELECT id FROM "Domain" WHERE slug='future-of-work'),
  '{"domainContext":"The next wave of AI companies won''t be built around foundation models — they''ll be built around specific workflows, industries, and buyer personas. A vertical AI agent that replaces 10 employees in a specific role at $50K/year per employee has clearer ROI and faster sales cycles than a horizontal platform.","problems":[{"title":"Services businesses can be replaced by AI agents at 10x cost efficiency","description":"Legal research, medical coding, insurance claims processing, accounting, and customer support are services businesses where AI agents can do the same work at 10–100x lower cost per unit. Every services business in a knowledge-work category is a potential AI acquisition target."},{"title":"Vertical AI companies lack the domain training data to be reliable","description":"General-purpose LLMs hallucinate in specialized domains because they lack domain-specific training data. Startups that solve the data flywheel problem — generating proprietary training data through early usage — build moats that are hard for incumbents to replicate."},{"title":"HR and talent workflows are still largely manual despite massive efficiency potential","description":"Recruiting, onboarding, performance reviews, and skills development still require disproportionate human time relative to the structured, evaluable nature of the work. AI-native HR tools that actually replace headcount — rather than adding an analytics layer — have a direct ROI story."}],"questions":["Is there a specific professional service your company buys that you believe could be largely automated in the next 3 years?","What industry do you know well enough that you could spot where AI agents would get the details wrong — and build the right training data to fix it?","Which job roles at mid-sized companies do you think will look completely different in 5 years because of AI agents?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- CONSUMER
INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  '_QQq9-qOuo8',
  'What''s Next in Consumer Startups?',
  'Andrew Chen from a16z analyzes the history of consumer technology adoption curves, why breakthrough consumer products tend to emerge every 5–7 years, and what the next platform shift will enable.',
  'https://img.youtube.com/vi/_QQq9-qOuo8/hqdefault.jpg',
  'a16z',
  (SELECT id FROM "Domain" WHERE slug='consumer'),
  '{"domainContext":"Consumer tech has historically been driven by new platform shifts — PC, internet, mobile, social. Each shift creates a 5-year window where incumbents are slow and startups can build category-defining products by designing natively for the new platform behavior.","problems":[{"title":"Social app discovery is broken — most users stick to a shrinking set of platforms","description":"Young users spend time on 3–4 apps and discover new apps through recommendations from creators rather than the App Store. The discovery and distribution layer for new consumer apps is broken, giving an outsized advantage to incumbents with existing audiences."},{"title":"Consumer subscriptions are fragmenting and fatigue is setting in","description":"The average US consumer now pays for 4–5 streaming and subscription services. Bundle fatigue is real, and the discovery of what to watch/read/listen to across fragmented catalogs is unsolved. Curation and recommendation as a standalone product is underbuilt."},{"title":"Identity and self-expression online is increasingly disconnected from values","description":"Social platforms optimize for engagement over authentic self-expression, leading to performative content rather than genuine connection. Products that enable expression tied to specific interests, communities, or values — rather than follower counts — serve an unmet need."},{"title":"Offline-to-online bridges for local experiences are immature","description":"Finding what''s happening in your city tonight, joining a local club, or discovering a pop-up store still relies on word of mouth and imperfect apps. The local discovery and coordination stack is 15 years old and due for a redesign."}],"questions":["What''s the last app you downloaded because a friend told you about it rather than an ad? How did you decide to keep using it?","Is there something you love doing offline that doesn''t have a good digital community or coordination tool?","What consumer behavior do you see in young people around you that existing apps don''t serve well?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'u36A-YTxiOw',
  'The Best Way To Launch Your Startup',
  'YC''s Kat Mañalac breaks down the anatomy of a successful launch — how to frame your product for the right audience, what channels actually work for early consumer products, and how to create launch momentum without a marketing budget.',
  'https://img.youtube.com/vi/u36A-YTxiOw/hqdefault.jpg',
  'Y Combinator',
  (SELECT id FROM "Domain" WHERE slug='consumer'),
  '{"domainContext":"Consumer product launches fail more often because of distribution and messaging failures than because of product quality. Understanding how to reach early adopters, create authentic word-of-mouth, and iterate launch strategy based on real signals is a learnable skill.","problems":[{"title":"Consumer apps have no sustainable discovery mechanism outside of paid ads","description":"App store optimization and paid user acquisition are the dominant consumer discovery channels, but both are expensive and favor incumbents. Consumer apps that find alternative distribution — through communities, creators, or embed in existing workflows — have fundamentally different economics."},{"title":"Consumer product-market fit is harder to measure than B2B","description":"Without a subscription revenue signal, consumer PMF is assessed through retention curves, NPS, and engagement depth — metrics that take months to stabilize. Founders often overinterpret early signals, scaling before they''ve found genuine retention."}],"questions":["What consumer product would you recommend to a friend without any prompting? What makes you want to share it?","Have you ever used an app intensely for a month and then stopped? What caused you to stop?","What community or group do you belong to that doesn''t have a great digital home yet?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- LOGISTICS
INSERT INTO "DomainVideo" (id,"youtubeId",title,description,"thumbnailUrl","channelTitle","domainId","extractedProblems","transcriptCachedAt","createdAt")
VALUES (
  gen_random_uuid()::text,
  'y9tyXL87l1A',
  'Logistics Management in 12 minutes',
  'A concise overview of logistics management fundamentals — the flow of goods, inventory management, last-mile delivery, and how technology is transforming supply chain visibility.',
  'https://img.youtube.com/vi/y9tyXL87l1A/hqdefault.jpg',
  'Leaders Talk - ThinkEduca',
  (SELECT id FROM "Domain" WHERE slug='logistics'),
  '{"domainContext":"Logistics is one of the largest industries in the world and also one of the least digitized. Most freight still moves via phone calls, PDFs, and manual data entry. The software transformation of logistics is still in early innings, with massive opportunities in visibility, coordination, and automation.","problems":[{"title":"Freight broker market still runs on phone and email with no real-time visibility","description":"Over $800 billion of freight moves in the US annually, largely coordinated via phone and email between shippers and brokers. Real-time load matching, price transparency, and carrier vetting software is being built but penetration is still low outside the top 20 brokers."},{"title":"Last-mile delivery costs account for 50% of total shipping cost but remain unoptimized","description":"The final mile from distribution center to door is the most expensive and inefficient part of the supply chain. Route optimization, dynamic batching, and alternative delivery models (lockers, crowd-sourced) have improved but the last-mile problem is far from solved."},{"title":"Cold chain logistics for pharmaceuticals and food lacks real-time monitoring","description":"Temperature-sensitive shipments are the highest-stakes and most under-monitored segment of logistics. IoT sensors and blockchain-based chain of custody are being deployed, but the software stack to alert, respond to, and document cold chain breaches is incomplete."},{"title":"Customs and cross-border compliance is a manual bottleneck that delays $2T of trade","description":"International trade is still largely paper-based and rule-bound, with customs clearance causing multi-day delays and unexpected costs. Trade compliance automation — tariff classification, document preparation, broker coordination — is a massive unsexy opportunity."}],"questions":["Have you ever ordered something online and been given a 5-hour delivery window with no real-time tracking? Why is that still acceptable?","Do you know how a package gets from a factory in China to your door? How many hands does it pass through?","What would it mean for a small e-commerce brand to have the same logistics capabilities as Amazon?"]}'::jsonb,
  NOW(), NOW()
) ON CONFLICT ("youtubeId") DO NOTHING;

-- EDTECH
-- SKIPPED duplicate youtubeId: LCEmiRjPEtQ

-- PROPTECH
-- SKIPPED duplicate youtubeId: nuC-UGxmAks

-- LEGALTECH
-- SKIPPED duplicate youtubeId: 0fKYVl12VTA
