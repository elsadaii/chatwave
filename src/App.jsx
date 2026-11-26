import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { MessageCircle, Search, Send, LogOut, UserRound, Plus, ArrowLeft, Phone, Video, Paperclip, Smile, MoreVertical, Check, CheckCheck, Settings, X, Save, Image as ImageIcon, FileText, Upload } from 'lucide-react'

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
  const [uploadBusy, setUploadBusy] = useState(false)
  const [peerOnline, setPeerOnline] = useState(false)
  const [peerTyping, setPeerTyping] = useState(false)
  const chatChannelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const attachmentInputRef = useRef(null)
  const avatarInputRef = useRef(null)
  const messageAreaRef = useRef(null)
  const initialChatScrollRef = useRef(null)

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
        const { data } = await supabase.from('profiles').select('id,display_name,username,avatar_url,last_seen_at').eq('id', otherId).maybeSingle()
        other = data
      }
      const { data: last } = await supabase.from('messages').select('body,created_at').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      return { ...c, other, last }
    }))
    setConversations(enriched)
  }

  useEffect(() => {
    initialChatScrollRef.current = active?.id || null
    setMessages([])
  }, [active?.id])

  useEffect(() => {
    if (!active?.id || !session?.user?.id) { setMessages([]); return }
    let alive = true
    let refreshing = false
    const refreshMessages = async () => {
      if (!alive || refreshing) return
      refreshing = true
      try {
        const { data, error } = await supabase.from('messages').select('*')
          .eq('conversation_id', active.id).order('created_at', { ascending: false }).limit(200)
        if (alive && !error) setMessages(await attachSignedMedia((data || []).reverse()))
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
          refreshMessages()
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

  useEffect(() => {
    if (!session?.user?.id) return
    let alive = true
    let saving = false
    const updateLastSeen = async () => {
      if (!alive || document.visibilityState !== 'visible' || saving) return
      saving = true
      try {
        const timestamp = new Date().toISOString()
        const { data, error } = await supabase.from('profiles')
          .update({ last_seen_at: timestamp })
          .eq('id', session.user.id)
          .select('id,last_seen_at')
          .maybeSingle()
        if (!alive) return
        if (error) {
          setNotice('Gagal menyimpan waktu terakhir online: ' + error.message)
        } else if (!data) {
          setNotice('Waktu terakhir online tidak tersimpan: profil akun tidak ditemukan.')
        } else {
          setProfile(old => old?.id === data.id ? { ...old, last_seen_at: data.last_seen_at } : old)
        }
      } catch (err) {
        if (alive) setNotice('Gagal menyimpan waktu terakhir online: ' + (err.message || 'Kesalahan koneksi'))
      } finally {
        saving = false
      }
    }
    updateLastSeen()
    const timer = window.setInterval(updateLastSeen, 15000)
    const onVisible = () => { if (document.visibilityState === 'visible') updateLastSeen() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return
    const peerId = active?.other?.id
    let alive = true
    const refreshPeerLastSeen = async () => {
      if (!peerId) return
      const { data, error } = await supabase.from('profiles')
        .select('id,last_seen_at')
        .eq('id', peerId)
        .maybeSingle()
      if (!alive || error || !data) return
      setActive(old => old?.other?.id === peerId ? { ...old, other: { ...old.other, last_seen_at: data.last_seen_at } } : old)
      setConversations(old => old.map(c => c.other?.id === peerId ? { ...c, other: { ...c.other, last_seen_at: data.last_seen_at } } : c))
    }
    const syncPresence = () => {
      const state = channel.presenceState()
      const online = !!peerId && Object.values(state).flat().some(p => p.user_id === peerId)
      setPeerOnline(online)
      if (!online) refreshPeerLastSeen()
    }
    const channel = supabase.channel('chatwave-online', { config: { presence: { key: session.user.id } } })
      .on('presence', { event: 'sync' }, syncPresence)
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (peerId && (newPresences || []).some(p => p.user_id === peerId)) setPeerOnline(true)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (peerId && (leftPresences || []).some(p => p.user_id === peerId)) {
          setPeerOnline(false)
          refreshPeerLastSeen()
        }
      })
      .subscribe(async status => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: session.user.id, display_name: displayName(profile) })
          syncPresence()
        }
      })
    return () => { alive = false; supabase.removeChannel(channel); setPeerOnline(false) }
  }, [session?.user?.id, active?.other?.id])

  // Load the peer's saved last-seen value and keep it synced in realtime.
  useEffect(() => {
    const peerId = active?.other?.id
    if (!peerId || !session?.user?.id) return
    let alive = true
    const applyPeerProfile = updated => {
      if (!updated) return
      setActive(old => old?.other?.id === peerId ? { ...old, other: { ...old.other, last_seen_at: updated.last_seen_at, display_name: updated.display_name, username: updated.username, avatar_url: updated.avatar_url } } : old)
      setConversations(old => old.map(c => c.other?.id === peerId ? { ...c, other: { ...c.other, last_seen_at: updated.last_seen_at, display_name: updated.display_name, username: updated.username, avatar_url: updated.avatar_url } } : c))
    }
    const loadPeerProfile = async () => {
      const { data, error } = await supabase.from('profiles')
        .select('id,last_seen_at,display_name,username,avatar_url')
        .eq('id', peerId)
        .maybeSingle()
      if (alive && !error) applyPeerProfile(data)
    }
    loadPeerProfile()
    const channel = supabase.channel('last-seen-' + peerId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'id=eq.' + peerId }, payload => {
        if (alive) applyPeerProfile(payload.new)
      }).subscribe()
    return () => { alive = false; supabase.removeChannel(channel) }
  }, [active?.other?.id, session?.user?.id])

  useEffect(() => {
    if (!active?.id || !session?.user?.id) { chatChannelRef.current = null; setPeerTyping(false); return }
    const peerId = active.other?.id
    const channel = supabase.channel('typing-' + active.id)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id === peerId) setPeerTyping(!!payload.typing)
      })
      .subscribe(status => { if (status === 'SUBSCRIBED') chatChannelRef.current = channel })
    return () => { chatChannelRef.current = null; supabase.removeChannel(channel); setPeerTyping(false) }
  }, [active?.id, active?.other?.id, session?.user?.id])

  // Always anchor a newly opened room to the bottom, accounting for layout and image loading.
  // This only runs on room open, not on later message updates, so manual scrolling is preserved.
  useEffect(() => {
    if (!active?.id || !messages.length || initialChatScrollRef.current !== active.id) return
    const scrollToBottom = () => {
      const area = messageAreaRef.current
      if (area && initialChatScrollRef.current === active.id) area.scrollTop = area.scrollHeight
    }
    scrollToBottom()
    const t1 = window.setTimeout(scrollToBottom, 120)
    const t2 = window.setTimeout(scrollToBottom, 450)
    const t3 = window.setTimeout(() => { scrollToBottom(); initialChatScrollRef.current = null }, 1000)
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); window.clearTimeout(t3) }
  }, [active?.id, messages.length])

  async function attachSignedMedia(rows) {
    return Promise.all(rows.map(async m => {
      if (!m.media_path) return m
      const { data } = await supabase.storage.from('chat-media').createSignedUrl(m.media_path, 3600)
      return { ...m, media_url: data?.signedUrl || null }
    }))
  }

  async function loadMessages(id) {
    const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: false }).limit(200)
    if (error) setNotice(error.message)
    else setMessages(await attachSignedMedia((data || []).reverse()))
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

  async function uploadAvatar(file) {
    if (!file || !session?.user?.id) return
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { setNotice('Foto profil harus JPG, PNG, WEBP, atau GIF.'); return }
    if (file.size > 5 * 1024 * 1024) { setNotice('Ukuran foto profil maksimal 5 MB.'); return }
    setUploadBusy(true); setNotice('')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${session.user.id}/${Date.now()}.${ext}`
      const { error: upError } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, cacheControl: '3600' })
      if (upError) throw upError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const { data, error } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() }).eq('id', session.user.id).select('*').single()
      if (error) throw error
      setProfile(data); await loadConversations(); setNotice('Foto profil berhasil diperbarui.')
    } catch (err) { setNotice(err.message || 'Gagal mengunggah foto profil.') }
    finally { setUploadBusy(false); if (avatarInputRef.current) avatarInputRef.current.value = '' }
  }

  async function uploadAttachment(file) {
    if (!file || !active || !session?.user?.id) return
    if (file.size > 50 * 1024 * 1024) { setNotice('Ukuran file maksimal 50 MB.'); return }
    setUploadBusy(true); setNotice('Mengunggah file...')
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-90)
      const path = `${active.id}/${session.user.id}/${crypto.randomUUID()}-${safeName}`
      const { error: upError } = await supabase.storage.from('chat-media').upload(path, file, { contentType: file.type || 'application/octet-stream', cacheControl: '3600' })
      if (upError) throw upError
      const isImage = file.type.startsWith('image/')
      const { error } = await supabase.from('messages').insert({ conversation_id: active.id, sender_id: session.user.id, body: file.name, message_type: isImage ? 'image' : 'file', media_path: path, media_mime_type: file.type || null, media_size_bytes: file.size })
      if (error) throw error
      await loadMessages(active.id); await loadConversations(); setNotice('File berhasil dikirim.')
    } catch (err) { setNotice('Gagal mengirim file: ' + (err.message || 'Kesalahan tidak diketahui')) }
    finally { setUploadBusy(false); if (attachmentInputRef.current) attachmentInputRef.current.value = '' }
  }

  function broadcastTyping(value) {
    const channel = chatChannelRef.current
    if (!channel || !session?.user?.id) return
    channel.send({ type: 'broadcast', event: 'typing', payload: { user_id: session.user.id, typing: value } })
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if (value) typingTimeoutRef.current = setTimeout(() => {
      chatChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: session.user.id, typing: false } })
    }, 1300)
  }

  async function findPeople(value) {
    setSearch(value)
    if (!value.trim()) { setPeople([]); return }
    const q = '%' + value.trim().replace(/[%_]/g, '') + '%'
    const { data, error } = await supabase.from('profiles').select('id,display_name,username,avatar_url,last_seen_at').neq('id', session.user.id).or('display_name.ilike.' + q + ',username.ilike.' + q).limit(20)
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
      // After sending, move the viewport to the newly sent message.
      window.setTimeout(() => {
        const area = messageAreaRef.current
        if (area) area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' })
      }, 80)
    }
  }

  const displayName = p => p?.display_name || p?.username || p?.email || 'Pengguna ChatWave'
  const activeName = useMemo(() => active?.title || displayName(active?.other), [active, profile])

  if (!session) return <main className="auth-shell"><div className="auth-card"><div className="brand-mark"><MessageCircle size={27}/></div><div className="eyebrow">YOUR SPACE TO CONNECT</div><h1>Chat<span>Wave</span></h1><p className="muted">Percakapan terasa lebih dekat.</p><form onSubmit={handleAuth} className="auth-form">{authMode === 'signup' && <label>Nama lengkap<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nama Anda" required /></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required /></label><label>Password<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter" required /></label><button className="primary-btn" disabled={authBusy}>{authBusy ? 'Memproses...' : authMode === 'login' ? 'Masuk ke ChatWave' : 'Buat akun'}</button></form><button className="text-btn" onClick={()=>{setAuthMode(authMode === 'login' ? 'signup' : 'login');setNotice('')}}>{authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button>{notice && <div className="notice">{notice}</div>}<div className="secure-note">Private conversations · Realtime messaging</div></div></main>

  return <main className="app-shell"><aside className={'sidebar ' + (active ? 'mobile-hidden' : '')}><header className="side-header"><div className="brand-small"><div className="brand-mark small"><MessageCircle size={20}/></div><b>Chat<span>Wave</span></b></div><div className="header-actions"><button title="Cari pengguna" onClick={()=>setShowSearch(!showSearch)}><Plus/></button><button title="Keluar" onClick={()=>supabase.auth.signOut()}><LogOut/></button></div></header><button className="profile-strip profile-open" onClick={openProfileSettings} title="Ubah profil"><div className="avatar self">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : <UserRound/>}</div><div className="profile-copy"><b>{displayName(profile)}</b><small>@{profile?.username || 'pengguna'} · Ubah profil</small></div><Settings className="profile-settings-icon" size={17}/></button><div className="search-box"><Search size={17}/><input value={search} onChange={e=>{setShowSearch(true);findPeople(e.target.value)}} onFocus={()=>setShowSearch(true)} placeholder="Cari teman untuk chat..." /></div>{showSearch && search.trim() ? <div className="people-list"><div className="section-label">HASIL PENCARIAN</div>{people.map(p=><button className="person-row" key={p.id} onClick={()=>startChat(p)}><div className="avatar">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : (displayName(p)[0] || 'U').toUpperCase()}</div><div><b>{displayName(p)}</b><small>@{p.username || 'pengguna'}</small></div></button>)}{!people.length && <p className="empty-hint">Tidak ada pengguna ditemukan.</p>}</div> : <><div className="list-heading"><span>Pesan</span><span className="muted-count">{conversations.length}</span></div><div className="conversation-list">{conversations.map(c=><button key={c.id} className={'conversation-row ' + (active?.id === c.id ? 'selected' : '')} onClick={()=>setActive(c)}><div className="avatar">{c.other?.avatar_url ? <img src={c.other.avatar_url} alt=""/> : (displayName(c.other)[0] || 'U').toUpperCase()}</div><div className="conversation-info"><div className="conversation-top"><b>{displayName(c.other)}</b><small>{c.last?.created_at ? new Date(c.last.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : ''}</small></div><p>{c.last?.body || 'Mulai percakapan baru'}</p></div></button>)}{!conversations.length && <div className="empty-state"><MessageCircle size={28}/><b>Belum ada percakapan</b><p>Tekan tombol + untuk mencari teman.</p></div>}</div></>}</aside><section className={'chat-panel ' + (!active ? 'mobile-hidden' : '')}>{active ? <><header className="chat-header"><button className="back-btn" onClick={()=>setActive(null)}><ArrowLeft/></button><div className="avatar">{active.other?.avatar_url ? <img src={active.other.avatar_url} alt=""/> : (activeName[0] || 'U').toUpperCase()}</div><div className="chat-person"><b>{activeName}</b><small>{peerTyping ? 'sedang mengetik...' : peerOnline ? 'Online' : active.other?.last_seen_at ? 'Terakhir dilihat ' + new Date(active.other.last_seen_at).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Waktu terakhir online belum tercatat'}</small></div><div className="chat-actions"><button title="Panggilan suara" onClick={()=>setNotice('Fitur panggilan suara akan hadir pada tahap berikutnya.')}><Phone/></button><button title="Panggilan video" onClick={()=>setNotice('Fitur panggilan video akan hadir pada tahap berikutnya.')}><Video/></button><button title="Lainnya" onClick={()=>setNotice('Pengaturan percakapan akan hadir pada tahap berikutnya.')}><MoreVertical/></button></div></header><div className="message-area" ref={messageAreaRef}>{messages.length ? messages.map(m=><div key={m.id} className={'message-row ' + (m.sender_id === session.user.id ? 'mine' : '')}><div className="bubble">{m.message_type === 'image' && m.media_url ? <a href={m.media_url} target="_blank" rel="noreferrer"><img className="message-image" src={m.media_url} alt={m.body || 'Foto'} onLoad={()=>{if(initialChatScrollRef.current===active?.id){const area=messageAreaRef.current;if(area)area.scrollTop=area.scrollHeight}}} /></a> : m.message_type === 'file' ? <a className="file-attachment" href={m.media_url || '#'} target="_blank" rel="noreferrer"><FileText size={18}/><span>{m.body || 'Unduh file'}</span></a> : m.body}<div className="message-meta">{new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}{m.sender_id === session.user.id && (peerReadAt && new Date(peerReadAt) >= new Date(m.created_at) ? <CheckCheck className="read-check" size={14}/> : <Check size={14}/>)}</div></div></div>) : <div className="chat-empty"><div className="brand-mark"><MessageCircle/></div><b>Mulai percakapan</b><p>Kirim pesan pertama Anda.</p></div>}</div><form className="composer" onSubmit={sendMessage}><button type="button" title="Emoji" onClick={()=>setNotice('Pemilih emoji akan ditambahkan pada tahap berikutnya.')}><Smile/></button><button type="button" title="Kirim foto atau file" disabled={uploadBusy} onClick={()=>attachmentInputRef.current?.click()}><Paperclip/></button><input ref={attachmentInputRef} className="hidden-file-input" type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" onChange={e=>uploadAttachment(e.target.files?.[0])}/><input value={draft} onChange={e=>{setDraft(e.target.value);broadcastTyping(!!e.target.value.trim())}} placeholder={uploadBusy ? 'Mengunggah...' : 'Tulis pesan...'} /><button className="send-btn" type="submit" disabled={!draft.trim()}><Send size={19}/></button></form></> : <div className="welcome-panel"><div className="welcome-art"><MessageCircle size={54}/></div><h2>Selamat datang di ChatWave</h2><p>Pilih percakapan atau cari teman untuk mulai mengobrol.</p><span>PRIVATE · SIMPLE · CONNECTED</span></div>}</section>{showProfile && <div className="profile-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowProfile(false)}}><section className="profile-modal"><header className="profile-modal-head"><div><span className="profile-kicker">AKUN CHATWAVE</span><h2>Pengaturan Profil</h2></div><button type="button" className="profile-close" onClick={()=>setShowProfile(false)} aria-label="Tutup"><X size={20}/></button></header><form className="profile-form" onSubmit={saveProfile}><div className="avatar-editor"><div className="avatar avatar-large">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : <UserRound/>}</div><div><b>Foto profil</b><small>JPG, PNG, WEBP atau GIF · Maks. 5 MB</small><button type="button" className="avatar-upload-btn" disabled={uploadBusy} onClick={()=>avatarInputRef.current?.click()}><Upload size={14}/>{uploadBusy ? 'Mengunggah...' : 'Pilih foto'}</button><input ref={avatarInputRef} className="hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>uploadAvatar(e.target.files?.[0])}/></div></div><label>Nama tampilan<input value={editDisplayName} onChange={e=>setEditDisplayName(e.target.value)} maxLength={40} placeholder="Nama yang terlihat di chat" required /></label><p className="field-help">Nama ini akan terlihat oleh teman saat mengobrol.</p><label>Username<input value={editUsername} onChange={e=>setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} minLength={3} maxLength={24} placeholder="contoh: elsaddhai" required /></label><p className="field-help">Dipakai orang lain untuk menemukan akun Anda. 3–24 karakter, huruf kecil, angka, atau _.</p><label>Email akun<input value={session.user.email || ''} disabled /></label><button className="primary-btn profile-save" type="submit" disabled={profileBusy}><Save size={17}/>{profileBusy ? 'Menyimpan...' : 'Simpan perubahan'}</button></form></section></div>}{notice && <button className="toast" onClick={()=>setNotice('')}>{notice} <b>×</b></button>}</main>
}