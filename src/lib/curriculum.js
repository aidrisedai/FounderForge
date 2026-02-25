// ================================================================
// FOUNDERFORGE CURRICULUM — The structured learning document
// 6 Steps, 38 Tasks, each with goal/output/criteria/intro/eval
// ================================================================

export const CURRICULUM = [
  {
    id:1, title:"Discover", subtitle:"Problem Validation", icon:"🔍", color:"#E8553A",
    tagline:"Is this a burning hair problem?",
    overview:"Validate your problem is real, urgent, and worth solving. Listen before you build.",
    tasks:[
      { id:"1.1", title:"Problem Hypothesis", goal:"Articulate a specific, testable problem hypothesis.", output:"'[Audience] struggles with [problem] because [cause]. They currently [workaround], costing them [cost].'", criteria:"All 5 parts specific. Audience defined. Problem observable.", intro:"Let's start at the foundation. Every great startup begins with a problem so painful people already spend time, money, or sanity solving it badly.\n\nI need your problem hypothesis — fill in every blank with SPECIFICS:\n\n\"[Specific audience] struggles with [specific problem] because [root cause]. Currently they handle it by [current workaround], which costs them [time/money/pain].\"\n\n'People' is not an audience. 'It's hard' is not a problem. Give me your best shot.", eval:"Check ALL 5 components. REJECT if vague. Push for specificity on each weak part." },
      { id:"1.2", title:"Interview Targets", goal:"Identify 10+ people from your network connected to the problem.", output:"Numbered list of 10+ people: who, connection to problem, why their perspective matters.", criteria:"10+ people. Clear connections. Mixed perspectives.", intro:"Great hypothesis. Now you need to TALK to real people before building.\n\nList 10+ people you know who touch this problem space. For each:\n1. Who they are\n2. Connection to the problem\n3. Why their perspective matters\n\nFormer colleagues, classmates, community members — dig deep.", eval:"Count entries (10+). Each needs all 3 elements. Push if under 10." },
      { id:"1.3", title:"Discovery Message", goal:"Write a warm, non-salesy outreach message.", output:"Personalized message for one person: references relationship, names topic, 15-min limit, NOT selling.", criteria:"Personalized, warm, about THEIR experience, not pitching.", intro:"Craft the message that gets people to say yes. #1 mistake: sounding like a founder with an agenda.\n\nFramework: \"Hey [Name], I'm exploring [problem area] and since you [connection], I'd love 15 minutes to hear how you handle [task]. Not selling — just learning.\"\n\nPersonalize for ONE person. Show me the actual message.", eval:"Would you reply? Personalized? Specific? Not salesy? Complete when compelling." },
      { id:"1.4", title:"Mom Test Questions", goal:"Write 5 questions that extract honest data, not false validation.", output:"5 questions about past behavior/current reality. No hypotheticals, no leading, no yes/no.", criteria:"All 5 pass Mom Test. Zero 'would you' questions.", intro:"Most founder questions get LIES. Three rules (The Mom Test):\n1. Talk about THEIR life, not your idea\n2. Ask about the PAST, not hypothetical futures\n3. Talk less, listen more\n\nWrite 5 questions. I'll grade each pass/fail.", eval:"Grade each. FAIL: 'would you', yes/no, leading. PASS: past events, workflows, decisions." },
      { id:"1.5", title:"Interview Debriefs", goal:"Extract real insights from 3+ discovery conversations.", output:"3+ debriefs: who, biggest surprise, direct quote, confirmed/broken assumption.", criteria:"3+ done. Genuine surprises. At least one broken assumption.", intro:"Theory's over — talk to humans.\n\nConduct 3+ calls. After each, debrief:\n1. **Who** (role/context)\n2. **Surprise** (most unexpected thing)\n3. **Quote** (exact words that stuck)\n4. **Assumption** (one belief confirmed or broken)\n\nDon't sanitize. Raw insights — especially uncomfortable ones.", eval:"3+ interviews, all elements. Push back on generic surprises." },
      { id:"1.6", title:"Problem Stack", goal:"Synthesize interviews into ranked, validated problems.", output:"3-5 problems ranked: description, evidence, workaround, pain 1-10, burning hair or minor itch.", criteria:"Evidence-grounded. Calibrated scores. At least one burning hair.", intro:"Synthesize your data into a ranked Problem Stack.\n\nFor each (3-5, ranked):\n- **Problem:** One sentence\n- **Evidence:** From interviews\n- **Workaround:** How they deal with it\n- **Pain (1-10):** Be honest\n- **Class:** Burning hair or minor itch", eval:"3-5 present? All elements? Scores calibrated (not all 10s)?" },
      { id:"1.7", title:"Step 1 Deliverable", goal:"Commit to the #1 problem with evidence-backed conviction.", output:"(1) ONE problem, (2) strongest evidence, (3) confidence 1-10 + why, (4) path to confidence 10.", criteria:"All 4 present. Problem from stack. Confidence honest (5-7 normal).", intro:"Final checkpoint:\n\n1. **The ONE Problem** (one sentence)\n2. **Strongest Evidence** from interviews\n3. **Confidence (1-10)** — 6 is healthy, 10 means you're lying\n4. **Path to 10:** What would you need?\n\nThis is the foundation.", eval:"All 4 substantive. Complete when solid." },
    ],
  },
  {
    id:2, title:"Define", subtitle:"Solution Design", icon:"✏️", color:"#D97706",
    tagline:"Design what they'll pay for",
    overview:"Transform validated problems into a focused solution. No building yet.",
    tasks:[
      { id:"2.1", title:"Value Prop Canvas", goal:"Map customer jobs, pains, gains from interview data.", output:"3+ Jobs, 5+ Pains, 3+ Gains — all from interviews.", criteria:"Minimums met. Evidence-backed. Gains are outcomes not features.", intro:"Step 2 — designing the solution from real data.\n\n1. **Customer Jobs (3+):** What are they trying to do?\n2. **Pains (5+):** What frustrates them?\n3. **Gains (3+):** What would amazing look like?\n\nEvery item must trace to an interview.", eval:"Count, check evidence, reject generic." },
      { id:"2.2", title:"Competitor Teardown", goal:"Map competitive landscape with honest analysis.", output:"3-5 alternatives: what it does, strengths, failures, why users stay. Include 1+ manual workaround.", criteria:"Honest strengths. Specific failures. Manual option included.", intro:"Map the battlefield. 'No competitors' is never true.\n\n3-5 alternatives (including manual/DIY). For each:\n- What it does\n- What it does well (be honest)\n- Where it fails\n- Why users stick anyway", eval:"3-5 present? Nuanced? Manual included?" },
      { id:"2.3", title:"Unfair Advantage", goal:"Identify ONE capability making your solution uniquely effective.", output:"'My unfair advantage is [capability] → users can [outcome] → alternatives can't because [reason].'", criteria:"Specific. Solves #1 pain. Credible moat.", intro:"What's your ONE unfair advantage?\n\nFormat: \"My unfair advantage is [capability] → users can [outcome] → alternatives can't because [reason].\"\n\n'We use AI' is not an answer.", eval:"Reject generic. Must connect to #1 pain." },
      { id:"2.4", title:"Positioning Statement", goal:"One sentence a stranger gets in 10 seconds.", output:"'For [audience] who [problem], [Product] is the [category] that [benefit], unlike [alternative] which [limitation].'", criteria:"All blanks specific. Passes stranger test.", intro:"Compress everything into one sentence:\n\n\"For [audience] who [problem], [Product] is the [category] that [benefit], unlike [alternative] which [limitation].\"", eval:"Every blank specific. Complete when crisp." },
      { id:"2.5", title:"Solution Reactions", goal:"Test concept with real users, capture concerns.", output:"3 reactions: who, gut reaction, biggest concern, would try early version.", criteria:"3 real reactions. Specific concerns. Honest signals.", intro:"Describe your concept to 3 people:\n\n'Based on [their pain], I'm exploring [solution]. Gut reaction? What would make this useless?'\n\nFor each: who, reaction, concern, willingness to try.", eval:"3 people, all elements." },
      { id:"2.6", title:"Step 2 Deliverable", goal:"Commit to solution design with validated positioning.", output:"(1) Positioning, (2) unfair advantage, (3) top concern, (4) plan to address, (5) readiness 1-10.", criteria:"All 5 present and polished.", intro:"Step 2 deliverable:\n\n1. **Positioning** (final)\n2. **Unfair Advantage**\n3. **Top Concern**\n4. **Plan** to address it\n5. **Readiness (1-10)**", eval:"All 5 substantive." },
    ],
  },
  {
    id:3, title:"Develop", subtitle:"MVP Build", icon:"🛠️", color:"#059669",
    tagline:"Build the ugliest thing that works",
    overview:"Build the smallest functional thing that delivers real value.",
    tasks:[
      { id:"3.1", title:"Feature Scoping", goal:"Cut to absolute minimum.", output:"IN (2-3 + why) and OUT (everything else + why waits).", criteria:"IN ≤3, each essential.", intro:"List every feature, then split:\n- **IN (2-3 max):** Must exist + why\n- **OUT:** Everything else + why it waits\n\nBe ruthless.", eval:"IN ≤3. Challenge each." },
      { id:"3.2", title:"Critical Path", goal:"Shortest path from first touch to aha moment.", output:"≤5 steps: user action + experience each. Aha moment labeled.", criteria:"≤5 steps. Aha early.", intro:"SHORTEST path from arrival to aha moment. 5 steps MAX.", eval:"≤5, concrete, aha identified." },
      { id:"3.3", title:"Build Approach", goal:"Fastest path to working product.", output:"Approach, tools, timeline ≤7 days, speed justification.", criteria:"Speed-optimized. ≤7 days.", intro:"FASTEST path. Not elegant, not scalable. Fastest.\n\n1. Approach\n2. Tools\n3. Days (≤7)\n4. Why fastest", eval:"≤7 days. Speed justified." },
      { id:"3.4", title:"Ship It", goal:"Build something a real person can use.", output:"What built, access, what works, what's rough, proof someone can use it.", criteria:"Real thing exists. Delivers core value.", intro:"Go build. Come back with:\n1. What you built\n2. How to see it\n3. What works\n4. What's rough\n5. Proof someone can use it\n\nGO.", eval:"Something real. Complete when functional." },
      { id:"3.5", title:"User Feedback", goal:"Observe real users, capture unfiltered reactions.", output:"3 users: who, behavior, where confused, core value reaction, feature request.", criteria:"3 users. Behavioral observations.", intro:"3 humans use it. For each: who, what they did, where stuck, reaction, one request.", eval:"3 users, behavioral focus." },
      { id:"3.6", title:"Step 3 Deliverable", goal:"Synthesize build learnings.", output:"Built + access, user quote, build-only learning, one change, ready to charge.", criteria:"All 5. Genuine learning.", intro:"Step 3 deliverable:\n1. Built + access\n2. Best quote\n3. Build-only learning\n4. One change\n5. Ready to charge? yes/no + why", eval:"All 5 present." },
    ],
  },
  {
    id:4, title:"Deploy", subtitle:"First Revenue", icon:"🚀", color:"#7C3AED",
    tagline:"Get someone to pay you",
    overview:"Revenue is the ultimate validation.",
    tasks:[
      { id:"4.1", title:"Pricing", goal:"Set value-based pricing.", output:"Price + model, problem cost math, value ratio, why might be too LOW.", criteria:"Value-based with math.", intro:"Price based on what the problem COSTS.\n\n1. Price + model\n2. Problem cost math\n3. Value ratio\n4. Why might be too low?", eval:"Math present." },
      { id:"4.2", title:"Sales Page", goal:"Clear, converting landing page.", output:"Headline, social proof, 3 benefits, CTA, URL.", criteria:"Stranger gets it in 10 sec.", intro:"ONE page. Five elements:\n1. Headline\n2. Social proof\n3. 3 benefits (outcomes)\n4. CTA\n5. URL", eval:"All 5. Clear." },
      { id:"4.3", title:"10 Direct Asks", goal:"Personally ask 10 people to buy.", output:"10 asks: who, response, reason. Totals.", criteria:"10 documented.", intro:"Ask 10 people to buy. Report: who, response, reason. Totals.", eval:"10 asks documented." },
      { id:"4.4", title:"First Sale", goal:"Convert interest into payment.", output:"Revenue yes/no, story or blocker, #1 objection, testimonial/plan.", criteria:"Honest accounting.", intro:"Did anyone pay?\n\n1. Revenue details or closest lead\n2. #1 objection\n3. Testimonial or plan", eval:"Honest. Documented." },
      { id:"4.5", title:"Step 4 Deliverable", goal:"Assess product-market fit.", output:"Revenue, conversion rate, why yes, top objection, PMF 1-10.", criteria:"All 5 honest.", intro:"Step 4 deliverable:\n1. Revenue\n2. Conversion rate\n3. Why bought\n4. Top objection + response\n5. PMF Signal 1-10", eval:"All 5 honest." },
    ],
  },
  {
    id:5, title:"Deepen", subtitle:"Retention", icon:"🔄", color:"#2563EB",
    tagline:"Make them come back",
    overview:"Why users stay, why they leave, what makes you sticky.",
    tasks:[
      { id:"5.1", title:"Retention Baseline", goal:"Establish honest retention metrics.", output:"Total users, active + definition, churned, why stayed, why left.", criteria:"Honest numbers.", intro:"Retention — the metric that matters.\n\n1. Total users\n2. Active + definition\n3. Churned\n4. Why stayed\n5. Why left", eval:"Honest baseline." },
      { id:"5.2", title:"Aha Moment", goal:"Action separating retained from churned.", output:"Hypothesis (specific action), evidence, time-to-aha.", criteria:"Specific action, evidence-based.", intro:"What's your aha moment?\n\n1. Specific measurable action\n2. Evidence\n3. Time-to-aha", eval:"Specific, testable." },
      { id:"5.3", title:"Churn Interviews", goal:"Learn why users leave.", output:"2-3 churned: who, trigger, moment stopped, what brings back, pattern.", criteria:"Uncomfortable truths. Pattern.", intro:"Talk to 2-3 who left. For each: who, trigger, moment, what brings back. Pattern.", eval:"2-3 real, raw." },
      { id:"5.4", title:"Retention Fix", goal:"Ship one data-driven improvement.", output:"What changed, insight, hypothesis, measurement, results.", criteria:"Shipped. Data-connected.", intro:"ONE data-driven change:\n1. What changed\n2. Which insight\n3. Hypothesis\n4. Measurement\n5. Results", eval:"Shipped, connected." },
      { id:"5.5", title:"Step 5 Deliverable", goal:"Retention system established.", output:"Rate, aha moment, churn reason, fix + results, ongoing system.", criteria:"All 5. System repeatable.", intro:"Step 5 deliverable:\n1. Rate + definition\n2. Aha moment\n3. Churn reason\n4. Fix + results\n5. Ongoing system", eval:"All 5. System." },
    ],
  },
  {
    id:6, title:"Dominate", subtitle:"Growth", icon:"📈", color:"#BE185D",
    tagline:"Build the engine",
    overview:"Repeatable growth engine. Prepare for scale.",
    tasks:[
      { id:"6.1", title:"Unit Economics", goal:"Per-customer financial engine.", output:"CAC math, LTV math, ratio, assessment, one lever.", criteria:"Math shown.", intro:"Show me the math:\n1. CAC\n2. LTV\n3. Ratio (3:1+)\n4. Healthy?\n5. One lever", eval:"Math present." },
      { id:"6.2", title:"Growth Channel", goal:"#1 channel from data.", output:"Customer → source, pattern, 10x plan, backup experiment.", criteria:"Customers traced. Data-driven.", intro:"Where did customers come from? List each + source. Pattern. 10x plan. Backup.", eval:"Data-driven." },
      { id:"6.3", title:"90-Day Plan", goal:"Focused operating plan.", output:"North Star, 3 monthly milestones, 3 weekly habits.", criteria:"North Star is leading indicator.", intro:"90-day system:\n1. North Star (predicts revenue)\n2. Month 1/2/3 milestones\n3. 3 weekly habits", eval:"Concrete, measurable." },
      { id:"6.4", title:"60-Second Story", goal:"Founder journey under 60 seconds.", output:"Problem, evidence, built, traction, retention, vision.", criteria:"All 6. Human. Real numbers.", intro:"60-second story: problem, evidence, built, traction, retention, vision.\n\nLike telling a friend.", eval:"All 6, concise." },
      { id:"6.5", title:"Final Deliverable", goal:"Complete founder snapshot.", output:"Unit economics, channel, 90-day plan, story, lesson, Monday action.", criteria:"All 6 reflect real work.", intro:"Graduation:\n1. Unit Economics\n2. #1 Channel + plan\n3. 90-Day Plan\n4. 60-Second Story\n5. Biggest Lesson\n6. Monday Morning Action", eval:"All 6. Celebrate." },
    ],
  },
];

export const TOTAL_TASKS = CURRICULUM.reduce((a, s) => a + s.tasks.length, 0);
