"use client";
import { useState, useEffect } from "react";

const accent = "var(--ff-accent)";
const dim = "rgba(255,255,255,.35)";
const dimmer = "rgba(255,255,255,.15)";
const card = "rgba(255,255,255,.03)";
const border = "rgba(255,255,255,.06)";

function Avatar({ src, name, size=28 }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return src ? <img src={src} alt={name} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}} />
    : <div style={{width:size,height:size,borderRadius:"50%",background:"var(--ff-accent-grad)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.35,fontWeight:700,color:"#fff",flexShrink:0}}>{initials}</div>;
}

function timeAgo(date) {
  const s=Math.floor((Date.now()-new Date(date))/1000);
  if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m`;
  if(s<86400)return`${Math.floor(s/3600)}h`;return`${Math.floor(s/86400)}d`;
}

// ── Post Detail ────────────────────────────────────────────────────────────────
function PostDetail({ postId, myId, onBack }) {
  const [post, setPost] = useState(null);
  const [myVote, setMyVote] = useState(0);
  const [commentDraft, setCommentDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/community/posts/${postId}`)
      .then(r=>r.json())
      .then(d=>{ setPost(d.post); setMyVote(d.myVote||0); });
  }, [postId]);

  async function vote(val) {
    const res = await fetch(`/api/community/posts/${postId}/vote`, {
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({value:val}),
    });
    const d = await res.json();
    setMyVote(d.myVote);
    setPost(p=>({...p, voteScore:d.voteScore}));
  }

  async function submitComment() {
    if (!commentDraft.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/community/posts/${postId}/comments`, {
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body:commentDraft}),
    });
    const d = await res.json();
    setSubmitting(false);
    if (d.comment) { setPost(p=>({...p,comments:[...p.comments,d.comment],commentCount:p.commentCount+1})); setCommentDraft(""); }
  }

  if (!post) return <div style={{textAlign:"center",padding:40,color:dimmer,fontSize:12,fontFamily:"var(--ff-body)"}}>Loading…</div>;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:dim,cursor:"pointer",fontSize:12,fontFamily:"var(--ff-body)",fontWeight:600,display:"flex",alignItems:"center",gap:4,padding:0,alignSelf:"flex-start"}}>← Back</button>

      <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:18,display:"flex",gap:12}}>
        {/* Vote column */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:32}}>
          <button onClick={()=>vote(1)} style={{background:"none",border:"none",cursor:"pointer",color:myVote===1?accent:dimmer,fontSize:16,lineHeight:1,padding:2}}>▲</button>
          <span style={{fontSize:13,fontWeight:700,color:post.voteScore>0?accent:post.voteScore<0?"#EF4444":dim,fontFamily:"var(--ff-body)"}}>{post.voteScore}</span>
          <button onClick={()=>vote(-1)} style={{background:"none",border:"none",cursor:"pointer",color:myVote===-1?"#EF4444":dimmer,fontSize:16,lineHeight:1,padding:2}}>▼</button>
        </div>
        {/* Content */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--ff-heading)",color:"rgba(255,255,255,.9)",marginBottom:10,lineHeight:1.3}}>{post.title}</div>
          <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
            <Avatar src={post.author.image} name={post.author.name} size={22}/>
            <span style={{fontSize:11,color:dim,fontFamily:"var(--ff-body)"}}>{post.author.name} · {timeAgo(post.createdAt)}</span>
            <span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:`${accent}12`,color:accent,fontFamily:"var(--ff-body)",fontWeight:700}}>{post.channel?.icon} {post.channel?.name}</span>
          </div>
          <div style={{fontSize:13,lineHeight:1.75,color:"rgba(255,255,255,.75)",fontFamily:"var(--ff-body)",whiteSpace:"pre-wrap"}}>{post.body}</div>
        </div>
      </div>

      {/* Comments */}
      <div style={{fontSize:10,fontWeight:700,letterSpacing:".1em",color:dimmer,fontFamily:"var(--ff-body)",textTransform:"uppercase"}}>{post.commentCount} Comment{post.commentCount!==1?"s":""}</div>
      {post.comments.map(c=>(
        <div key={c.id} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <Avatar src={c.author.image} name={c.author.name} size={30}/>
          <div style={{flex:1,background:card,border:`1px solid ${border}`,borderRadius:10,padding:"9px 12px"}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,.8)",fontFamily:"var(--ff-heading)"}}>{c.author.name}</span>
              <span style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)"}}>{timeAgo(c.createdAt)}</span>
            </div>
            <div style={{fontSize:13,lineHeight:1.6,color:"rgba(255,255,255,.7)",fontFamily:"var(--ff-body)"}}>{c.body}</div>
          </div>
        </div>
      ))}

      {/* Add comment */}
      <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
        <textarea value={commentDraft} onChange={e=>setCommentDraft(e.target.value.slice(0,4000))} maxLength={4000} rows={2} placeholder="Share your thoughts…"
          style={{flex:1,padding:"9px 12px",borderRadius:8,border:`1px solid ${border}`,background:card,color:"rgba(255,255,255,.85)",fontSize:13,fontFamily:"var(--ff-body)",resize:"none",outline:"none"}}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submitComment();}}}/>
        <button onClick={submitComment} disabled={!commentDraft.trim()||submitting}
          style={{padding:"9px 14px",borderRadius:8,border:"none",background:commentDraft.trim()&&!submitting?`linear-gradient(135deg,${accent},var(--ff-accent-2))`:"rgba(255,255,255,.04)",color:commentDraft.trim()&&!submitting?"#fff":dimmer,fontSize:12,fontWeight:600,fontFamily:"var(--ff-body)",cursor:commentDraft.trim()&&!submitting?"pointer":"not-allowed"}}>{submitting?"…":"Reply"}</button>
      </div>
    </div>
  );
}

// ── New Post Form ──────────────────────────────────────────────────────────────
function NewPostForm({ channel, onPost, onCancel }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!title.trim()||!body.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/community/channels/${channel.slug}/posts`, {
      method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,body}),
    });
    const d = await res.json();
    setSubmitting(false);
    if (d.post) onPost(d.post);
  }

  return (
    <div style={{background:card,border:`1px solid ${border}`,borderRadius:12,padding:16,display:"flex",flexDirection:"column",gap:10}}>
      <div style={{fontSize:13,fontWeight:700,fontFamily:"var(--ff-heading)",color:"rgba(255,255,255,.9)"}}>New post in {channel.icon} {channel.name}</div>
      <input value={title} onChange={e=>setTitle(e.target.value.slice(0,300))} maxLength={300} placeholder="Title"
        style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${border}`,background:"rgba(255,255,255,.02)",color:"rgba(255,255,255,.9)",fontSize:13,fontFamily:"var(--ff-body)",outline:"none"}}/>
      <textarea value={body} onChange={e=>setBody(e.target.value.slice(0,10000))} maxLength={10000} rows={5} placeholder="What do you want to discuss?"
        style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${border}`,background:"rgba(255,255,255,.02)",color:"rgba(255,255,255,.85)",fontSize:13,fontFamily:"var(--ff-body)",resize:"vertical",outline:"none"}}/>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${border}`,background:card,color:dim,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:"pointer"}}>Cancel</button>
        <button onClick={submit} disabled={!title.trim()||!body.trim()||submitting}
          style={{padding:"7px 14px",borderRadius:7,border:"none",background:title.trim()&&body.trim()&&!submitting?`linear-gradient(135deg,${accent},var(--ff-accent-2))`:"rgba(255,255,255,.05)",color:title.trim()&&body.trim()&&!submitting?"#fff":dimmer,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:title.trim()&&body.trim()&&!submitting?"pointer":"not-allowed"}}>{submitting?"Posting…":"Post"}</button>
      </div>
    </div>
  );
}

// ── Main Forums Tab ────────────────────────────────────────────────────────────
export default function ForumsTab() {
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState("new");
  const [activePostId, setActivePostId] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    fetch("/api/community/channels").then(r=>r.json()).then(d=>{ setChannels(d.channels||[]); if(d.channels?.length) setActiveChannel(d.channels[0]); });
  }, []);

  useEffect(() => {
    if (!activeChannel) return;
    setLoadingPosts(true); setActivePostId(null); setShowNewPost(false);
    fetch(`/api/community/channels/${activeChannel.slug}/posts?sort=${sort}`)
      .then(r=>r.json()).then(d=>{ setPosts(d.posts||[]); setLoadingPosts(false); }).catch(()=>setLoadingPosts(false));
  }, [activeChannel, sort]);

  const curriculum = channels.filter(c=>c.type==="curriculum");
  const topics = channels.filter(c=>c.type==="topic");

  if (activePostId) {
    return <PostDetail postId={activePostId} onBack={()=>setActivePostId(null)} />;
  }

  return (
    <div style={{display:"flex",gap:0,height:"100%"}}>
      {/* Channel sidebar */}
      <div style={{width:200,minWidth:200,borderRight:`1px solid ${border}`,paddingRight:12,display:"flex",flexDirection:"column",gap:16,overflowY:"auto",paddingBottom:16}}>
        <div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",color:dimmer,fontFamily:"var(--ff-body)",textTransform:"uppercase",marginBottom:6}}>Curriculum</div>
          {curriculum.map(ch=>(
            <button key={ch.id} onClick={()=>setActiveChannel(ch)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:7,border:"none",background:activeChannel?.id===ch.id?"rgba(255,255,255,.05)":"transparent",color:activeChannel?.id===ch.id?"rgba(255,255,255,.9)":dim,cursor:"pointer",fontSize:11,fontFamily:"var(--ff-body)",fontWeight:activeChannel?.id===ch.id?700:400,textAlign:"left",transition:"all .15s"}}>
              <span style={{fontSize:13,flexShrink:0}}>{ch.icon}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.name.replace(/Step \d: /,"")}</span>
              <span style={{fontSize:9,color:dimmer}}>{ch._count?.posts||0}</span>
            </button>
          ))}
        </div>
        <div>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",color:dimmer,fontFamily:"var(--ff-body)",textTransform:"uppercase",marginBottom:6}}>Topics</div>
          {topics.map(ch=>(
            <button key={ch.id} onClick={()=>setActiveChannel(ch)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:7,padding:"6px 8px",borderRadius:7,border:"none",background:activeChannel?.id===ch.id?"rgba(255,255,255,.05)":"transparent",color:activeChannel?.id===ch.id?"rgba(255,255,255,.9)":dim,cursor:"pointer",fontSize:11,fontFamily:"var(--ff-body)",fontWeight:activeChannel?.id===ch.id?700:400,textAlign:"left",transition:"all .15s"}}>
              <span style={{fontSize:13,flexShrink:0}}>{ch.icon}</span>
              <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.name}</span>
              <span style={{fontSize:9,color:dimmer}}>{ch._count?.posts||0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Post list */}
      <div style={{flex:1,paddingLeft:16,display:"flex",flexDirection:"column",gap:12,overflowY:"auto",minWidth:0}}>
        {activeChannel && (
          <>
            <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
              <span style={{fontSize:18}}>{activeChannel.icon}</span>
              <div>
                <div style={{fontSize:15,fontWeight:700,fontFamily:"var(--ff-heading)",color:"rgba(255,255,255,.9)"}}>{activeChannel.name}</div>
                {activeChannel.description && <div style={{fontSize:11,color:dim,fontFamily:"var(--ff-body)"}}>{activeChannel.description}</div>}
              </div>
              <div style={{marginLeft:"auto",display:"flex",gap:6}}>
                {["new","top"].map(s=>(
                  <button key={s} onClick={()=>setSort(s)} style={{padding:"4px 10px",borderRadius:20,fontSize:10,fontWeight:700,fontFamily:"var(--ff-body)",cursor:"pointer",border:`1px solid ${sort===s?accent:border}`,background:sort===s?`${accent}15`:card,color:sort===s?accent:dim,textTransform:"uppercase",letterSpacing:".06em"}}>{s}</button>
                ))}
                <button onClick={()=>setShowNewPost(true)} style={{padding:"5px 12px",borderRadius:7,border:"none",background:`linear-gradient(135deg,${accent},var(--ff-accent-2))`,color:"#fff",fontSize:11,fontWeight:700,fontFamily:"var(--ff-body)",cursor:"pointer"}}>+ Post</button>
              </div>
            </div>

            {showNewPost && <NewPostForm channel={activeChannel} onPost={p=>{setPosts(prev=>[p,...prev]);setShowNewPost(false);}} onCancel={()=>setShowNewPost(false)}/>}

            {loadingPosts ? <div style={{textAlign:"center",padding:40,color:dimmer,fontSize:12,fontFamily:"var(--ff-body)"}}>Loading…</div>
            : posts.length===0 ? <div style={{textAlign:"center",padding:40,color:dimmer,fontSize:13,fontFamily:"var(--ff-body)"}}>No posts yet in this channel. Be the first to start a discussion!</div>
            : posts.map(post=>(
              <div key={post.id} onClick={()=>setActivePostId(post.id)} style={{background:card,border:`1px solid ${border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",display:"flex",gap:12,transition:"border-color .15s"}}>
                {/* Vote score */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,minWidth:28}}>
                  <span style={{fontSize:14,color:post.myVote===1?accent:dimmer}}>▲</span>
                  <span style={{fontSize:12,fontWeight:700,color:post.voteScore>0?accent:post.voteScore<0?"#EF4444":dim,fontFamily:"var(--ff-body)"}}>{post.voteScore}</span>
                </div>
                {/* Content */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,fontFamily:"var(--ff-heading)",color:"rgba(255,255,255,.85)",marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{post.title}</div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Avatar src={post.author.image} name={post.author.name} size={18}/>
                    <span style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)"}}>{post.author.name} · {timeAgo(post.createdAt)}</span>
                    <span style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)"}}>💬 {post._count?.comments||0}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
