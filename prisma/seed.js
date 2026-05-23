/**
 * Seed script: populate FounderForge Discovery module with curated domain videos
 * and pre-extracted problem sets derived from the Worldie Systems Studio curriculum.
 *
 * Run: node prisma/seed.js
 * Requires: DATABASE_URL set in environment
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Curated video data mapped to FounderForge discovery domains.
// Each entry: { youtubeId, title, channelTitle, description, thumbnailUrl, extractedProblems }
// thumbnailUrl follows standard YouTube thumbnail pattern.

const CURATED_VIDEOS = {
  healthtech: [
    {
      youtubeId: "fzcUaxTmuV0",
      title: "Health Tech Founders: The Future of Care Is Personalized, Proactive—and AI-Powered",
      channelTitle: "a16z",
      description: "a16z Bio & Health partners discuss what happens when AI meets healthcare: personalization, proactive monitoring, and the startup opportunities inside clinical workflows.",
      extractedProblems: {
        domainContext: "Digital health is shifting from reactive treatment to proactive, AI-powered personalization. Data bottlenecks, clinician burnout, and fragmented EHR systems create massive startup opportunities for founders who can navigate healthcare's regulatory complexity.",
        problems: [
          {
            title: "Clinician burnout from documentation overload",
            description: "Physicians spend 2+ hours on administrative documentation for every hour of patient care, leading to burnout and reduced capacity. AI tools that automate EHR notes at the point of care are in high demand."
          },
          {
            title: "Care is reactive, not preventive",
            description: "Most healthcare systems only engage patients when they're already sick. Founders who can build continuous monitoring tools that flag risk before a crisis occurs address a core structural gap."
          },
          {
            title: "Health data is siloed and non-interoperable",
            description: "Patient records, lab results, imaging, and wearable data live in disconnected systems. Startups that unify this data — while maintaining HIPAA compliance — unlock personalized care paths that don't exist today."
          },
          {
            title: "Mental health access has a supply-demand mismatch",
            description: "There are not enough licensed therapists to meet demand, especially in rural areas and underserved communities. Scalable digital mental health tools that complement (rather than replace) clinical care have a large addressable market."
          }
        ],
        questions: [
          "Have you ever struggled to navigate a healthcare system — scheduling, records, referrals — and wondered why it felt so broken?",
          "Do you know clinicians who spend more time on paperwork than with patients? What would they pay to fix that?",
          "What would change if a patient's full health picture was available in real time to every provider they interact with?"
        ]
      }
    },
    {
      youtubeId: "pfbiHmRPmV8",
      title: "The Future of Personalized Healthcare Technology",
      channelTitle: "Stanford Online",
      description: "Dr. Jessica Mega from Stanford walks through the convergence of genomics, wearables, and AI models to deliver n-of-1 medical treatments tailored to individual biology.",
      extractedProblems: {
        domainContext: "Precision medicine is moving from population-level treatment protocols to individualized therapies based on a patient's genome, microbiome, and real-time biomarkers. The infrastructure to collect, analyze, and act on this data is still being built.",
        problems: [
          {
            title: "Genomic data collection lacks patient incentives",
            description: "Most people have never had their genome sequenced despite costs dropping below $200. There's a business model gap between collecting genomic data at scale and translating it into actionable health guidance patients will pay for."
          },
          {
            title: "Clinical trial recruitment is slow and unrepresentative",
            description: "Drug trials take years partly because finding qualified, diverse participants is expensive and manual. AI-matched patient registries that connect trials to eligible participants faster could cut years off drug development timelines."
          },
          {
            title: "Wearable health data is not integrated into clinical decisions",
            description: "Millions of people generate continuous health signals from smartwatches and CGMs, but physicians have no practical way to incorporate this data into treatment decisions. The middleware layer between consumer devices and clinical care is mostly unbuilt."
          }
        ],
        questions: [
          "If your doctor could see your health data from the past year — sleep, activity, heart rate, glucose — would your care be better? What would you pay for that?",
          "Why do you think your genome isn't already part of your standard medical record?",
          "Have you or someone you know participated in a clinical trial? What made it hard to find or join?"
        ]
      }
    },
    {
      youtubeId: "x0yt31WSGIs",
      title: "AI: The Ultimate Healthcare Hire",
      channelTitle: "a16z Bio & Health",
      description: "The healthcare system faces a structural shortage of clinicians. This a16z discussion explores how AI can fill roles that would otherwise require expensive human specialists.",
      extractedProblems: {
        domainContext: "A growing shortage of nurses, physicians, and specialists — combined with an aging global population — creates a capacity crisis in healthcare that cannot be solved by training more humans alone. AI-native clinical tools are moving from experimental to essential.",
        problems: [
          {
            title: "Nursing shortage is structural, not cyclical",
            description: "The US is projected to be short 450,000 nurses by 2025. AI tools that handle intake, triage, and follow-up — reducing the cognitive load on existing nursing staff — address a problem that will only get worse."
          },
          {
            title: "Specialist access outside major cities is nearly nonexistent",
            description: "Most Americans live more than an hour from a specialist, leading to delayed diagnoses and worse outcomes for treatable conditions. Telehealth with AI-assisted triage can extend specialist reach but the UX and workflow integration remain unsolved."
          },
          {
            title: "Prior authorization creates dangerous care delays",
            description: "Insurance prior authorization for procedures and medications delays care by days or weeks and consumes enormous clinician time. Startups automating this process have clear ROI and a frustrated buyer in every hospital system."
          }
        ],
        questions: [
          "When was the last time you (or someone you know) had to wait weeks for a specialist appointment? What were the consequences of that delay?",
          "If an AI could give you a preliminary diagnosis and triage recommendation at 2am, would you trust it? What would it take?",
          "What part of the healthcare experience feels most like it should have been automated 10 years ago?"
        ]
      }
    }
  ],

  fintech: [
    {
      youtubeId: "nuC-UGxmAks",
      title: "The Future of Money: Banking on Fintech",
      channelTitle: "a16z",
      description: "An in-depth a16z discussion on how fintech startups are rebuilding financial infrastructure across payments, lending, insurance, and banking — and where the next wave of opportunity lies.",
      extractedProblems: {
        domainContext: "Legacy financial infrastructure — built on batch processing, physical branches, and risk-averse compliance culture — is being dismantled layer by layer by software-native companies. The opportunity in fintech is not just making existing services cheaper, but enabling entirely new financial behaviors.",
        problems: [
          {
            title: "Cross-border payments are slow, expensive, and opaque",
            description: "Sending money internationally still takes days and costs 5–10% in fees. Migrant workers sending remittances home are the hardest hit. Startups building on faster rails — SEPA, PIX, UPI — are winning this market region by region."
          },
          {
            title: "Underwriting still relies on FICO scores that exclude billions",
            description: "Traditional credit scoring ignores rent payments, utility history, cash flow patterns, and employment stability — leaving 1.4 billion people globally without access to credit. Alternative data underwriting models are underbuilt."
          },
          {
            title: "SMB back-office finance is a fragmented, manual nightmare",
            description: "Small businesses stitch together payroll, invoicing, accounting, tax, and banking across 4–6 disconnected tools. An integrated financial OS for small businesses has a massive addressable market and low customer acquisition cost through direct distribution."
          },
          {
            title: "Real-time fraud detection lags behind real-time payments",
            description: "As payment rails go real-time, chargebacks and fraud recovery become harder. The fraud detection toolchain needs to move from batch analysis to millisecond inference — an open problem for most banks and payment processors."
          }
        ],
        questions: [
          "Have you ever tried to send money internationally and been frustrated by the fees or delays? Who do you think captures that money?",
          "If you were starting a business today, how would you handle payments, payroll, and accounting? How many tools would you need?",
          "Who in your network has been denied a loan or credit card despite being financially responsible? Why did that happen?"
        ]
      }
    },
    {
      youtubeId: "4j5vN0gCX90",
      title: "How AI is Powering Payments, with Greg Ulrich of Mastercard",
      channelTitle: "a16z",
      description: "Mastercard's AI lead joins a16z to discuss how a global payments network deploys machine learning for fraud detection, transaction routing, and financial inclusion.",
      extractedProblems: {
        domainContext: "Payments infrastructure is becoming the substrate on which new financial products are built. AI is not just improving fraud detection — it's enabling real-time decisioning, dynamic routing, and embedded financial services at the point of transaction.",
        problems: [
          {
            title: "Merchant chargeback dispute resolution is manual and slow",
            description: "Merchants lose an estimated $20 billion annually to chargeback fraud, and dispute resolution often takes 60–90 days. An AI-assisted evidence-gathering and dispute management product has a clear B2B buyer in every e-commerce merchant."
          },
          {
            title: "Card-not-present fraud is rising with e-commerce growth",
            description: "As physical card usage declines, card-not-present fraud is now the primary fraud vector. Real-time behavioral biometrics and device fingerprinting that detect fraud before authorization — not after — are the next frontier."
          },
          {
            title: "Embedded finance implementation is complex for non-financial companies",
            description: "Every company wants to embed financial products (BNPL, rewards, insurance) into their customer experience, but the compliance, banking partner, and technical integration work is prohibitive for most product teams. The middleware stack is still being built."
          }
        ],
        questions: [
          "Have you ever had a legitimate transaction declined by fraud detection? How did that feel as a customer?",
          "What would it mean for a retailer to offer instant financing at the point of sale without sending the customer to a separate app?",
          "How many places in your daily life touch a payment rail without you realizing it?"
        ]
      }
    },
    {
      youtubeId: "Z8JFCJP70rg",
      title: "The Open Source Movement in Fintech",
      channelTitle: "a16z",
      description: "How open banking standards, shared APIs, and developer-first infrastructure are lowering barriers to fintech innovation and enabling new classes of financial products.",
      extractedProblems: {
        domainContext: "Open banking mandates in the UK, EU, and Brazil — combined with the rise of API-first financial infrastructure providers — are making it possible to build a full-featured bank in months rather than years. The question now is which new financial behaviors this unlocks.",
        problems: [
          {
            title: "Account aggregation APIs are unreliable and consent-heavy",
            description: "Open banking promises users a unified view of their finances, but screen-scraping failures and consent friction make aggregation products fragile. Standardized, permissioned data APIs with high uptime remain a gap in most markets."
          },
          {
            title: "Fintech compliance costs are regressive — crushing small players",
            description: "KYC, AML, and BSA compliance infrastructure costs $500K–$2M to build initially, which advantages large incumbents and crushes early-stage fintech. Compliance-as-a-service platforms that let startups rent this infrastructure could 10x the number of fintech companies that get built."
          }
        ],
        questions: [
          "If your bank could see all your other financial accounts (with permission), what better products could they offer you?",
          "What financial product would you love to exist but doesn't seem to be built anywhere?",
          "Why do you think financial compliance is still largely a manual, human-intensive process?"
        ]
      }
    }
  ],

  cleantech: [
    {
      youtubeId: "IQF5mWuBd-o",
      title: "We don't need to expand the grid – we just need to make it smarter",
      channelTitle: "Abundance Institute",
      description: "Instead of building more physical grid infrastructure, software-defined demand response, grid edge intelligence, and distributed energy resources can dramatically increase grid capacity.",
      extractedProblems: {
        domainContext: "The energy transition is fundamentally a software problem. The physical infrastructure for renewable generation exists or is being built — the gap is in grid intelligence, demand flexibility, and the software layer that coordinates millions of distributed energy assets.",
        problems: [
          {
            title: "Grid operators can't see or control distributed energy resources",
            description: "Millions of rooftop solar panels, EV chargers, and home batteries are connected to the grid but invisible to grid operators. Software that aggregates and controls these assets as a virtual power plant has enormous value but requires complex coordination across many hardware platforms."
          },
          {
            title: "Energy consumption is price-insensitive because pricing signals don't reach end users",
            description: "Time-of-use pricing exists but most consumers don't respond to it because devices lack intelligence and utilities lack the customer UX to make it salient. Smart home energy management that automatically shifts load to cheap periods has a clear consumer value proposition."
          },
          {
            title: "Long-duration storage is still economically unproven at scale",
            description: "Lithium batteries work for 4-hour storage but grid-scale renewable intermittency requires 12–100 hour storage. Iron-air batteries, gravity storage, and green hydrogen are all in early deployment — the business models and offtake markets are still being defined."
          },
          {
            title: "Commercial building energy management is low-tech despite massive opportunity",
            description: "Commercial buildings account for 40% of US energy use. Most building management systems are 20-year-old HVAC controllers with no machine learning. AI-native energy management systems that reduce commercial energy bills 20–30% have a straightforward B2B sell."
          }
        ],
        questions: [
          "Do you know how much energy your home or office uses during peak demand hours? Would knowing change your behavior?",
          "What would it take for you to let a software system automatically shift your energy usage to save money?",
          "Have you seen the massive transmission lines in your region and wondered who decides where they go and who pays for them?"
        ]
      }
    },
    {
      youtubeId: "Z8JFCJP70rg",
      title: "How cheap renewable energy is finally flattening emissions",
      channelTitle: "Science Magazine",
      description: "After decades of slow progress, cost curves for solar and wind have crossed the threshold where renewables are the cheapest new electricity source in most of the world — with measurable emissions impact.",
      extractedProblems: {
        domainContext: "Solar and wind have won the generation cost war, but the harder problems of storage, grid integration, and industrial decarbonization remain. The startup opportunity has shifted from generation hardware to the software and services layer that makes intermittent renewables reliable.",
        problems: [
          {
            title: "Renewable energy curtailment wastes billions in already-built capacity",
            description: "When the grid can't absorb all the renewable energy generated, solar and wind farms are curtailed — turned off — despite having zero marginal cost. Grid-aware demand shifting and storage siting software that reduces curtailment has direct monetary value for generators."
          },
          {
            title: "Industrial heat decarbonization has no cost-effective solution yet",
            description: "Steel, cement, and chemicals require high-temperature heat that batteries and heat pumps can't provide cheaply at scale. Green hydrogen and electric arc alternatives are early-stage — the engineering and project finance stack is still being built."
          },
          {
            title: "Carbon accounting for supply chains is manual and unverified",
            description: "Corporations must report Scope 3 emissions — emissions in their supply chain — but most have no reliable way to measure them. Software that tracks embodied carbon through supply chains is a compliance product with mandatory demand as regulations tighten."
          }
        ],
        questions: [
          "If you could see the carbon footprint of every product you buy, would it change your purchasing behavior?",
          "What would it take for your employer to commit to being carbon neutral, and what's actually stopping them?",
          "Do you think energy companies have a financial incentive to accelerate or slow the transition to renewables?"
        ]
      }
    },
    {
      youtubeId: "Sq-y-wiZduE",
      title: "How to Fix Renewable Energy's Hidden Infrastructure Problem",
      channelTitle: "The Wall Street Journal",
      description: "The US has ambitious renewable energy goals but the transmission grid is a 50-year-old bottleneck. New projects wait 5+ years in interconnection queues, strangling the clean energy transition.",
      extractedProblems: {
        domainContext: "The US electricity grid was designed for centralized fossil fuel plants. Renewable energy is distributed and geographically variable — the grid architecture, permitting processes, and market rules were not designed for it. The transmission buildout needed is the largest infrastructure project in US history.",
        problems: [
          {
            title: "Grid interconnection queues take 5+ years and kill clean energy projects",
            description: "Renewable energy developers wait years for utility approval to connect to the grid, with most projects dropping out. Software that models interconnection feasibility, estimates wait times, and optimizes queue strategy could save developers millions in sunk project costs."
          },
          {
            title: "Transmission permitting crosses dozens of jurisdictions",
            description: "A single transmission line may cross federal land, state jurisdictions, and private parcels — each with separate approval processes. Project management and permitting software specifically built for transmission development is a specialized gap with large customers."
          },
          {
            title: "Energy storage siting is largely guesswork without real-time grid data",
            description: "Deciding where to site a battery storage project requires knowing where grid congestion is worst, where renewable curtailment is highest, and where capacity payments are available. A data platform that answers these questions for project developers is missing."
          }
        ],
        questions: [
          "Have you heard of a renewable energy project in your region that was delayed or cancelled? What was the reason?",
          "Why do you think building new power lines is harder in the US than in Europe?",
          "If you were developing a solar farm, what information would you need to decide where to build and how to connect to the grid?"
        ]
      }
    },
    {
      youtubeId: "v1BMWczn7JM",
      title: "How Does the Power Grid Work?",
      channelTitle: "Practical Engineering",
      description: "A clear, visual explanation of how the electrical grid transmits power from generators to homes and businesses — covering transmission, distribution, frequency control, and grid balancing.",
      extractedProblems: {
        domainContext: "The electricity grid is one of the most complex engineered systems ever built, operating in real time with zero tolerance for imbalance. Understanding how it actually works reveals why integrating variable renewables is technically challenging and where software can help.",
        problems: [
          {
            title: "Grid frequency stability is increasingly difficult with renewable-heavy systems",
            description: "Traditional generators provide inertia that stabilizes grid frequency. As they're replaced with solar and wind, the grid becomes more volatile. Grid-forming inverters and synthetic inertia services are early-stage markets with regulatory mandates emerging."
          },
          {
            title: "Distribution utilities have no real-time visibility into their own network",
            description: "Most local electric utilities don't have smart meters or sensors across their distribution network — meaning they learn about outages from customer calls, not sensors. Distribution automation and SCADA modernization is a multi-billion dollar spending category with no dominant software vendor."
          }
        ],
        questions: [
          "Have you ever wondered what happens in the milliseconds between when you flip a switch and the light turns on?",
          "Why does it seem like power outages always happen during the hottest or coldest days? What does that tell you about grid design?",
          "If utilities knew where outages were going to happen before they did, how much would that be worth?"
        ]
      }
    }
  ],

  "b2b-saas": [
    {
      youtubeId: "dvVbA9OcBqs",
      title: "Box CEO on AI Agents & Why Enterprise Can't Keep Up",
      channelTitle: "a16z",
      description: "Aaron Levie, CEO of Box, joins a16z to discuss the gap between AI's capabilities and enterprise's ability to deploy it — and what it means for incumbents and challengers.",
      extractedProblems: {
        domainContext: "Enterprise AI adoption is lagging behind the hype because of data governance, change management, and integration challenges rather than a shortage of AI tools. Startups that solve these deployment barriers — not just build AI features — have a clear enterprise wedge.",
        problems: [
          {
            title: "Enterprise AI pilots fail to reach production due to data governance gaps",
            description: "Most large companies run AI pilots successfully but can't bring them to production because they lack proper data cataloging, access controls, and lineage tracking. A data governance layer purpose-built for AI deployment is in high demand from enterprise IT teams."
          },
          {
            title: "AI agents can't take action in enterprise software without risky broad permissions",
            description: "Deploying AI agents that interact with ERP, CRM, and HR systems requires giving them access permissions that are too broad for security teams to approve. Fine-grained, audit-logged agent permissioning systems are an unsolved problem blocking enterprise AI deployment."
          },
          {
            title: "Enterprise change management for AI tooling is a bottleneck no software solves",
            description: "The people problem of AI adoption — training employees, changing workflows, measuring productivity impact — is larger than the technical problem. Software-assisted change management products that track adoption, identify resistors, and measure ROI are an emerging category."
          },
          {
            title: "Unstructured data in enterprises is untapped and largely invisible",
            description: "90% of enterprise data lives in documents, emails, contracts, and call recordings — unindexed and unsearchable. AI that can reliably extract structured insights from unstructured enterprise data is the unlock for dozens of downstream AI applications."
          }
        ],
        questions: [
          "Has your company tried to deploy an AI tool and hit unexpected obstacles? What stopped you from getting it to full production?",
          "Who in your organization would have to approve giving an AI agent access to your CRM data? How long would that take?",
          "What task at work do you do that feels like it should be automated but isn't? What would it take to automate it?"
        ]
      }
    },
    {
      youtubeId: "0lzo2tFBFy8",
      title: "Atlassian CEO on the SaaS Apocalypse, AI Agents & What Comes Next",
      channelTitle: "a16z",
      description: "Mike Cannon-Brookes discusses how AI is restructuring the economics of enterprise software — from per-seat licensing to outcome-based pricing — and what it means for the next generation of B2B companies.",
      extractedProblems: {
        domainContext: "Per-seat SaaS pricing is breaking down as AI agents do work that previously required human seats. The business model shift from software-as-a-service to software-as-an-agent creates massive disruption for incumbents and a clear opening for startups to build outcome-priced alternatives.",
        problems: [
          {
            title: "Per-seat SaaS pricing becomes absurd when AI can hold a seat",
            description: "If an AI agent can perform the same tasks as a licensed user, per-seat pricing becomes economically incoherent. Enterprise buyers are already pushing back on seat costs for tools where AI augments or replaces the human. New pricing models tied to outcomes or compute are being invented now."
          },
          {
            title: "Legacy SaaS products accumulate UI debt that blocks AI integration",
            description: "Incumbents built for human users — with complex GUIs, manual workflows, and opaque data models — struggle to add AI-native features without rebuilding core architecture. Startups who build AI-first from day one don't carry this technical debt."
          },
          {
            title: "Enterprise software procurement doesn't know how to evaluate AI products",
            description: "Procurement teams have mature frameworks for evaluating traditional software (security reviews, price benchmarking, reference checks) but no equivalent for AI products (hallucination rates, agent reliability, data privacy). This gap delays every enterprise AI sale."
          }
        ],
        questions: [
          "If an AI could do most of what your team uses your project management software for, should you pay the same price per seat?",
          "What B2B software product do you use that feels 10 years old despite recent AI feature additions?",
          "What would enterprise software look like if it were designed from scratch today with AI agents as primary users?"
        ]
      }
    },
    {
      youtubeId: "cxcb55zr2Q8",
      title: "How AI is breaking the SaaS business model",
      channelTitle: "Fireship",
      description: "A fast-paced technical breakdown of how AI coding, AI workflows, and agent-based automation are eroding the moats of established SaaS companies and opening space for new challengers.",
      extractedProblems: {
        domainContext: "The SaaS era was built on proprietary data moats, high switching costs, and UI complexity as a feature. AI is collapsing all three simultaneously — making it possible to build SaaS replacements in weeks and migrate data programmatically. The businesses that survive will be those with genuine workflow lock-in.",
        problems: [
          {
            title: "SaaS switching costs are collapsing as AI can migrate data automatically",
            description: "Data lock-in was the primary retention mechanism for most SaaS products. AI agents can now extract, transform, and migrate data between systems automatically. Products that relied purely on data lock-in rather than workflow integration are vulnerable to fast-moving challengers."
          },
          {
            title: "Vertical SaaS in unsexy industries is largely untouched",
            description: "Construction, agriculture, trucking, and manufacturing use decades-old software or spreadsheets because the TAM appeared too small for traditional SaaS. AI-assisted building makes these vertical niches economical to serve for the first time — and the incumbents are weak."
          }
        ],
        questions: [
          "What SaaS product does your industry use that hasn't changed meaningfully in 10 years?",
          "If someone could build a direct competitor to your most-used software tool in 3 months, what moat does the current vendor actually have?",
          "Which parts of your work involve the most switching between different software tabs or copy-pasting data between tools?"
        ]
      }
    },
    {
      youtubeId: "aIKfA3gIXwo",
      title: "How AI Is Changing Enterprise",
      channelTitle: "Y Combinator",
      description: "Box CEO Aaron Levie in conversation with the YC Lightcone podcast on how Fortune 500 companies are actually adopting AI, where they're getting stuck, and which startup categories will win.",
      extractedProblems: {
        domainContext: "Enterprise AI is not one market — it's dozens of vertical-specific workflow problems that each require domain expertise, change management, and systems integration. The winners in enterprise AI won't be the ones with the best model, but those who solve the messiest deployment problems in specific industries.",
        problems: [
          {
            title: "AI ROI is hard to measure, so enterprise budgets stall",
            description: "IT buyers need to justify AI spending to CFOs, but the productivity gains from AI are diffuse and hard to attribute. Companies building ROI measurement tools that track pre/post AI productivity for specific workflows have a clear enterprise sale."
          },
          {
            title: "Enterprise AI security reviews take 6–12 months and kill startup deals",
            description: "Security questionnaires, SOC 2 audits, and data residency requirements slow every enterprise AI deal. Startups that invest early in compliance infrastructure — or use shared compliance platforms — shorten sales cycles significantly."
          }
        ],
        questions: [
          "Has your organization signed up for an AI tool that sits unused because it wasn't properly integrated into existing workflows?",
          "What would a CFO need to see to approve a $500K AI software budget? What data exists to make that case?",
          "Which enterprise workflow in your experience is the most painful but least likely to be automated — and why?"
        ]
      }
    },
    {
      youtubeId: "0fKYVl12VTA",
      title: "Enterprise Sales | Startup School",
      channelTitle: "Y Combinator",
      description: "Pete Koomen from Y Combinator breaks down enterprise sales for founders — from landing the first pilot to closing multi-year contracts, navigating procurement, and managing champion relationships inside large organizations.",
      extractedProblems: {
        domainContext: "Enterprise sales is a distinct skill set from consumer growth. Understanding procurement, legal review, champion dynamics, and the political reality inside large buyers is what separates startups that land enterprise accounts from those that get stuck in perpetual pilot purgatory.",
        problems: [
          {
            title: "Startup pilots get stranded in procurement because there's no internal champion",
            description: "Most enterprise pilots fail not because of product quality but because the internal champion who wanted the product lacks the political capital to push it through procurement. Products that help champions build internal business cases and navigate approval processes have a real value."
          },
          {
            title: "Legal and security review processes are opaque and unpredictable for startup sellers",
            description: "Enterprise sales cycles blow out timelines because legal and security reviews surface requirements late that could have been addressed early. A playbook or software tool that pre-surfaces the top 20 enterprise security questions — and helps startups prepare answers — accelerates sales velocity."
          }
        ],
        questions: [
          "Have you tried to sell software to a large company? What was the most unexpected step in the buying process?",
          "If you were a product manager at a big company, what would make you trust a two-year-old startup enough to bet your career on their product?",
          "What would it take to turn a 6-month enterprise sales cycle into a 6-week one?"
        ]
      }
    }
  ],

  "future-of-work": [
    {
      youtubeId: "LCEmiRjPEtQ",
      title: "Software Is Changing (Again) — Andrej Karpathy",
      channelTitle: "Y Combinator",
      description: "Andrej Karpathy's landmark AI Startup School talk on Software 3.0 — the shift from humans using software to AI agents as the primary software users — and what this means for every software product.",
      extractedProblems: {
        domainContext: "We are at the beginning of a fundamental shift in how software is built and used. AI agents will increasingly do the cognitive work that knowledge workers do today — not by automating specific tasks, but by acting as a new type of user with different needs, interfaces, and reliability requirements.",
        problems: [
          {
            title: "Software UIs are designed for humans but agents need APIs",
            description: "AI agents can't reliably use GUI-based software designed for human eyes and hands. Every software product will need an agent-accessible API layer. Startups that add structured, permissioned APIs to existing workflows — enabling agents to operate them — are building critical infrastructure."
          },
          {
            title: "Knowledge workers don't know which parts of their job can be delegated to AI",
            description: "Most professionals have no framework for identifying which parts of their work AI can reliably take over today versus in 12 months. Tools that help individuals and teams audit their workflows and systematically delegate to AI — with quality controls — are a category waiting to be built."
          },
          {
            title: "Human oversight of AI agent output is unstructured and inconsistent",
            description: "When AI agents do work that humans review, the review process is usually ad hoc — people check randomly or not at all. Structured quality assurance systems for AI agent outputs — with sampling, escalation, and feedback loops — are missing from most AI deployments."
          },
          {
            title: "Hiring processes don't account for AI-augmented candidates",
            description: "Job descriptions and interview processes were calibrated for unassisted human performance. Now candidates using AI tools can perform at much higher levels — making traditional hiring signals noisy and unreliable. New evaluation methods that assess judgment and oversight ability rather than raw execution are emerging."
          }
        ],
        questions: [
          "If an AI could do 80% of your current job, which 20% would you most want to keep? Why?",
          "What task at work takes you the most time that you believe an AI could do reliably with the right inputs?",
          "How would you know if an AI agent working on your behalf made a mistake? What would the consequences be?"
        ]
      }
    },
    {
      youtubeId: "eBVi_sLaYsc",
      title: "Why Vertical LLM Agents Are The New $1 Billion SaaS Opportunities",
      channelTitle: "Y Combinator",
      description: "Y Combinator's analysis of why narrow, domain-specific AI agents — trained on specific workflows, data, and buyer needs — will build larger and more defensible businesses than horizontal AI platforms.",
      extractedProblems: {
        domainContext: "The next wave of AI companies won't be built around foundation models — they'll be built around specific workflows, industries, and buyer personas. A vertical AI agent that replaces 10 employees in a specific role at $50K/year per employee has clearer ROI and faster sales cycles than a horizontal platform.",
        problems: [
          {
            title: "Services businesses can be replaced by AI agents at 10x cost efficiency",
            description: "Legal research, medical coding, insurance claims processing, accounting, and customer support are services businesses where AI agents can do the same work at 10–100x lower cost per unit. Every services business in a knowledge-work category is a potential AI acquisition target."
          },
          {
            title: "Vertical AI companies lack the domain training data to be reliable",
            description: "General-purpose LLMs hallucinate in specialized domains because they lack domain-specific training data. Startups that solve the data flywheel problem — generating proprietary training data through early usage — build moats that are hard for incumbents to replicate."
          },
          {
            title: "HR and talent workflows are still largely manual despite massive efficiency potential",
            description: "Recruiting, onboarding, performance reviews, and skills development still require disproportionate human time relative to the structured, evaluable nature of the work. AI-native HR tools that actually replace headcount — rather than adding an analytics layer — have a direct ROI story."
          }
        ],
        questions: [
          "Is there a specific professional service your company buys that you believe could be largely automated in the next 3 years?",
          "What industry do you know well enough that you could spot where AI agents would get the details wrong — and build the right training data to fix it?",
          "Which job roles at mid-sized companies do you think will look completely different in 5 years because of AI agents?"
        ]
      }
    }
  ],

  consumer: [
    {
      youtubeId: "_QQq9-qOuo8",
      title: "What's Next in Consumer Startups?",
      channelTitle: "a16z",
      description: "Andrew Chen from a16z analyzes the history of consumer technology adoption curves, why breakthrough consumer products tend to emerge every 5–7 years, and what the next platform shift will enable.",
      extractedProblems: {
        domainContext: "Consumer tech has historically been driven by new platform shifts — PC, internet, mobile, social. Each shift creates a 5-year window where incumbents are slow and startups can build category-defining products by designing natively for the new platform behavior.",
        problems: [
          {
            title: "Social app discovery is broken — most users stick to a shrinking set of platforms",
            description: "Young users spend time on 3–4 apps and discover new apps through recommendations from creators rather than the App Store. The discovery and distribution layer for new consumer apps is broken, giving an outsized advantage to incumbents with existing audiences."
          },
          {
            title: "Consumer subscriptions are fragmenting and fatigue is setting in",
            description: "The average US consumer now pays for 4–5 streaming and subscription services. Bundle fatigue is real, and the discovery of what to watch/read/listen to across fragmented catalogs is unsolved. Curation and recommendation as a standalone product is underbuilt."
          },
          {
            title: "Identity and self-expression online is increasingly disconnected from values",
            description: "Social platforms optimize for engagement over authentic self-expression, leading to performative content rather than genuine connection. Products that enable expression tied to specific interests, communities, or values — rather than follower counts — serve an unmet need."
          },
          {
            title: "Offline-to-online bridges for local experiences are immature",
            description: "Finding what's happening in your city tonight, joining a local club, or discovering a pop-up store still relies on word of mouth and imperfect apps. The local discovery and coordination stack is 15 years old and due for a redesign."
          }
        ],
        questions: [
          "What's the last app you downloaded because a friend told you about it rather than an ad? How did you decide to keep using it?",
          "Is there something you love doing offline that doesn't have a good digital community or coordination tool?",
          "What consumer behavior do you see in young people around you that existing apps don't serve well?"
        ]
      }
    },
    {
      youtubeId: "u36A-YTxiOw",
      title: "The Best Way To Launch Your Startup",
      channelTitle: "Y Combinator",
      description: "YC's Kat Mañalac breaks down the anatomy of a successful launch — how to frame your product for the right audience, what channels actually work for early consumer products, and how to create launch momentum without a marketing budget.",
      extractedProblems: {
        domainContext: "Consumer product launches fail more often because of distribution and messaging failures than because of product quality. Understanding how to reach early adopters, create authentic word-of-mouth, and iterate launch strategy based on real signals is a learnable skill.",
        problems: [
          {
            title: "Consumer apps have no sustainable discovery mechanism outside of paid ads",
            description: "App store optimization and paid user acquisition are the dominant consumer discovery channels, but both are expensive and favor incumbents. Consumer apps that find alternative distribution — through communities, creators, or embed in existing workflows — have fundamentally different economics."
          },
          {
            title: "Consumer product-market fit is harder to measure than B2B",
            description: "Without a subscription revenue signal, consumer PMF is assessed through retention curves, NPS, and engagement depth — metrics that take months to stabilize. Founders often overinterpret early signals, scaling before they've found genuine retention."
          }
        ],
        questions: [
          "What consumer product would you recommend to a friend without any prompting? What makes you want to share it?",
          "Have you ever used an app intensely for a month and then stopped? What caused you to stop?",
          "What community or group do you belong to that doesn't have a great digital home yet?"
        ]
      }
    }
  ],

  logistics: [
    {
      youtubeId: "y9tyXL87l1A",
      title: "Logistics Management in 12 minutes",
      channelTitle: "Leaders Talk - ThinkEduca",
      description: "A concise overview of logistics management fundamentals — the flow of goods, inventory management, last-mile delivery, and how technology is transforming supply chain visibility.",
      extractedProblems: {
        domainContext: "Logistics is one of the largest industries in the world and also one of the least digitized. Most freight still moves via phone calls, PDFs, and manual data entry. The software transformation of logistics is still in early innings, with massive opportunities in visibility, coordination, and automation.",
        problems: [
          {
            title: "Freight broker market still runs on phone and email with no real-time visibility",
            description: "Over $800 billion of freight moves in the US annually, largely coordinated via phone and email between shippers and brokers. Real-time load matching, price transparency, and carrier vetting software is being built but penetration is still low outside the top 20 brokers."
          },
          {
            title: "Last-mile delivery costs account for 50% of total shipping cost but remain unoptimized",
            description: "The final mile from distribution center to door is the most expensive and inefficient part of the supply chain. Route optimization, dynamic batching, and alternative delivery models (lockers, crowd-sourced) have improved but the last-mile problem is far from solved."
          },
          {
            title: "Cold chain logistics for pharmaceuticals and food lacks real-time monitoring",
            description: "Temperature-sensitive shipments are the highest-stakes and most under-monitored segment of logistics. IoT sensors and blockchain-based chain of custody are being deployed, but the software stack to alert, respond to, and document cold chain breaches is incomplete."
          },
          {
            title: "Customs and cross-border compliance is a manual bottleneck that delays $2T of trade",
            description: "International trade is still largely paper-based and rule-bound, with customs clearance causing multi-day delays and unexpected costs. Trade compliance automation — tariff classification, document preparation, broker coordination — is a massive unsexy opportunity."
          }
        ],
        questions: [
          "Have you ever ordered something online and been given a 5-hour delivery window with no real-time tracking? Why is that still acceptable?",
          "Do you know how a package gets from a factory in China to your door? How many hands does it pass through?",
          "What would it mean for a small e-commerce brand to have the same logistics capabilities as Amazon?"
        ]
      }
    }
  ],

  edtech: [
    {
      youtubeId: "LCEmiRjPEtQ",
      title: "Software Is Changing (Again) — Andrej Karpathy at Y Combinator",
      channelTitle: "Y Combinator",
      description: "Karpathy's AI Startup School talk on how AI is restructuring the nature of knowledge work — with major implications for how skills are learned, credentialed, and valued in the labor market.",
      extractedProblems: {
        domainContext: "AI is redefining what skills are valuable and how fast skill obsolescence occurs. Education institutions designed for decadal curriculum cycles can't keep pace with AI-driven job market changes — creating massive demand for modular, on-demand, outcomes-linked learning.",
        problems: [
          {
            title: "Traditional degrees are slow and expensive but alternative credentials lack employer trust",
            description: "A 4-year degree costs $100K+ and teaches skills that may be obsolete by graduation. Bootcamps and online courses are cheaper and faster, but employers still default to degree signals for hiring. The credential verification and trust gap between traditional and alternative credentials is the key bottleneck."
          },
          {
            title: "Corporate training is a $340B market with terrible outcomes and no measurement",
            description: "Companies spend massively on employee training that demonstrably fails to change behavior or improve performance, because almost no corporate training is tied to measurable outcomes. An edtech product that sells skill development with performance guarantees has a differentiated B2B story."
          },
          {
            title: "Adult learners can't find high-quality learning time in fragmented schedules",
            description: "Working adults want to upskill but have 30-minute blocks, not 3-hour class sessions. Educational content designed for micro-learning, spaced repetition, and tight workflow integration performs dramatically better for adult learners than traditional course formats."
          }
        ],
        questions: [
          "What skill would you learn today if you could be taught it effectively in 30-minute sessions over 3 months?",
          "Has your employer paid for training that didn't change how you actually work? What made it fail?",
          "What's the fastest you've ever learned something new because the situation demanded it? What made that learning environment effective?"
        ]
      }
    }
  ],

  proptech: [
    {
      youtubeId: "nuC-UGxmAks",
      title: "The Future of Money: Banking on Fintech — Real Estate Finance",
      channelTitle: "a16z",
      description: "Real estate is the world's largest asset class and one of the last industries to be transformed by software — from mortgage origination to property management to title insurance.",
      extractedProblems: {
        domainContext: "Real estate transactions are still largely paper-based, locally intermediated, and opaque. The $3.8T US real estate market operates through processes that were designed before the internet. Every step — search, finance, transaction, management — is ripe for software disruption.",
        problems: [
          {
            title: "Mortgage origination is manual, slow, and full of unnecessary friction",
            description: "The average mortgage takes 49 days to close and involves dozens of manual document requests. Digital-first mortgage originators have reduced this to 15 days for simple cases, but complex cases and self-employed borrowers still face a broken experience."
          },
          {
            title: "Property management software is fragmented and landlord-centric",
            description: "Tenant experience software lags far behind consumer expectations. Maintenance requests, rent payments, lease renewals, and communication with property managers are all handled through different apps or phone calls. A unified tenant OS has a large user base and B2B monetization through property managers."
          },
          {
            title: "Commercial real estate lease management is a spreadsheet problem at scale",
            description: "Most commercial tenants manage complex lease portfolios in spreadsheets, missing rent escalation clauses, renewal options, and tenant improvement allowances worth millions. Lease management software with AI contract extraction has a clear CFO buyer and measurable ROI."
          }
        ],
        questions: [
          "Have you ever bought or rented a property? What part of the process felt most like it should have been automated by now?",
          "If you own or manage rental property, what task takes the most time and is most likely to cause tenant conflicts?",
          "Why do you think real estate — the world's largest asset class — still uses fax machines and wet signatures?"
        ]
      }
    }
  ],

  legaltech: [
    {
      youtubeId: "0fKYVl12VTA",
      title: "Enterprise Sales | Startup School — Legal Tech Buyers",
      channelTitle: "Y Combinator",
      description: "Understanding how to sell into legal departments and law firms — notoriously risk-averse buyers — using the enterprise sales fundamentals that Y Combinator teaches to B2B founders.",
      extractedProblems: {
        domainContext: "Legal services are among the last knowledge-work industries to be disrupted by software, protected by professional licensing, liability concerns, and client confidentiality requirements. AI is cracking open legal work — from contract review to discovery to legal research — with measurable time savings.",
        problems: [
          {
            title: "Contract review is the highest-volume, lowest-value legal task — and still done manually",
            description: "Junior associates at law firms and in-house counsel spend enormous time reviewing NDAs, vendor contracts, and employment agreements for standard risk clauses. AI contract review tools that flag non-standard terms and suggest redlines are in active procurement at large firms."
          },
          {
            title: "Legal research is expensive, slow, and inaccessible to anyone who can't afford a lawyer",
            description: "Most people facing legal questions can't afford to consult an attorney for research. AI legal research tools that provide reliable, cited answers for common legal questions — leases, employment law, small claims — address a massive unmet demand for legal access."
          },
          {
            title: "eDiscovery in litigation costs millions in attorney time on document review",
            description: "Litigation discovery requires reviewing millions of documents for relevance and privilege. AI-assisted document review has been adopted by large law firms but the tools are expensive and complex. A simpler, cheaper version for mid-market litigation would address a large market."
          },
          {
            title: "Small business legal needs are served by one-size-fits-all templates that don't fit",
            description: "Small businesses use generic contract templates for vendor agreements, employment contracts, and NDAs — then face disputes because the template didn't address their specific circumstances. AI-guided contract drafting that asks the right questions and outputs customized documents addresses a real need."
          }
        ],
        questions: [
          "Have you ever needed a lawyer but couldn't afford one? What happened as a result?",
          "If you run a small business, how do you handle contracts with vendors, employees, or customers? What's the highest-risk moment in that process?",
          "What would you need to trust an AI to help you with a legal question rather than paying for an attorney?"
        ]
      }
    }
  ]
};

async function main() {
  console.log("Seeding curated discovery videos...");

  const domains = await prisma.domain.findMany();
  const domainMap = Object.fromEntries(domains.map((d) => [d.slug, d.id]));

  if (domains.length === 0) {
    console.error("No domains found. Run the migration first: npx prisma migrate deploy");
    process.exit(1);
  }

  console.log(`Found ${domains.length} domains: ${domains.map((d) => d.slug).join(", ")}`);

  let created = 0;
  let skipped = 0;

  for (const [slug, videos] of Object.entries(CURATED_VIDEOS)) {
    const domainId = domainMap[slug];
    if (!domainId) {
      console.warn(`Domain not found for slug: ${slug}`);
      continue;
    }

    for (const video of videos) {
      const existing = await prisma.domainVideo.findUnique({
        where: { youtubeId: video.youtubeId },
      });

      if (existing) {
        // Update extractedProblems if not already set
        if (!existing.extractedProblems) {
          await prisma.domainVideo.update({
            where: { youtubeId: video.youtubeId },
            data: {
              extractedProblems: video.extractedProblems,
              transcriptCachedAt: new Date(),
              thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`,
            },
          });
          console.log(`Updated problems for: ${video.title.slice(0, 60)}`);
        } else {
          skipped++;
        }
        continue;
      }

      await prisma.domainVideo.create({
        data: {
          youtubeId: video.youtubeId,
          title: video.title,
          channelTitle: video.channelTitle,
          description: video.description,
          thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`,
          domainId,
          extractedProblems: video.extractedProblems,
          transcriptCachedAt: new Date(),
        },
      });

      console.log(`Created: [${slug}] ${video.title.slice(0, 60)}`);
      created++;
    }
  }

  console.log(`\nSeed complete: ${created} videos created, ${skipped} already up to date.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
