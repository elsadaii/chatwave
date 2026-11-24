import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { MessageCircle, Search, Send, LogOut, UserRound, Plus, ArrowLeft, Phone, Video, Paperclip, Smile, MoreVertical, CheckCheck } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setProfile(null); setConversations([]); setActive(null); return }
    loadProfile()
    loadConversations()
  }, [session?.user?.id])

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    setProfile(data)
  }

  async function loadConversations() {
    const { data: memberships, error } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', session.user.id)
    if (error) { setNotice(error.message); return }
    const ids = (memberships || []).map(x => x.conversation_id)
    if (!ids.length) { setConversations([]); return }
    const { data: rows, error: convError } = await supabase.from('conversations').select('*').in('id', ids).order('updated_at', { ascending: false })
    if (convError) { setNotice(convError.message); return }
    const enriched = await Promise.all((rows || []).map(async c => {
      const { data: members } = await supabase.from('conversation_members').select('user_id').eq('conversation_id', c.id)
      const otherId = (members || []).map(m => m.user_id).find(id => id !== session.user.id)
      let other = null
      if (otherId) {
        const { data } = await supabase.from('profiles').select('id,display_name,username,avatar_url').eq('id', otherId).maybeSingle()
        other = data
      }
      const { data: last } = await supabase.from('messages').select('body,created_at').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      return { ...c, other, last }
    }))
    setConversations(enriched)
  }

  useEffect(() => {
    if (!active?.id) { setMessages([]); return }
    loadMessages(active.id)
    const channel = supabase.channel('chat-' + active.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + active.id }, payload => {
        if (payload.eventType === 'INSERT') setMessages(old => old.some(m => m.id === payload.new.id) ? old : [...old, payload.new])
      }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [active?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadMessages(id) {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }).limit(200)
    if (error) setNotice(error.message)
    else setMessages(data || [])
  }

  async function handleAuth(e) {
    e.preventDefault(); setAuthBusy(true); setNotice('')
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: fullName } } })
        if (error) throw error
        setNotice('Pendaftaran berhasil. Jika konfirmasi email aktif, cek kotak masuk Anda.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) { setNotice(err.message) } finally { setAuthBusy(false) }
  }

  async function findPeople(value) {
    setSearch(value)
    if (!value.trim()) { setPeople([]); return }
    const q = '%' + value.trim().replace(/[%_]/g, '') + '%'
    const { data, error } = await supabase.from('profiles').select('id,display_name,username,avatar_url').neq('id', session.user.id).or('display_name.ilike.' + q + ',username.ilike.' + q).limit(20)
    if (error) setNotice(error.message)
    else setPeople(data || [])
  }

  async function startChat(person) {
    setNotice('')
    const { data: mine } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', session.user.id)
    const ids = (mine || []).map(x => x.conversation_id)
    if (ids.length) {
      const { data: theirs } = await supabase.from('conversation_members').select('conversation_id').eq('user_id', person.id).in('conversation_id', ids)
      if (theirs?.length) {
        const { data: found } = await supabase.from('conversations').select('*').eq('id', theirs[0].conversation_id).maybeSingle()
        if (found) { setActive({ ...found, other: person }); setShowSearch(false); setSearch(''); return }
      }
    }
    const { data: conv, error } = await supabase.from('conversations').insert({ kind: 'direct', created_by: session.user.id }).select().single()
    if (error) { setNotice(error.message); return }
    const { error: memberError } = await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: session.user.id },
      { conversation_id: conv.id, user_id: person.id }
    ])
    if (memberError) { setNotice(memberError.message); return }
    const next = { ...conv, other: person }
    setActive(next); setShowSearch(false); setSearch('')
    await loadConversations()
  }

  async function sendMessage(e) {
    e.preventDefault()
    const content = draft.trim()
    if (!content || !active) return
    setDraft('')
    const { error } = await supabase.from('messages').insert({ conversation_id: active.id, sender_id: session.user.id, body: content, message_type: 'text' })
    if (error) { setDraft(content); setNotice(error.message) }
    else loadConversations()
  }

  const displayName = p => p?.display_name || p?.username || p?.email || 'Pengguna ChatWave'
  const activeName = useMemo(() => active?.title || displayName(active?.other), [active, profile])

  if (!session) return <main className="auth-shell"><div className="auth-card"><div className="brand-mark"><MessageCircle size={27}/></div><div className="eyebrow">YOUR SPACE TO CONNECT</div><h1>Chat<span>Wave</span></h1><p className="muted">Percakapan terasa lebih dekat.</p><form onSubmit={handleAuth} className="auth-form">{authMode === 'signup' && <label>Nama lengkap<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nama Anda" required /></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required /></label><label>Password<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter" required /></label><button className="primary-btn" disabled={authBusy}>{authBusy ? 'Memproses...' : authMode === 'login' ? 'Masuk ke ChatWave' : 'Buat akun'}</button></form><button className="text-btn" onClick={()=>{setAuthMode(authMode === 'login' ? 'signup' : 'login');setNotice('')}}>{authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button>{notice && <div className="notice">{notice}</div>}<div className="secure-note">Private conversations · Realtime messaging</div></div></main>

  return <main className="app-shell"><aside className={'sidebar ' + (active ? 'mobile-hidden' : '')}><header className="side-header"><div className="brand-small"><div className="brand-mark small"><MessageCircle size={20}/></div><b>Chat<span>Wave</span></b></div><div className="header-actions"><button title="Cari pengguna" onClick={()=>setShowSearch(!showSearch)}><Plus/></button><button title="Keluar" onClick={()=>supabase.auth.signOut()}><LogOut/></button></div></header><div className="profile-strip"><div className="avatar self"><UserRound/></div><div><b>{displayName(profile)}</b><small>Online</small></div></div><div className="search-box"><Search size={17}/><input value={search} onChange={e=>{setShowSearch(true);findPeople(e.target.value)}} onFocus={()=>setShowSearch(true)} placeholder="Cari teman untuk chat..." /></div>{showSearch && search.trim() ? <div className="people-list"><div className="section-label">HASIL PENCARIAN</div>{people.map(p=><button className="person-row" key={p.id} onClick={()=>startChat(p)}><div className="avatar">{(displayName(p)[0] || 'U').toUpperCase()}</div><div><b>{displayName(p)}</b><small>@{p.username || 'pengguna'}</small></div></button>)}{!people.length && <p className="empty-hint">Tidak ada pengguna ditemukan.</p>}</div> : <><div className="list-heading"><span>Pesan</span><span className="muted-count">{conversations.length}</span></div><div className="conversation-list">{conversations.map(c=><button key={c.id} className={'conversation-row ' + (active?.id === c.id ? 'selected' : '')} onClick={()=>setActive(c)}><div className="avatar">{(displayName(c.other)[0] || 'U').toUpperCase()}</div><div className="conversation-info"><div className="conversation-top"><b>{displayName(c.other)}</b><small>{c.last?.created_at ? new Date(c.last.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : ''}</small></div><p>{c.last?.body || 'Mulai percakapan baru'}</p></div></button>)}{!conversations.length && <div className="empty-state"><MessageCircle size={28}/><b>Belum ada percakapan</b><p>Tekan tombol + untuk mencari teman.</p></div>}</div></>}</aside><section className={'chat-panel ' + (!active ? 'mobile-hidden' : '')}>{active ? <><header className="chat-header"><button className="back-btn" onClick={()=>setActive(null)}><ArrowLeft/></button><div className="avatar">{(activeName[0] || 'U').toUpperCase()}</div><div className="chat-person"><b>{activeName}</b><small>Chat pribadi</small></div><div className="chat-actions"><button title="Panggilan suara" onClick={()=>setNotice('Fitur panggilan suara akan hadir pada tahap berikutnya.')}><Phone/></button><button title="Panggilan video" onClick={()=>setNotice('Fitur panggilan video akan hadir pada tahap berikutnya.')}><Video/></button><button title="Lainnya" onClick={()=>setNotice('Pengaturan percakapan akan hadir pada tahap berikutnya.')}><MoreVertical/></button></div></header><div className="message-area">{messages.length ? messages.map(m=><div key={m.id} className={'message-row ' + (m.sender_id === session.user.id ? 'mine' : '')}><div className="bubble">{m.body}<div className="message-meta">{new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}{m.sender_id === session.user.id && <CheckCheck size={14}/>}</div></div></div>) : <div className="chat-empty"><div className="brand-mark"><MessageCircle/></div><b>Mulai percakapan</b><p>Kirim pesan pertama Anda.</p></div>}<div ref={bottomRef}/></div><form className="composer" onSubmit={sendMessage}><button type="button" title="Emoji" onClick={()=>setNotice('Pemilih emoji akan ditambahkan pada tahap berikutnya.')}><Smile/></button><button type="button" title="Lampiran" onClick={()=>setNotice('Kirim foto dan file akan ditambahkan pada tahap berikutnya.')}><Paperclip/></button><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Tulis pesan..." /><button className="send-btn" type="submit" disabled={!draft.trim()}><Send size={19}/></button></form></> : <div className="welcome-panel"><div className="welcome-art"><MessageCircle size={54}/></div><h2>Selamat datang di ChatWave</h2><p>Pilih percakapan atau cari teman untuk mulai mengobrol.</p><span>PRIVATE · SIMPLE · CONNECTED</span></div>}</section>{notice && <button className="toast" onClick={()=>setNotice('')}>{notice} <b>×</b></button>}</main>
}