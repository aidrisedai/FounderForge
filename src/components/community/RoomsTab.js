"use client";
import { useState, useEffect, useRef } from "react";

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

function timeStamp(date) {
  return new Date(date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
}

// ── Create Room Modal ──────────────────────────────────────────────────────────
function CreateRoomModal({ onCreated, onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/community/rooms", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({name,description,isPublic}),
    });
    const d = await res.json();
    setSubmitting(false);
    if (d.room) onCreated(d.room);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{width:400,background:"#111113",border:`1px solid ${border}`,borderRadius:16,padding:24,display:"flex",flexDirection:"column",gap:14}}>
        <div style={{fontSize:16,fontWeight:700,fontFamily:"var(--ff-heading)",color:"rgba(255,255,255,.9)"}}>Create a room</div>
        <input value={name} onChange={e=>setName(e.target.value.slice(0,100))} maxLength={100} placeholder="Room name" autoFocus
          style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${border}`,background:card,color:"rgba(255,255,255,.9)",fontSize:13,fontFamily:"var(--ff-body)",outline:"none"}}/>
        <input value={description} onChange={e=>setDescription(e.target.value.slice(0,300))} maxLength={300} placeholder="Short description (optional)"
          style={{padding:"9px 12px",borderRadius:8,border:`1px solid ${border}`,background:card,color:"rgba(255,255,255,.85)",fontSize:13,fontFamily:"var(--ff-body)",outline:"none"}}/>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
          <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} style={{width:14,height:14,accentColor:accent}}/>
          <span style={{fontSize:12,color:dim,fontFamily:"var(--ff-body)"}}>Public — anyone can join</span>
        </label>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${border}`,background:card,color:dim,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:"pointer"}}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()||submitting} style={{padding:"7px 14px",borderRadius:7,border:"none",background:name.trim()&&!submitting?`linear-gradient(135deg,${accent},var(--ff-accent-2))`:"rgba(255,255,255,.05)",color:name.trim()&&!submitting?"#fff":dimmer,fontSize:11,fontWeight:600,fontFamily:"var(--ff-body)",cursor:name.trim()&&!submitting?"pointer":"not-allowed"}}>{submitting?"Creating…":"Create"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Room Chat ─────────────────────────────────────────────────────────────────
function RoomChat({ room, myId, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const btmRef = useRef(null);
  const pollRef = useRef(null);

  function loadMessages() {
    fetch(`/api/community/rooms/${room.id}/messages`).then(r=>r.json()).then(d=>{
      setMessages(d.messages||[]);
      setTimeout(()=>btmRef.current?.scrollIntoView({behavior:"smooth"}),50);
    });
  }

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, 20000);
    return () => clearInterval(pollRef.current);
  }, [room.id]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    const res = await fetch(`/api/community/rooms/${room.id}/messages`, {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({content:draft}),
    });
    const d = await res.json();
    setSending(false);
    if (d.message) { setMessages(p=>[...p,d.message]); setDraft(""); setTimeout(()=>btmRef.current?.scrollIntoView({behavior:"smooth"}),50); }
  }

  async function leaveRoom() {
    await fetch(`/api/community/rooms/${room.id}/join`, { method:"DELETE" });
    onLeave();
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,paddingBottom:12,borderBottom:`1px solid ${border}`,flexShrink:0}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,fontFamily:"var(--ff-heading)",color:"rgba(255,255,255,.9)"}}>{room.name}</div>
          {room.description && <div style={{fontSize:11,color:dim,fontFamily:"var(--ff-body)",marginTop:1}}>{room.description}</div>}
        </div>
        <span style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)",flexShrink:0}}>👥 {room._count?.members||"?"} members</span>
        <button onClick={leaveRoom} style={{fontSize:10,padding:"4px 8px",borderRadius:5,border:"1px solid rgba(239,68,68,.2)",background:"rgba(239,68,68,.06)",color:"rgba(239,68,68,.7)",cursor:"pointer",fontFamily:"var(--ff-body)",fontWeight:600,flexShrink:0}}>Leave</button>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:6,padding:"14px 0"}}>
        {messages.length===0 && <div style={{textAlign:"center",padding:32,color:dimmer,fontSize:12,fontFamily:"var(--ff-body)"}}>No messages yet. Say hello!</div>}
        {messages.map((m,i)=>{
          const mine = m.senderId===myId;
          const showAvatar = !mine && (i===0 || messages[i-1].senderId!==m.senderId);
          return (
            <div key={m.id} style={{display:"flex",gap:8,alignItems:"flex-end",flexDirection:mine?"row-reverse":"row",paddingLeft:mine?32:0,paddingRight:mine?0:32}}>
              {!mine && <div style={{width:28,flexShrink:0}}>{showAvatar?<Avatar src={m.sender.image} name={m.sender.name} size={28}/>:null}</div>}
              <div style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start",gap:2,maxWidth:"70%"}}>
                {showAvatar && !mine && <span style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)",paddingLeft:2}}>{m.sender.name}</span>}
                <div style={{padding:"8px 12px",borderRadius:12,borderBottomRightRadius:mine?3:12,borderBottomLeftRadius:mine?12:3,background:mine?`${accent}18`:card,border:`1px solid ${mine?`${accent}25`:border}`,fontSize:13,lineHeight:1.5,color:"rgba(255,255,255,.85)",fontFamily:"var(--ff-body)"}}>
                  {m.content}
                </div>
                <span style={{fontSize:9,color:dimmer,fontFamily:"var(--ff-body)"}}>{timeStamp(m.createdAt)}</span>
              </div>
            </div>
          );
        })}
        <div ref={btmRef}/>
      </div>

      {/* Input */}
      <div style={{display:"flex",gap:8,paddingTop:12,borderTop:`1px solid ${border}`,flexShrink:0}}>
        <textarea value={draft} onChange={e=>setDraft(e.target.value.slice(0,4000))} maxLength={4000} rows={2}
          placeholder="Message the group… (Enter to send)"
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          style={{flex:1,padding:"9px 12px",borderRadius:8,border:`1px solid ${border}`,background:card,color:"rgba(255,255,255,.85)",fontSize:13,fontFamily:"var(--ff-body)",resize:"none",outline:"none"}}/>
        <button onClick={send} disabled={!draft.trim()||sending}
          style={{padding:"9px 16px",borderRadius:8,border:"none",background:draft.trim()&&!sending?`linear-gradient(135deg,${accent},var(--ff-accent-2))`:"rgba(255,255,255,.03)",color:draft.trim()&&!sending?"#fff":dimmer,fontSize:12,fontWeight:600,fontFamily:"var(--ff-body)",cursor:draft.trim()&&!sending?"pointer":"not-allowed"}}>Send</button>
      </div>
    </div>
  );
}

