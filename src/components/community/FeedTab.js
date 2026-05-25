"use client";
import { useState, useEffect, useRef } from "react";

const accent = "var(--ff-accent)";
const dim = "rgba(255,255,255,.35)";
const dimmer = "rgba(255,255,255,.15)";
const card = "rgba(255,255,255,.03)";
const border = "rgba(255,255,255,.06)";

const STEP_COLORS = { 1:"var(--ff-accent)",2:"#F59E0B",3:"#10B981",4:"#3B82F6",5:"#8B5CF6",6:"#EC4899",7:"#06B6D4" };
const REACTIONS = [{ type:"like",emoji:"👍",label:"Like" },{ type:"celebrate",emoji:"🎉",label:"Celebrate" },{ type:"insightful",emoji:"💡",label:"Insightful" }];

function Avatar({ src, name, size=36 }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return src ? <img src={src} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}} />
    : <div style={{width:size,height:size,borderRadius:"50%",background:"var(--ff-accent-grad)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.35,fontWeight:700,color:"#fff",flexShrink:0}}>{initials}</div>;
}

function timeAgo(date) {
  const s = Math.floor((Date.now()-new Date(date))/1000);
  if (s<60) return "just now";
  if (s<3600) return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function FeedCard({ post, myId, onReact, onComment }) {
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [localComments, setLocalComments] = useState(post.comments || []);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);
  const [submitting, setSubmitting] = useState(false);

  const myReaction = localReactions.find(r=>r.userId===myId);
  const stepColor = STEP_COLORS[post.stepId] || accent;

  function countByType(type) { return localReactions.filter(r=>r.type===type).length; }

  async function handleReact(type) {
    const res = await fetch(`/api/community/feed/${post.id}/react`, {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({type}),
    });
    const data = await res.json();
    setLocalReactions(prev => {
      const without = prev.filter(r=>r.userId!==myId);
      if (data.removed) return without;
      return [...without, { userId:myId, type, id:data.reaction?.id||"tmp" }];
    });
  }

  async function submitComment() {
    if (!commentDraft.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/community/feed/${post.id}/comments`, {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({body:commentDraft}),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.comment) { setLocalComments(prev=>[...prev,data.comment]); setCommentDraft(""); }
  }

  return (
    <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:12}}>
      {/* Author row */}
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <Avatar src={post.author.image} name={post.author.name} size={38}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,fontFamily:"var(--ff-heading)",color:"rgba(255,255,255,.9)"}}>{post.author.name}</div>
          {post.author.founderProfile?.bio && <div style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.author.founderProfile.bio.slice(0,80)}</div>}
        </div>
        <span style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)",flexShrink:0}}>{timeAgo(post.createdAt)}</span>
      </div>

      {/* Milestone badge */}
      {post.milestone && (
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:`${stepColor}12`,border:`1px solid ${stepColor}25`,alignSelf:"flex-start"}}>
          <span style={{fontSize:10}}>🏆</span>
          <span style={{fontSize:10,fontWeight:700,color:stepColor,fontFamily:"var(--ff-body)",letterSpacing:".06em"}}>{post.milestone}</span>
        </div>
      )}

      {/* Body */}
      <div style={{fontSize:13,lineHeight:1.7,color:"rgba(255,255,255,.8)",fontFamily:"var(--ff-body)",whiteSpace:"pre-wrap"}}>{post.body}</div>

      {/* Reactions summary */}
      {localReactions.length > 0 && (
        <div style={{display:"flex",gap:8,paddingBottom:8,borderBottom:`1px solid ${border}`}}>
          {REACTIONS.filter(r=>countByType(r.type)>0).map(r=>(
            <span key={r.type} style={{fontSize:11,color:dim,fontFamily:"var(--ff-body)"}}>{r.emoji} {countByType(r.type)}</span>
          ))}
        </div>
      )}

      {/* Action bar */}
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        {REACTIONS.map(r=>(
          <button key={r.type} onClick={()=>handleReact(r.type)} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${myReaction?.type===r.type?accent:border}`,background:myReaction?.type===r.type?`${accent}12`:card,color:myReaction?.type===r.type?accent:dim,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            {r.emoji} {r.label}
          </button>
        ))}
        <button onClick={()=>setShowComments(c=>!c)} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${border}`,background:card,color:dim,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:"pointer",marginLeft:"auto"}}>
          💬 {localComments.length} Comment{localComments.length!==1?"s":""}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{display:"flex",flexDirection:"column",gap:8,paddingTop:4}}>
          {localComments.map(c=>(
            <div key={c.id} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
              <Avatar src={c.author.image} name={c.author.name} size={26}/>
              <div style={{flex:1,background:"rgba(255,255,255,.02)",border:`1px solid ${border}`,borderRadius:8,padding:"7px 10px"}}>
                <span style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,.7)",fontFamily:"var(--ff-heading)",marginRight:6}}>{c.author.name}</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,.6)",fontFamily:"var(--ff-body)",lineHeight:1.5}}>{c.body}</span>
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <textarea value={commentDraft} onChange={e=>setCommentDraft(e.target.value.slice(0,2000))} maxLength={2000} rows={1} placeholder="Add a comment…"
              style={{flex:1,padding:"7px 10px",borderRadius:8,border:`1px solid ${border}`,background:card,color:"rgba(255,255,255,.85)",fontSize:12,fontFamily:"var(--ff-body)",resize:"none",outline:"none"}}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitComment();}}}/>
            <button onClick={submitComment} disabled={!commentDraft.trim()||submitting}
              style={{padding:"7px 12px",borderRadius:8,border:"none",background:commentDraft.trim()&&!submitting?`linear-gradient(135deg,${accent},var(--ff-accent-2))`:"rgba(255,255,255,.04)",color:commentDraft.trim()&&!submitting?"#fff":dimmer,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:commentDraft.trim()&&!submitting?"pointer":"not-allowed"}}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedTab({ sharePrompt, onShareDone }) {
  const [posts, setPosts] = useState([]);
  const [myId, setMyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(!!sharePrompt);
  const [draft, setDraft] = useState(sharePrompt?.body || "");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch("/api/community/feed").then(r=>r.json()).then(d=>{ setPosts(d.posts||[]); setMyId(d.myId); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  // When a new share prompt arrives, open the composer pre-filled
  useEffect(() => {
    if (sharePrompt) { setComposerOpen(true); setDraft(sharePrompt.body || ""); }
  }, [sharePrompt]);

  async function submitPost() {
    if (!draft.trim()) return;
    setPosting(true);
    const res = await fetch("/api/community/feed", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ body:draft, milestone:sharePrompt?.milestone||null, taskId:sharePrompt?.taskId||null, stepId:sharePrompt?.stepId||null }),
    });
    const data = await res.json();
    setPosting(false);
    if (data.post) { setPosts(prev=>[data.post,...prev]); setDraft(""); setComposerOpen(false); onShareDone?.(); }
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {/* Composer */}
      <div style={{background:card,border:`1px solid ${composerOpen?accent+"40":border}`,borderRadius:12,padding:composerOpen?16:0,overflow:"hidden",transition:"all .2s"}}>
        {!composerOpen ? (
          <button onClick={()=>setComposerOpen(true)} style={{width:"100%",padding:"12px 16px",background:"transparent",border:"none",color:dim,fontSize:13,fontFamily:"var(--ff-body)",cursor:"pointer",textAlign:"left"}}>
            Share something with the community…
          </button>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {sharePrompt?.milestone && (
              <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:`${STEP_COLORS[sharePrompt.stepId]||accent}12`,border:`1px solid ${STEP_COLORS[sharePrompt.stepId]||accent}25`,alignSelf:"flex-start"}}>
                <span style={{fontSize:10}}>🏆</span>
                <span style={{fontSize:10,fontWeight:700,color:STEP_COLORS[sharePrompt.stepId]||accent,fontFamily:"var(--ff-body)"}}>{sharePrompt.milestone}</span>
              </div>
            )}
            <textarea value={draft} onChange={e=>setDraft(e.target.value.slice(0,3000))} maxLength={3000} rows={4} placeholder="What did you build, learn, or overcome?"
              style={{width:"100%",padding:"10px 12px",borderRadius:8,border:`1px solid ${border}`,background:"rgba(255,255,255,.02)",color:"rgba(255,255,255,.85)",fontSize:13,fontFamily:"var(--ff-body)",resize:"vertical",outline:"none"}} autoFocus/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <button onClick={()=>{setComposerOpen(false);setDraft("");onShareDone?.();}} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${border}`,background:card,color:dim,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:"pointer"}}>Cancel</button>
              <button onClick={submitPost} disabled={!draft.trim()||posting} style={{padding:"7px 14px",borderRadius:7,border:"none",background:draft.trim()&&!posting?`linear-gradient(135deg,${accent},var(--ff-accent-2))`:"rgba(255,255,255,.05)",color:draft.trim()&&!posting?"#fff":dimmer,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:draft.trim()&&!posting?"pointer":"not-allowed"}}>{posting?"Posting…":"Post"}</button>
            </div>
          </div>
        )}
      </div>

      {loading && <div style={{textAlign:"center",padding:40,color:dimmer,fontSize:12,fontFamily:"var(--ff-body)"}}>Loading feed…</div>}
      {!loading && posts.length===0 && <div style={{textAlign:"center",padding:48,color:dimmer,fontSize:13,fontFamily:"var(--ff-body)"}}>No posts yet. Connect with founders and share your first milestone!</div>}
      {posts.map(p=><FeedCard key={p.id} post={p} myId={myId}/>)}
    </div>
  );
}
