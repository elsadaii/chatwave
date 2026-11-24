import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { MessageCircle, Search, Send, LogOut, UserRound, Plus, ArrowLeft, Phone, Video, Paperclip, Smile, MoreVertical, Check, CheckCheck, Settings, X, Save } from 'lucide-react'

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
  const [peerReadAt, setPeerReadAt] = useState(null)
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editDisplayName, setEditDisplayName] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)
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
    if (!active?.id || !session?.user?.id) { setMessages([]); return }
    let alive = true
    let refreshing = false
    const refreshMessages = async () => {
      if (!alive || refreshing) return
      refreshing = true
      try {
        const { data, error } = await supabase.from('messages').select('*')
          .eq('conversation_id', active.id).order('created_at', { ascending: true }).limit(200)
        if (alive && !error) setMessages(data || [])
      } finally {
        refreshing = false
      }
    }

    refreshMessages()
    const channel = supabase.channel('chat-' + active.id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages',
        filter: 'conversation_id=eq.' + active.id
      }, payload => {
        if (!alive) return
        if (payload.eventType === 'INSERT') {
          setMessages(old => old.some(m => m.id === payload.new.id) ? old : [...old, payload.new])
          loadConversations()
        } else {
          refreshMessages()
        }
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') refreshMessages()
      })

    // Safety sync: recover messages if a WebSocket event is missed or reconnects.
    const syncTimer = window.setInterval(refreshMessages, 3000)
    return () => {
      alive = false
      window.clearInterval(syncTimer)
      supabase.removeChannel(channel)
    }
  }, [active?.id, session?.user?.id])


  useEffect(() => {
    if (!active?.id || !session?.user?.id) { setPeerReadAt(null); return }
    let alive = true
    const peerId = active.other?.id

    const loadPeerRead = async () => {
      if (!peerId) return
      const { data } = await supabase.from('conversation_members')
        .select('last_read_at').eq('conversation_id', active.id).eq('user_id', peerId).maybeSingle()
      if (alive) setPeerReadAt(data?.last_read_at || null)
    }

    loadPeerRead()
    const channel = supabase.channel('read-' + active.id)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'conversation_members',
        filter: 'conversation_id=eq.' + active.id
      }, payload => {
        if (alive && payload.new.user_id === peerId) {
          setPeerReadAt(payload.new.last_read_at || null)
        }
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') loadPeerRead()
      })

    return () => {
      alive = false
      supabase.removeChannel(channel)
    }
  }, [active?.id, active?.other?.id, session?.user?.id])

  useEffect(() => {
    if (!active?.id || !session?.user?.id) return
    let alive = true
    let marking = false
    const markRead = async () => {
      if (document.visibilityState !== 'visible' || marking) return
      marking = true
      const { error } = await supabase.rpc('mark_conversation_read', { p_conversation_id: active.id })
      marking = false
      if (alive && error) setNotice('Gagal memperbarui status dibaca: ' + error.message)
    }
    markRead()
    const onVisible = () => { if (document.visibilityState === 'visible') markRead() }
    document.addEventListener('visibilitychange', onVisible)
    const readTimer = window.setInterval(markRead, 4000)
    return () => {
      alive = false
      window.clearInterval(readTimer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active?.id, session?.user?.id, messages.length])

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
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { name: fullName } } })
        if (error) throw error
        setNotice('Pendaftaran berhasil. Jika konfirmasi email aktif, cek kotak masuk Anda.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) { setNotice(err.message) } finally { setAuthBusy(false) }
  }

  function openProfileSettings() {
    setEditUsername(profile?.username || '')
    setEditDisplayName(profile?.display_name || '')
    setNotice('')
    setShowProfile(true)
  }

  async function saveProfile(e) {
    e.preventDefault()
    if (!session?.user?.id) return
    const username = editUsername.trim().toLowerCase()
    const display_name = editDisplayName.trim()
    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      setNotice('Username harus 3–24 karakter, hanya huruf kecil, angka, dan garis bawah (_).')
      return
    }
    if (!display_name || display_name.length > 40) {
      setNotice('Nama tampilan wajib diisi dan maksimal 40 karakter.')
      return
    }
    setProfileBusy(true)
    setNotice('')
    try {
      const { data: existing, error: checkError } = await supabase.from('profiles')
        .select('id').eq('username', username).neq('id', session.user.id).maybeSingle()
      if (checkError) throw checkError
      if (existing) throw new Error('Username sudah digunakan. Silakan pilih username lain.')
      const { data, error } = await supabase.from('profiles').update({ username, display_name, updated_at: new Date().toISOString() })
        .eq('id', session.user.id).select('*').single()
      if (error) {
        if (error.code === '23505') throw new Error('Username sudah digunakan. Silakan pilih username lain.')
        throw error
      }
      setProfile(data)
      await loadConversations()
      setShowProfile(false)
      setNotice('Profil berhasil diperbarui.')
    } catch (err) {
      setNotice(err.message || 'Gagal menyimpan profil.')
    } finally {
      setProfileBusy(false)
    }
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
    // Add the creator first so the conversation becomes visible to its creator
    // under the member-only SELECT policy before adding the other participant.
    const { error: selfMemberError } = await supabase.from('conversation_members').insert({
      conversation_id: conv.id, user_id: session.user.id
    })
    if (selfMemberError) { setNotice(selfMemberError.message); return }

    const { error: memberError } = await supabase.from('conversation_members').insert({
      conversation_id: conv.id, user_id: person.id
    })
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
    if (error) {
      setDraft(content)
      setNotice(error.message)
    } else {
      // Reload from the database so the sender sees the message even if
      // the realtime event is delayed or not delivered to this client.
      await loadMessages(active.id)
      await loadConversations()
    }
  }

  const displayName = p => p?.display_name || p?.username || p?.email || 'Pengguna ChatWave'
  const activeName = useMemo(() => active?.title || displayName(active?.other), [active, profile])

  if (!session) return <main className="auth-shell"><div className="auth-card"><div className="brand-mark"><MessageCircle size={27}/></div><div className="eyebrow">YOUR SPACE TO CONNECT</div><h1>Chat<span>Wave</span></h1><p className="muted">Percakapan terasa lebih dekat.</p><form onSubmit={handleAuth} className="auth-form">{authMode === 'signup' && <label>Nama lengkap<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nama Anda" required /></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required /></label><label>Password<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter" required /></label><button className="primary-btn" disabled={authBusy}>{authBusy ? 'Memproses...' : authMode === 'login' ? 'Masuk ke ChatWave' : 'Buat akun'}</button></form><button className="text-btn" onClick={()=>{setAuthMode(authMode === 'login' ? 'signup' : 'login');setNotice('')}}>{authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button>{notice && <div className="notice">{notice}</div>}<div className="secure-note">Private conversations · Realtime messaging</div></div></main>

  return <main className="app-shell"><aside className={'sidebar ' + (active ? 'mobile-hidden' : '')}><header className="side-header"><div className="brand-small"><div className="brand-mark small"><MessageCircle size={20}/></div><b>Chat<span>Wave</span></b></div><div className="header-actions"><button title="Cari pengguna" onClick={()=>setShowSearch(!showSearch)}><Plus/></button><button title="Keluar" onClick={()=>supabase.auth.signOut()}><LogOut/></button></div></header><button className="profile-strip profile-open" onClick={openProfileSettings} title="Ubah profil"><div className="avatar self"><UserRound/></div><div className="profile-copy"><b>{displayName(profile)}</b><small>@{profile?.username || 'pengguna'} · Ubah profil</small></div><Settings className="profile-settings-icon" size={17}/></button><div className="search-box"><Search size={17}/><input value={search} onChange={e=>{setShowSearch(true);findPeople(e.target.value)}} onFocus={()=>setShowSearch(true)} placeholder="Cari teman untuk chat..." /></div>{showSearch && search.trim() ? <div className="people-list"><div className="section-label">HASIL PENCARIAN</div>{people.map(p=><button className="person-row" key={p.id} onClick={()=>startChat(p)}><div className="avatar">{(displayName(p)[0] || 'U').toUpperCase()}</div><div><b>{displayName(p)}</b><small>@{p.username || 'pengguna'}</small></div></button>)}{!people.length && <p className="empty-hint">Tidak ada pengguna ditemukan.</p>}</div> : <><div className="list-heading"><span>Pesan</span><span className="muted-count">{conversations.length}</span></div><div className="conversation-list">{conversations.map(c=><button key={c.id} className={'conversation-row ' + (active?.id === c.id ? 'selected' : '')} onClick={()=>setActive(c)}><div className="avatar">{(displayName(c.other)[0] || 'U').toUpperCase()}</div><div className="conversation-info"><div className="conversation-top"><b>{displayName(c.other)}</b><small>{c.last?.created_at ? new Date(c.last.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : ''}</small></div><p>{c.last?.body || 'Mulai percakapan baru'}</p></div></button>)}{!conversations.length && <div className="empty-state"><MessageCircle size={28}/><b>Belum ada percakapan</b><p>Tekan tombol + untuk mencari teman.</p></div>}</div></>}</aside><section className={'chat-panel ' + (!active ? 'mobile-hidden' : '')}>{active ? <><header className="chat-header"><button className="back-btn" onClick={()=>setActive(null)}><ArrowLeft/></button><div className="avatar">{(activeName[0] || 'U').toUpperCase()}</div><div className="chat-person"><b>{activeName}</b><small>Chat pribadi</small></div><div className="chat-actions"><button title="Panggilan suara" onClick={()=>setNotice('Fitur panggilan suara akan hadir pada tahap berikutnya.')}><Phone/></button><button title="Panggilan video" onClick={()=>setNotice('Fitur panggilan video akan hadir pada tahap berikutnya.')}><Video/></button><button title="Lainnya" onClick={()=>setNotice('Pengaturan percakapan akan hadir pada tahap berikutnya.')}><MoreVertical/></button></div></header><div className="message-area">{messages.length ? messages.map(m=><div key={m.id} className={'message-row ' + (m.sender_id === session.user.id ? 'mine' : '')}><div className="bubble">{m.body}<div className="message-meta">{new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}{m.sender_id === session.user.id && (peerReadAt && new Date(peerReadAt) >= new Date(m.created_at) ? <CheckCheck className="read-check" size={14}/> : <Check size={14}/>)}</div></div></div>) : <div className="chat-empty"><div className="brand-mark"><MessageCircle/></div><b>Mulai percakapan</b><p>Kirim pesan pertama Anda.</p></div>}<div ref={bottomRef}/></div><form className="composer" onSubmit={sendMessage}><button type="button" title="Emoji" onClick={()=>setNotice('Pemilih emoji akan ditambahkan pada tahap berikutnya.')}><Smile/></button><button type="button" title="Lampiran" onClick={()=>setNotice('Kirim foto dan file akan ditambahkan pada tahap berikutnya.')}><Paperclip/></button><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Tulis pesan..." /><button className="send-btn" type="submit" disabled={!draft.trim()}><Send size={19}/></button></form></> : <div className="welcome-panel"><div className="welcome-art"><MessageCircle size={54}/></div><h2>Selamat datang di ChatWave</h2><p>Pilih percakapan atau cari teman untuk mulai mengobrol.</p><span>PRIVATE · SIMPLE · CONNECTED</span></div>}</section>{showProfile && <div className="profile-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowProfile(false)}}><section className="profile-modal"><header className="profile-modal-head"><div><span className="profile-kicker">AKUN CHATWAVE</span><h2>Pengaturan Profil</h2></div><button type="button" className="profile-close" onClick={()=>setShowProfile(false)} aria-label="Tutup"><X size={20}/></button></header><form className="profile-form" onSubmit={saveProfile}><label>Nama tampilan<input value={editDisplayName} onChange={e=>setEditDisplayName(e.target.value)} maxLength={40} placeholder="Nama yang terlihat di chat" required /></label><p className="field-help">Nama ini akan terlihat oleh teman saat mengobrol.</p><label>Username<input value={editUsername} onChange={e=>setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} minLength={3} maxLength={24} placeholder="contoh: elsaddhai" required /></label><p className="field-help">Dipakai orang lain untuk menemukan akun Anda. 3–24 karakter, huruf kecil, angka, atau _.</p><label>Email akun<input value={session.user.email || ''} disabled /></label><button className="primary-btn profile-save" type="submit" disabled={profileBusy}><Save size={17}/>{profileBusy ? 'Menyimpan...' : 'Simpan perubahan'}</button></form></section></div>}{notice && <button className="toast" onClick={()=>setNotice('')}>{notice} <b>×</b></button>}</main>
}