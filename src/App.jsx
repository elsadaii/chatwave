import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { MessageCircle, Search, Send, LogOut, UserRound, Plus, ArrowLeft, Phone, Video, Paperclip, Smile, MoreVertical, Check, CheckCheck, Settings, X, Save, Image as ImageIcon, FileText, Upload, Volume2, PhoneCall, CircleDot, History, Camera, FolderOpen, MapPin, Images } from 'lucide-react'
import { registerPlugin } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

const AudioRoute = registerPlugin('AudioRoute')

export default function App() {
  useEffect(() => {
    if (window.Capacitor?.isNativePlatform?.()) document.documentElement.classList.add('native-app')
    return () => document.documentElement.classList.remove('native-app')
  }, [])

  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [notice, setNotice] = useState('')
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(''), 3500); return () => window.clearTimeout(timer) }, [notice])
  const [conversations, setConversations] = useState([])
  const [homeTab, setHomeTab] = useState('chat')
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
  const [call, setCall] = useState(null)
  const [callStatus, setCallStatus] = useState('')
  const [callMuted, setCallMuted] = useState(false)
  const [callSeconds, setCallSeconds] = useState(0)
  const [callLogs, setCallLogs] = useState([])
  const [callLogsLoading, setCallLogsLoading] = useState(false)
  const [remoteVideoStream, setRemoteVideoStream] = useState(null)
  const localVideoRef = useRef(null)
  const [audioRoute, setAudioRoute] = useState('earpiece')
  const [audioRouteBusy, setAudioRouteBusy] = useState(false)
  const rtcRef = useRef(null)
  const pendingIceRef = useRef([])
  const seenSignalIdsRef = useRef(new Set())
  const audioRef = useRef(null)
  const localStreamRef = useRef(null)
  const chatChannelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const attachmentInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const attachmentPickerRef = useRef(null)
  useEffect(() => {
    if (!showAttachmentMenu) return
    const closeOnOutsideClick = (event) => {
      if (!attachmentPickerRef.current?.contains(event.target)) setShowAttachmentMenu(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowAttachmentMenu(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showAttachmentMenu])
  const avatarInputRef = useRef(null)
  const messageAreaRef = useRef(null)
  const initialChatScrollRef = useRef(null)
  const nearBottomRef = useRef(true)
  const followIncomingRef = useRef(false)

  // Handle Android's hardware/system back button inside the app instead of
  // letting the WebView close ChatWave while a screen is still open.
  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return
    let mounted = true
    let backListener
    CapacitorApp.addListener('backButton', () => {
      if (call) {
        setNotice('Akhiri panggilan terlebih dahulu untuk kembali.')
      } else if (showProfile) {
        setShowProfile(false)
      } else if (showSearch) {
        setShowSearch(false)
        setSearch('')
      } else if (active) {
        setActive(null)
      } else if (homeTab !== 'chat') {
        setHomeTab('chat')
      } else {
        CapacitorApp.exitApp()
      }
    }).then(listener => {
      if (mounted) backListener = listener
      else listener.remove()
    }).catch(error => console.warn('Gagal memasang tombol kembali Android:', error))
    return () => {
      mounted = false
      backListener?.remove()
    }
  }, [active, call, homeTab, showProfile, showSearch])

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

  async function loadCallLogs() {
    if (!session?.user?.id) return
    setCallLogsLoading(true)
    try {
      const { data: memberships, error: memberError } = await supabase
        .from('conversation_members').select('conversation_id').eq('user_id', session.user.id)
      if (memberError) throw memberError
      const conversationIds = (memberships || []).map(row => row.conversation_id)
      if (!conversationIds.length) { setCallLogs([]); return }
      const { data: rows, error: callsError } = await supabase
        .from('calls').select('*').in('conversation_id', conversationIds)
        .order('started_at', { ascending: false }).limit(100)
      if (callsError) throw callsError
      const enriched = await Promise.all((rows || []).map(async row => {
        const { data: members } = await supabase.from('conversation_members')
          .select('user_id').eq('conversation_id', row.conversation_id)
        const peerId = (members || []).map(member => member.user_id)
          .find(id => id !== row.started_by)
        const { data: peer } = peerId
          ? await supabase.from('profiles').select('id,display_name,username,avatar_url')
              .eq('id', peerId).maybeSingle()
          : { data: null }
        return { ...row, peer }
      }))
      setCallLogs(enriched)
    } catch (error) {
      setNotice('Gagal memuat log panggilan: ' + (error.message || 'kesalahan'))
    } finally {
      setCallLogsLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user?.id || homeTab !== 'calls') return
    loadCallLogs()
    const channel = supabase.channel('call-history-' + session.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => loadCallLogs())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session?.user?.id, homeTab])

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
    setConversations(enriched.sort((a, b) => new Date(b.last?.created_at || b.updated_at || 0) - new Date(a.last?.created_at || a.updated_at || 0)))
  }

  // Keep the conversation list live even while no chat room is open.
  useEffect(() => {
    if (!session?.user?.id) return
    const channels = []
    const conversationIds = conversations.map(c => c.id)
    conversationIds.forEach(conversationId => {
      const channel = supabase.channel('home-list-' + session.user.id + '-' + conversationId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: 'conversation_id=eq.' + conversationId
        }, payload => {
          const incoming = payload.new
          setConversations(old => {
            const updated = old.map(c => c.id === conversationId
              ? { ...c, last: { body: incoming.body, created_at: incoming.created_at }, updated_at: incoming.created_at }
              : c)
            return updated.sort((a, b) => new Date(b.last?.created_at || b.updated_at || 0) - new Date(a.last?.created_at || a.updated_at || 0))
          })
          // Reconcile the preview and ordering with the server after the immediate update.
          loadConversations()
        })
        .subscribe()
      channels.push(channel)
    })

    // Also discover conversations newly created by another participant.
    const membershipChannel = supabase.channel('home-memberships-' + session.user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'conversation_members',
        filter: 'user_id=eq.' + session.user.id
      }, () => loadConversations())
      .subscribe()
    channels.push(membershipChannel)

    return () => channels.forEach(channel => supabase.removeChannel(channel))
  }, [session?.user?.id, conversations.map(c => c.id).join('|')])

  useEffect(() => {
    initialChatScrollRef.current = active?.id || null
    nearBottomRef.current = true
    followIncomingRef.current = false
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
          // Receiver: remember whether they were already at the latest message
          // at the exact moment the incoming message arrived.
          if (payload.new.sender_id !== session.user.id) {
            const area = messageAreaRef.current
            const atBottom = area
              ? area.scrollHeight - area.scrollTop - area.clientHeight <= 120
              : nearBottomRef.current
            if (atBottom) followIncomingRef.current = true
          }
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

  // Only the receiver auto-follows a new incoming message, and only if
  // they were already at the bottom when that message arrived.
  useEffect(() => {
    if (!active?.id || !messages.length || initialChatScrollRef.current === active.id) return
    if (!followIncomingRef.current) return
    followIncomingRef.current = false
    const area = messageAreaRef.current
    if (area) area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' })
  }, [active?.id, messages.length])

  function trackMessageScroll() {
    const area = messageAreaRef.current
    if (!area) return
    nearBottomRef.current = area.scrollHeight - area.scrollTop - area.clientHeight <= 90
  }

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

  async function handleAttachmentFiles(fileList) {
    const files = Array.from(fileList || [])
    for (const file of files) await uploadAttachment(file)
    setShowAttachmentMenu(false)
  }

  async function shareCurrentLocation() {
    setShowAttachmentMenu(false)
    if (!navigator.geolocation) { setNotice('Perangkat tidak mendukung berbagi lokasi.'); return }
    setNotice('Mengambil lokasi...')
    navigator.geolocation.getCurrentPosition(async position => {
      const latitude = position.coords.latitude, longitude = position.coords.longitude
      const mapUrl = 'https://www.google.com/maps?q=' + latitude + ',' + longitude
      const body = 'Lokasi saya: ' + mapUrl + ' (akurasi ±' + Math.round(position.coords.accuracy) + ' m)'
      const { error } = await supabase.from('messages').insert({ conversation_id: active.id, sender_id: session.user.id, body, message_type: 'text' })
      if (error) setNotice('Gagal membagikan lokasi: ' + error.message)
      else { await loadMessages(active.id); await loadConversations(); setNotice('Lokasi berhasil dibagikan.') }
    }, error => { setNotice(error.code === 1 ? 'Izin lokasi ditolak. Izinkan akses lokasi untuk ChatWave.' : 'Lokasi tidak dapat diperoleh. Periksa GPS dan coba lagi.') }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
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


  useEffect(() => {
    if (!session?.user?.id) return
    const channel = supabase.channel('calls-inbox-'+session.user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'calls'},async payload=>{
      const row=payload.new;if(row.started_by===session.user.id||row.status!=='ringing')return
      const {data:members}=await supabase.from('conversation_members').select('user_id').eq('conversation_id',row.conversation_id)
      if((members||[]).some(m=>m.user_id===session.user.id)){setCall(row);setCallStatus('Panggilan masuk')}
    }).subscribe()
    return ()=>supabase.removeChannel(channel)
  },[session?.user?.id])
  // Keep both devices in sync when either participant accepts or ends a call.
  useEffect(()=>{
    if(!call?.id||!session?.user?.id)return
    let alive=true
    const applyCallStatus=row=>{
      if(!alive||!row||row.id!==call.id)return
      if(row.status==='accepted'){
        setCall(old=>old?.id===row.id?{...old,...row}:old)
        setCallStatus(old=>old==='Panggilan masuk'?'Menghubungkan...':old)
      }else if(['ended','declined','missed'].includes(row.status)){
        cleanupCall()
        setNotice(row.status==='declined'?'Panggilan ditolak':'Panggilan berakhir')
      }else{
        setCall(old=>old?.id===row.id?{...old,...row}:old)
      }
    }
    const channel=supabase.channel('call-status-'+call.id)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'calls',filter:'id=eq.'+call.id},payload=>applyCallStatus(payload.new))
      .subscribe()
    const sync=async()=>{
      const {data,error}=await supabase.from('calls').select('*').eq('id',call.id).maybeSingle()
      if(alive&&!error&&data)applyCallStatus(data)
    }
    sync()
    const timer=window.setInterval(sync,2000)
    return()=>{alive=false;window.clearInterval(timer);supabase.removeChannel(channel)}
  },[call?.id,session?.user?.id])
  const offerHandledRef=useRef(false)
  async function processCallSignal(v,senderId){
    const pc=rtcRef.current;if(!pc||senderId===session.user.id)return
    try{
      if(v.type==='offer'&&call?.started_by!==session.user.id&&!pc.remoteDescription&&!offerHandledRef.current&&(callStatus==='Menghubungkan...'||callStatus==='Panggilan masuk')){
        offerHandledRef.current=true;await pc.setRemoteDescription(v);await flushIce(pc);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await waitForIceGathering(pc);const {error:answerError}=await supabase.from('call_signals').insert({call_id:call.id,sender_id:session.user.id,payload:pc.localDescription});if(answerError)throw answerError;setCallStatus('Menghubungkan...')
      }else if(v.type==='answer'&&call?.started_by===session.user.id&&!pc.remoteDescription){await pc.setRemoteDescription(v);await flushIce(pc)}
      else if(v.candidate){if(pc.remoteDescription)await pc.addIceCandidate(v.candidate);else pendingIceRef.current.push(v.candidate)}
    }catch(e){setNotice('Signaling: '+(e.message||'gagal'))}
  }
  async function processSignalRow(row){if(!rtcRef.current||!row||row.sender_id===session.user.id||seenSignalIdsRef.current.has(row.id))return;seenSignalIdsRef.current.add(row.id);await processCallSignal(row.payload,row.sender_id)}
  useEffect(()=>{if(!call||!session?.user?.id)return;let alive=true;seenSignalIdsRef.current=new Set();const sync=async()=>{const {data,error}=await supabase.from('call_signals').select('id,sender_id,payload').eq('call_id',call.id).order('created_at');if(!alive||error)return;for(const row of data||[])await processSignalRow(row)};const ch=supabase.channel('signals-'+call.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'call_signals',filter:'call_id=eq.'+call.id},p=>processSignalRow(p.new)).subscribe(status=>{if(status==='SUBSCRIBED')sync()});const poll=window.setInterval(sync,1500);return()=>{alive=false;window.clearInterval(poll);supabase.removeChannel(ch)}},[call?.id,session?.user?.id])
  useEffect(()=>{if(callStatus!=='Terhubung')return;const timer=setInterval(()=>setCallSeconds(s=>s+1),1000);return()=>clearInterval(timer)},[callStatus])
  async function waitForIceGathering(pc){if(pc.iceGatheringState==='complete')return;setCallStatus('Mencari jalur jaringan...');await new Promise(resolve=>{let done=false;const finish=()=>{if(done)return;done=true;pc.removeEventListener('icegatheringstatechange',check);clearTimeout(timer);resolve()};const check=()=>{if(pc.iceGatheringState==='complete')finish()};const timer=setTimeout(finish,8000);pc.addEventListener('icegatheringstatechange',check);check()})}
  async function flushIce(pc){const pending=pendingIceRef.current.splice(0);for(const candidate of pending){try{await pc.addIceCandidate(candidate)}catch(e){console.warn('ICE candidate',e)}}}
  async function changeAudioRoute(route){setAudioRouteBusy(true);try{if(window.Capacitor?.isNativePlatform?.()){await AudioRoute.setRoute({route})}else{setNotice('Pemilihan speaker/earpiece tersedia di APK ChatWave.');return}setAudioRoute(route)}catch(e){setNotice('Gagal mengubah jalur suara: '+(e.message||'kesalahan audio'))}finally{setAudioRouteBusy(false)}}
  async function setupRtc(row,video=false){pendingIceRef.current=[];try{if(window.Capacitor?.isNativePlatform?.()){await AudioRoute.setRoute({route:'earpiece'});setAudioRoute('earpiece')}}catch(e){console.warn('Audio route',e)}const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});rtcRef.current=pc;pc.onicecandidate=e=>{if(e.candidate&&row)supabase.from('call_signals').insert({call_id:row.id,sender_id:session.user.id,payload:{candidate:e.candidate}})};pc.ontrack=e=>{const stream=e.streams[0];if(stream?.getVideoTracks().length)setRemoteVideoStream(stream);const audio=audioRef.current;if(audio){audio.srcObject=stream;audio.autoplay=true;audio.playsInline=true;audio.muted=false;audio.volume=1;audio.play().catch(()=>setNotice('Audio terblokir browser. Ketuk layar atau tombol panggilan untuk mengaktifkan suara.'))}};pc.oniceconnectionstatechange=()=>{const s=pc.iceConnectionState;if(s==='connected'||s==='completed')setCallStatus('Terhubung');else if(s==='checking')setCallStatus('Memeriksa jalur audio...');else if(s==='failed')setCallStatus('Jalur audio gagal (ICE)');else if(s==='disconnected')setCallStatus('Jaringan terputus, mencoba menyambung...')};pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected')setCallStatus('Terhubung');else if(pc.connectionState==='failed')setCallStatus('Koneksi WebRTC gagal');else if(pc.connectionState==='disconnected')setCallStatus('Koneksi terputus')};pc.onicecandidateerror=e=>setNotice('ICE error '+e.errorCode+': '+(e.errorText||'server STUN tidak merespons'));const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:video?{facingMode:'user'}:false});localStreamRef.current=stream;stream.getTracks().forEach(t=>{t.enabled=true;pc.addTrack(t,stream)});if(video&&localVideoRef.current){localVideoRef.current.srcObject=stream;localVideoRef.current.muted=true;localVideoRef.current.play().catch(()=>{})}return pc}
  async function startCall(){try{offerHandledRef.current=false;seenSignalIdsRef.current=new Set();if(!navigator.mediaDevices?.getUserMedia)throw new Error('HTTPS dan izin mikrofon diperlukan');const {data:row,error}=await supabase.from('calls').insert({conversation_id:active.id,started_by:session.user.id,call_type:'voice',status:'ringing'}).select().single();if(error)throw error;setCall(row);setCallStatus('Memanggil...');setCallSeconds(0);const pc=await setupRtc(row);const offer=await pc.createOffer();await pc.setLocalDescription(offer);await waitForIceGathering(pc);const {error:signalError}=await supabase.from('call_signals').insert({call_id:row.id,sender_id:session.user.id,payload:pc.localDescription});if(signalError)throw signalError}catch(e){setNotice('Panggilan gagal: '+e.message);cleanupCall()}}
  async function startVideoCall(){try{offerHandledRef.current=false;seenSignalIdsRef.current=new Set();if(!navigator.mediaDevices?.getUserMedia)throw new Error('Kamera dan mikrofon memerlukan HTTPS dan izin');const {data:row,error}=await supabase.from('calls').insert({conversation_id:active.id,started_by:session.user.id,call_type:'video',status:'ringing'}).select().single();if(error)throw error;setCall(row);setCallStatus('Memanggil video...');setCallSeconds(0);const pc=await setupRtc(row,true);const offer=await pc.createOffer();await pc.setLocalDescription(offer);await waitForIceGathering(pc);const {error:signalError}=await supabase.from('call_signals').insert({call_id:row.id,sender_id:session.user.id,payload:pc.localDescription});if(signalError)throw signalError}catch(e){setNotice('Video call gagal: '+e.message);cleanupCall()}}
  async function acceptCall(){try{seenSignalIdsRef.current=new Set();if(!navigator.mediaDevices?.getUserMedia)throw new Error('HTTPS dan izin mikrofon diperlukan');offerHandledRef.current=false;const {error:acceptError}=await supabase.from('calls').update({status:'accepted'}).eq('id',call.id);if(acceptError)throw acceptError;setCall(old=>old?.id===call.id?{...old,status:'accepted'}:old);setCallStatus('Menghubungkan...');setCallSeconds(0);await setupRtc(call,call.call_type==='video');const {data:signals,error}=await supabase.from('call_signals').select('*').eq('call_id',call.id).order('created_at');if(error)throw error;const offerRow=(signals||[]).find(s=>s.sender_id!==session.user.id&&s.payload?.type==='offer');if(offerRow)await processCallSignal(offerRow.payload,offerRow.sender_id)}catch(e){setNotice('Gagal menerima: '+e.message)}}
  async function endCall(status='ended'){if(call){const {error}=await supabase.from('calls').update({status,ended_at:new Date().toISOString()}).eq('id',call.id);if(error)setNotice('Gagal memperbarui status panggilan: '+error.message);setNotice(status==='declined'?'Panggilan ditolak':'Panggilan berakhir')}cleanupCall()}
  function cleanupCall(){if(window.Capacitor?.isNativePlatform?.()){AudioRoute.setRoute({route:'normal'}).catch(()=>{})}offerHandledRef.current=false;seenSignalIdsRef.current=new Set();pendingIceRef.current=[];localStreamRef.current?.getTracks().forEach(t=>t.stop());localStreamRef.current=null;setRemoteVideoStream(null);if(localVideoRef.current)localVideoRef.current.srcObject=null;rtcRef.current?.getSenders().forEach(s=>{if(s.track&&s.track.readyState!=='ended')s.track.stop()});rtcRef.current?.close();rtcRef.current=null;if(audioRef.current){audioRef.current.pause();audioRef.current.srcObject=null;audioRef.current.muted=false}setCall(null);setCallStatus('');setCallMuted(false);setCallSeconds(0)}
  function toggleMute(){const tracks=localStreamRef.current?.getAudioTracks()||rtcRef.current?.getSenders().filter(s=>s.track?.kind==='audio').map(s=>s.track)||[];if(!tracks.length){setNotice('Mikrofon belum tersedia. Akhiri panggilan lalu coba hubungi kembali.');return}const shouldEnable=tracks.some(t=>!t.enabled);tracks.forEach(t=>{if(t.readyState==='live')t.enabled=shouldEnable});setCallMuted(!shouldEnable);if(shouldEnable)setNotice('Mikrofon aktif kembali.')} 

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

  return <main className="app-shell"><aside className={'sidebar ' + (active ? 'mobile-hidden' : '')}><header className="side-header"><div className="brand-small"><div className="brand-mark small"><MessageCircle size={20}/></div><b>Chat<span>Wave</span></b></div><div className="header-actions"><button title="Cari pengguna" onClick={()=>setShowSearch(!showSearch)}><Plus/></button><button title="Keluar" onClick={()=>supabase.auth.signOut()}><LogOut/></button></div></header><button className="profile-strip profile-open" onClick={openProfileSettings} title="Ubah profil"><div className="avatar self">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : <UserRound/>}</div><div className="profile-copy"><b>{displayName(profile)}</b><small>@{profile?.username || 'pengguna'} · Ubah profil</small></div><Settings className="profile-settings-icon" size={17}/></button><div className="search-box"><Search size={17}/><input value={search} onChange={e=>{setShowSearch(true);findPeople(e.target.value)}} onFocus={()=>setShowSearch(true)} placeholder="Cari teman untuk chat..." /></div>{showSearch && search.trim() ? <div className="people-list"><div className="section-label">HASIL PENCARIAN</div>{people.map(p=><button className="person-row" key={p.id} onClick={()=>startChat(p)}><div className="avatar">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : (displayName(p)[0] || 'U').toUpperCase()}</div><div><b>{displayName(p)}</b><small>@{p.username || 'pengguna'}</small></div></button>)}{!people.length && <p className="empty-hint">Tidak ada pengguna ditemukan.</p>}</div> : <div className="sidebar-home">
        {homeTab === 'chat' && <><div className="list-heading"><span>Pesan</span><span className="muted-count">{conversations.length}</span></div><div className="conversation-list">{conversations.map(c=><button key={c.id} className={'conversation-row ' + (active?.id === c.id ? 'selected' : '')} onClick={()=>setActive(c)}><div className="avatar">{c.other?.avatar_url ? <img src={c.other.avatar_url} alt=""/> : (displayName(c.other)[0] || 'U').toUpperCase()}</div><div className="conversation-info"><div className="conversation-top"><b>{displayName(c.other)}</b><small>{c.last?.created_at ? new Date(c.last.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : ''}</small></div><p>{c.last?.body || 'Mulai percakapan baru'}</p></div></button>)}{!conversations.length && <div className="empty-state"><MessageCircle size={28}/><b>Belum ada percakapan</b><p>Tekan tombol + untuk mencari teman.</p></div>}</div></>}
        {homeTab === 'status' && <div className="home-tab-content"><div className="list-heading"><span>Status</span></div><div className="tab-empty"><CircleDot size={34}/><b>Status belum tersedia</b><p>Fitur berbagi dan melihat status akan ditambahkan.</p></div></div>}
        {homeTab === 'calls' && <div className="home-tab-content"><div className="list-heading"><span>Log Panggilan</span><button type="button" className="text-btn" onClick={loadCallLogs}>Muat ulang</button></div><div className="call-log-list">{callLogsLoading && !callLogs.length ? <div className="tab-empty">Memuat riwayat panggilan...</div> : callLogs.length ? callLogs.map(row => { const outgoing = row.started_by === session.user.id; const durationSeconds = row.started_at && row.ended_at ? Math.max(0, Math.floor((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 1000)) : null; const durationLabel = durationSeconds === null ? '—' : String(Math.floor(durationSeconds / 60)).padStart(2, '0') + ':' + String(durationSeconds % 60).padStart(2, '0'); const statusLabel = row.status === 'missed' || (row.status === 'ringing' && !outgoing) ? 'Tidak terjawab' : row.status === 'declined' ? 'Ditolak' : row.status === 'ended' ? 'Berakhir' : row.status === 'accepted' ? 'Terhubung' : 'Memanggil'; return <div className="call-log-row" key={row.id}><div className="avatar">{row.peer?.avatar_url ? <img src={row.peer.avatar_url} alt=""/> : (displayName(row.peer)[0] || 'U').toUpperCase()}</div><div className="call-log-info"><b>{displayName(row.peer)}</b><small>{outgoing ? 'Panggilan keluar' : 'Panggilan masuk'} · {row.call_type === 'video' ? 'Video' : 'Suara'}</small><small>{new Date(row.started_at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small><small>Durasi: {durationLabel}</small></div><div className="call-log-result"><b>{statusLabel}</b><small>{row.ended_at ? new Date(row.ended_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : ''}</small></div></div> }) : <div className="tab-empty"><History size={34}/><b>Belum ada panggilan</b><p>Riwayat panggilan akan muncul otomatis di sini.</p></div>}</div></div>}
        <nav className="home-bottom-nav"><button className={homeTab==='chat'?'active':''} onClick={()=>{setHomeTab('chat');setShowSearch(false)}}><MessageCircle size={21}/><span>Chat</span></button><button className={homeTab==='status'?'active':''} onClick={()=>{setHomeTab('status');setShowSearch(false)}}><CircleDot size={21}/><span>Status</span></button><button className={homeTab==='calls'?'active':''} onClick={()=>{setHomeTab('calls');setShowSearch(false)}}><History size={21}/><span>Panggilan</span></button></nav></div>}</aside><section className={'chat-panel ' + (!active ? 'mobile-hidden' : '')}>{active ? <><header className="chat-header"><button className="back-btn" onClick={()=>setActive(null)}><ArrowLeft/></button><div className="avatar">{active.other?.avatar_url ? <img src={active.other.avatar_url} alt=""/> : (activeName[0] || 'U').toUpperCase()}</div><div className="chat-person"><b>{activeName}</b><small>{peerTyping ? 'sedang mengetik...' : peerOnline ? 'Online' : active.other?.last_seen_at ? 'Terakhir dilihat ' + new Date(active.other.last_seen_at).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Waktu terakhir online belum tercatat'}</small></div><div className="chat-actions"><button title="Panggilan suara" onClick={startCall}><Phone/></button><button title="Panggilan video" onClick={startVideoCall}><Video/></button><button title="Lainnya" onClick={()=>setNotice('Pengaturan percakapan akan hadir pada tahap berikutnya.')}><MoreVertical/></button></div></header><div className="message-area" ref={messageAreaRef} onScroll={trackMessageScroll}>{messages.length ? messages.map(m=><div key={m.id} className={'message-row ' + (m.sender_id === session.user.id ? 'mine' : '')}><div className="bubble">{m.message_type === 'image' && m.media_url ? <a href={m.media_url} target="_blank" rel="noreferrer"><img className="message-image" src={m.media_url} alt={m.body || 'Foto'} onLoad={()=>{if(initialChatScrollRef.current===active?.id){const area=messageAreaRef.current;if(area)area.scrollTop=area.scrollHeight}}} /></a> : m.message_type === 'file' ? <a className="file-attachment" href={m.media_url || '#'} target="_blank" rel="noreferrer"><FileText size={18}/><span>{m.body || 'Unduh file'}</span></a> : m.body}<div className="message-meta">{new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}{m.sender_id === session.user.id && (peerReadAt && new Date(peerReadAt) >= new Date(m.created_at) ? <CheckCheck className="read-check" size={14}/> : <Check size={14}/>)}</div></div></div>) : <div className="chat-empty"><div className="brand-mark"><MessageCircle/></div><b>Mulai percakapan</b><p>Kirim pesan pertama Anda.</p></div>}</div><form className="composer" onSubmit={sendMessage}><button type="button" title="Emoji" onClick={()=>setNotice('Pemilih emoji akan ditambahkan pada tahap berikutnya.')}><Smile/></button><div className="attachment-picker-wrap" ref={attachmentPickerRef}><button type="button" title="Lampiran" aria-label="Buka pilihan lampiran" disabled={uploadBusy} onClick={()=>setShowAttachmentMenu(v=>!v)}><Paperclip/></button>{showAttachmentMenu && <div className="attachment-menu"><button type="button" onClick={()=>{setShowAttachmentMenu(false);cameraInputRef.current?.click()}}><Camera size={19}/><span>Kamera</span></button><button type="button" onClick={()=>{setShowAttachmentMenu(false);attachmentInputRef.current?.click()}}><FolderOpen size={19}/><span>File</span></button><button type="button" onClick={()=>{setShowAttachmentMenu(false);shareCurrentLocation()}}><MapPin size={19}/><span>Bagikan lokasi</span></button><button type="button" onClick={()=>{setShowAttachmentMenu(false);galleryInputRef.current?.click()}}><Images size={19}/><span>Galeri</span></button></div>}</div><input ref={cameraInputRef} className="hidden-file-input" type="file" accept="image/*" capture="environment" onChange={e=>handleAttachmentFiles(e.target.files)}/><input ref={attachmentInputRef} className="hidden-file-input" type="file" onChange={e=>handleAttachmentFiles(e.target.files)}/><input ref={galleryInputRef} className="hidden-file-input" type="file" accept="image/*,video/*" multiple onChange={e=>handleAttachmentFiles(e.target.files)}/><input value={draft} onChange={e=>{setDraft(e.target.value);broadcastTyping(!!e.target.value.trim())}} placeholder={uploadBusy ? 'Mengunggah...' : 'Tulis pesan...'} /><button className="send-btn" type="submit" disabled={!draft.trim()}><Send size={19}/></button></form></> : <div className="welcome-panel"><div className="welcome-art"><MessageCircle size={54}/></div><h2>Selamat datang di ChatWave</h2><p>Pilih percakapan atau cari teman untuk mulai mengobrol.</p><span>PRIVATE · SIMPLE · CONNECTED</span></div>}</section>{showProfile && <div className="profile-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowProfile(false)}}><section className="profile-modal"><header className="profile-modal-head"><div><span className="profile-kicker">AKUN CHATWAVE</span><h2>Pengaturan Profil</h2></div><button type="button" className="profile-close" onClick={()=>setShowProfile(false)} aria-label="Tutup"><X size={20}/></button></header><form className="profile-form" onSubmit={saveProfile}><div className="avatar-editor"><div className="avatar avatar-large">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : <UserRound/>}</div><div><b>Foto profil</b><small>JPG, PNG, WEBP atau GIF · Maks. 5 MB</small><button type="button" className="avatar-upload-btn" disabled={uploadBusy} onClick={()=>avatarInputRef.current?.click()}><Upload size={14}/>{uploadBusy ? 'Mengunggah...' : 'Pilih foto'}</button><input ref={avatarInputRef} className="hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>uploadAvatar(e.target.files?.[0])}/></div></div><label>Nama tampilan<input value={editDisplayName} onChange={e=>setEditDisplayName(e.target.value)} maxLength={40} placeholder="Nama yang terlihat di chat" required /></label><p className="field-help">Nama ini akan terlihat oleh teman saat mengobrol.</p><label>Username<input value={editUsername} onChange={e=>setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} minLength={3} maxLength={24} placeholder="contoh: elsaddhai" required /></label><p className="field-help">Dipakai orang lain untuk menemukan akun Anda. 3–24 karakter, huruf kecil, angka, atau _.</p><label>Email akun<input value={session.user.email || ''} disabled /></label><button className="primary-btn profile-save" type="submit" disabled={profileBusy}><Save size={17}/>{profileBusy ? 'Menyimpan...' : 'Simpan perubahan'}</button></form></section></div>}{call && <div className="call-overlay"><section className="call-card"><div className="call-avatar"><Phone size={28}/></div><h2>{activeName}</h2><p>{callStatus||'Panggilan'}</p><div className="call-time">{String(Math.floor(callSeconds/60)).padStart(2,'0')}:{String(callSeconds%60).padStart(2,'0')}</div>{call.call_type==='video'&&<div className="video-call-stage"><video ref={localVideoRef} autoPlay playsInline muted className="local-video"/><video autoPlay playsInline className="remote-video" ref={el=>{if(el&&remoteVideoStream&&el.srcObject!==remoteVideoStream){el.srcObject=remoteVideoStream;el.play().catch(()=>{})}}}/></div>}<audio ref={audioRef} autoPlay playsInline style={{display:'block',width:'100%',marginTop:8}}/><div className="call-route-controls"><button type="button" className={audioRoute==='earpiece'?'route-active':''} disabled={audioRouteBusy} onClick={()=>changeAudioRoute('earpiece')}><PhoneCall size={16}/> Telepon</button><button type="button" className={audioRoute==='speaker'?'route-active':''} disabled={audioRouteBusy} onClick={()=>changeAudioRoute('speaker')}><Volume2 size={16}/> Speaker</button></div><div className="call-controls">{call.started_by!==session.user.id&&call.status==='ringing'?<><button onClick={acceptCall}>Terima</button><button className="end-call" onClick={()=>endCall('declined')}>Tolak</button></>:<><button onClick={toggleMute}>{callMuted?'Aktifkan mic':'Mute mic'}</button><button className="end-call" onClick={()=>endCall('ended')}>Akhiri</button></>}</div></section></div>}{notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}</main>
}