// ── Main Rooms Tab ─────────────────────────────────────────────────────────────
export default function RoomsTab() {
  const [publicRooms, setPublicRooms] = useState([]);
  const [myRooms, setMyRooms] = useState([]);
  const [myId, setMyId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  function loadRooms() {
    fetch("/api/community/rooms").then(r=>r.json()).then(d=>{
      setPublicRooms(d.publicRooms||[]); setMyRooms(d.myRooms||[]); setMyId(d.myId); setLoading(false);
    }).catch(()=>setLoading(false));
  }

  useEffect(()=>{ loadRooms(); }, []);

  async function joinRoom(room) {
    await fetch(`/api/community/rooms/${room.id}/join`, { method:"POST" });
    loadRooms();
    setActiveRoom({...room, isMember:true});
  }

  function handleLeave() { loadRooms(); setActiveRoom(null); }

  const allVisible = [...myRooms, ...publicRooms.filter(r=>!myRooms.find(m=>m.id===r.id))];

  return (
    <div style={{display:"flex",gap:0,height:"100%"}}>
      {/* Room list sidebar */}
      <div style={{width:220,minWidth:220,borderRight:`1px solid ${border}`,paddingRight:12,display:"flex",flexDirection:"column",gap:8,overflowY:"auto"}}>
        <button onClick={()=>setShowCreate(true)} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"none",background:`linear-gradient(135deg,${accent},var(--ff-accent-2))`,color:"#fff",fontSize:11,fontWeight:700,fontFamily:"var(--ff-body)",cursor:"pointer",marginBottom:4}}>+ Create Room</button>

        {loading && <div style={{textAlign:"center",padding:20,color:dimmer,fontSize:11,fontFamily:"var(--ff-body)"}}>Loading…</div>}
        {myRooms.length>0 && (
          <>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",color:dimmer,fontFamily:"var(--ff-body)",textTransform:"uppercase",paddingTop:4}}>My Rooms</div>
            {myRooms.map(r=>(
              <button key={r.id} onClick={()=>setActiveRoom(r)}
                style={{width:"100%",padding:"8px 10px",borderRadius:8,border:`1px solid ${activeRoom?.id===r.id?accent+"40":border}`,background:activeRoom?.id===r.id?"rgba(255,255,255,.05)":card,color:activeRoom?.id===r.id?"rgba(255,255,255,.9)":dim,cursor:"pointer",textAlign:"left",fontSize:11,fontFamily:"var(--ff-body)",fontWeight:activeRoom?.id===r.id?700:400,transition:"all .15s"}}>
                <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}># {r.name}</div>
                <div style={{fontSize:9,color:dimmer,marginTop:1}}>👥 {r._count?.members||0}</div>
              </button>
            ))}
          </>
        )}

        {publicRooms.filter(r=>!myRooms.find(m=>m.id===r.id)).length>0 && (
          <>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:".1em",color:dimmer,fontFamily:"var(--ff-body)",textTransform:"uppercase",paddingTop:8}}>Public Rooms</div>
            {publicRooms.filter(r=>!myRooms.find(m=>m.id===r.id)).map(r=>(
              <div key={r.id} style={{padding:"8px 10px",borderRadius:8,border:`1px solid ${border}`,background:card}}>
                <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,.7)",fontFamily:"var(--ff-body)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:4}}># {r.name}</div>
                {r.description && <div style={{fontSize:10,color:dimmer,fontFamily:"var(--ff-body)",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.description}</div>}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{fontSize:9,color:dimmer,fontFamily:"var(--ff-body)"}}>{r._count?.members||0} members</span>
                  <button onClick={()=>joinRoom(r)} style={{fontSize:10,padding:"3px 8px",borderRadius:5,border:"none",background:`${accent}15`,color:accent,cursor:"pointer",fontFamily:"var(--ff-body)",fontWeight:700}}>Join</button>
                </div>
              </div>
            ))}
          </>
        )}

        {!loading&&allVisible.length===0 && <div style={{textAlign:"center",padding:24,color:dimmer,fontSize:11,fontFamily:"var(--ff-body)"}}>No rooms yet. Create the first one!</div>}
      </div>

      {/* Chat area */}
      <div style={{flex:1,paddingLeft:16,display:"flex",flexDirection:"column",minWidth:0}}>
        {activeRoom && activeRoom.isMember ? (
          <RoomChat room={activeRoom} myId={myId} onLeave={handleLeave}/>
        ) : (
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:12,color:dimmer}}>
            <div style={{fontSize:32}}>💬</div>
            <div style={{fontSize:13,fontFamily:"var(--ff-body)"}}>{allVisible.length===0?"Create a room to start chatting with other founders":"Join or select a room to start chatting"}</div>
          </div>
        )}
      </div>

      {showCreate && <CreateRoomModal onCreated={r=>{ loadRooms(); setActiveRoom({...r,isMember:true,_count:{members:1}}); setShowCreate(false); }} onClose={()=>setShowCreate(false)}/>}
    </div>
  );
}
