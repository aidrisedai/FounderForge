-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateTable: Forums
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "type" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Channel_slug_key" ON "Channel"("slug");

CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "voteScore" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Post_channelId_createdAt_idx" ON "Post"("channelId", "createdAt");
CREATE INDEX "Post_channelId_voteScore_idx" ON "Post"("channelId", "voteScore");
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

CREATE TABLE "PostVote" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    CONSTRAINT "PostVote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PostVote_postId_userId_key" ON "PostVote"("postId", "userId");
CREATE INDEX "PostVote_postId_idx" ON "PostVote"("postId");

CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateTable: Group Rooms
CREATE TABLE "GroupRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupRoom_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GroupRoom_isPublic_idx" ON "GroupRoom"("isPublic");
CREATE INDEX "GroupRoom_creatorId_idx" ON "GroupRoom"("creatorId");

CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GroupMembership_roomId_userId_key" ON "GroupMembership"("roomId", "userId");
CREATE INDEX "GroupMembership_userId_idx" ON "GroupMembership"("userId");

CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "GroupMessage_roomId_createdAt_idx" ON "GroupMessage"("roomId", "createdAt");

-- CreateTable: Feed
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "milestone" TEXT,
    "taskId" TEXT,
    "stepId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FeedPost_authorId_createdAt_idx" ON "FeedPost"("authorId", "createdAt");
CREATE INDEX "FeedPost_createdAt_idx" ON "FeedPost"("createdAt");

CREATE TABLE "FeedReaction" (
    "id" TEXT NOT NULL,
    "feedPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "FeedReaction_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeedReaction_feedPostId_userId_key" ON "FeedReaction"("feedPostId", "userId");
CREATE INDEX "FeedReaction_feedPostId_idx" ON "FeedReaction"("feedPostId");

CREATE TABLE "FeedComment" (
    "id" TEXT NOT NULL,
    "feedPostId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FeedComment_feedPostId_idx" ON "FeedComment"("feedPostId");

-- Foreign Keys: Forums
ALTER TABLE "Post" ADD CONSTRAINT "Post_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PostVote" ADD CONSTRAINT "PostVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: Group Rooms
ALTER TABLE "GroupRoom" ADD CONSTRAINT "GroupRoom_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GroupRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "GroupRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign Keys: Feed
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedReaction" ADD CONSTRAINT "FeedReaction_feedPostId_fkey" FOREIGN KEY ("feedPostId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedReaction" ADD CONSTRAINT "FeedReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_feedPostId_fkey" FOREIGN KEY ("feedPostId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default channels
INSERT INTO "Channel" ("id","slug","name","description","icon","type","order") VALUES
  ('ch_s1','step-1-discover','Step 1: Discover','Problem validation, customer discovery, hypothesis testing','🔍','curriculum',1),
  ('ch_s2','step-2-define','Step 2: Define','Solution design, positioning, target market','📐','curriculum',2),
  ('ch_s3','step-3-develop','Step 3: Develop','MVP build, prototyping, early testing','🛠️','curriculum',3),
  ('ch_s4','step-4-deploy','Step 4: Deploy','First revenue, pricing, early customers','🚀','curriculum',4),
  ('ch_s5','step-5-deepen','Step 5: Deepen','Retention, engagement, product-market fit','💎','curriculum',5),
  ('ch_s6','step-6-dominate','Step 6: Dominate','Growth, scaling, expansion','👑','curriculum',6),
  ('ch_s7','step-7-promote','Step 7: Promote','Marketing engine, content, brand','📣','curriculum',7),
  ('ch_t1','fundraising','Fundraising','Pitching, investors, grants, revenue models','💰','topic',10),
  ('ch_t2','product','Product','Features, UX, roadmap decisions','🧩','topic',11),
  ('ch_t3','marketing','Marketing','SEO, content, ads, distribution','📊','topic',12),
  ('ch_t4','growth','Growth','Metrics, experiments, scaling tactics','📈','topic',13),
  ('ch_t5','tech','Tech & Build','Stack choices, architecture, no-code tools','⚙️','topic',14),
  ('ch_t6','general','General','Everything else','💬','topic',15);
