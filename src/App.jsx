import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase'
import { MessageCircle, Search, Send, LogOut, UserRound, Plus, ArrowLeft, Phone, Video, Paperclip, Smile, MoreVertical, Check, CheckCheck, Settings, X, Save, Image as ImageIcon, FileText, Upload, Volume2, PhoneCall, CircleDot, History, Camera, FolderOpen, MapPin, Images, Reply, Pencil, Trash2, Mic, Square, Users, UserPlus, Bell } from 'lucide-react'
import { registerPlugin } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'

const AudioRoute = registerPlugin('AudioRoute')
const CHAT_EMOJIS = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😋','😎','🤩','🥳','😭','😢','🥺','😔','😴','🤔','🤗','🤭','😮','😡','👍','👎','👏','🙌','🙏','❤️','🧡','💛','💚','💙','💜','✨','🔥','🎉','💯','✅','🤝','💪','🌹','☕']
const QUICK_REACTIONS = ['❤️','😂','😮','😢','👍','👏','🔥','🙏']

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
  const conversationsRef = useRef([])
  conversationsRef.current = conversations
  const [homeTab, setHomeTab] = useState('chat')
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [peerReadAt, setPeerReadAt] = useState(null)
  const [groupReadMembers, setGroupReadMembers] = useState([])
  const [draft, setDraft] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [openMessageMenu, setOpenMessageMenu] = useState(null)
  const [reactionPickerFor, setReactionPickerFor] = useState(null)
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState([])
  const [showSearch, setShowSearch] = useState(false)
  const [showGroupComposer, setShowGroupComposer] = useState(false)
  const [groupTitle, setGroupTitle] = useState('')
  const [groupMemberIds, setGroupMemberIds] = useState([])
  const [groupBusy, setGroupBusy] = useState(false)
  const [showAddGroupMembers, setShowAddGroupMembers] = useState(false)
  const [groupManageBusy, setGroupManageBusy] = useState(false)
  const [groupTitleEdit, setGroupTitleEdit] = useState('')
  const [notificationPermission, setNotificationPermission] = useState('default')
  const notificationPermissionRef = useRef('default')
  notificationPermissionRef.current = notificationPermission
  const [showProfile, setShowProfile] = useState(false)
  const [showChatInfo, setShowChatInfo] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
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
  const [statuses, setStatuses] = useState([])
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [showStatusComposer, setShowStatusComposer] = useState(false)
  const [statusDraft, setStatusDraft] = useState('')
  const [statusAudience, setStatusAudience] = useState('contacts')
  const [statusBackground, setStatusBackground] = useState('#17483b')
  const [statusFile, setStatusFile] = useState(null)
  const [viewingStatusGroup, setViewingStatusGroup] = useState(null)
  const [viewingStatusIndex, setViewingStatusIndex] = useState(0)
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
  const statusMediaInputRef = useRef(null)
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
  const [recordingVoiceNote, setRecordingVoiceNote] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const voiceRecorderRef = useRef(null)
  const voiceStreamRef = useRef(null)
  const voiceChunksRef = useRef([])
  const voiceStartedAtRef = useRef(0)
  const voiceConversationRef = useRef(null)
  const voiceReplyToRef = useRef(null)
  const activeConversationIdRef = useRef(null)
  activeConversationIdRef.current = active?.id || null
  const attachmentPickerRef = useRef(null)
  const emojiPickerRef = useRef(null)
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
  useEffect(() => {
    if (!showEmojiPicker) return
    const closeOnOutsideClick = event => {
      if (!emojiPickerRef.current?.contains(event.target)) setShowEmojiPicker(false)
    }
    const closeOnEscape = event => { if (event.key === 'Escape') setShowEmojiPicker(false) }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [showEmojiPicker])
  useEffect(() => {
    setShowChatInfo(false)
    setShowEmojiPicker(false)
  }, [active?.id])
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
      } else if (showGroupComposer) {
        setShowGroupComposer(false)
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
  }, [active, call, homeTab, showGroupComposer, showProfile, showSearch])

  useEffect(() => {
    setNotificationPermission(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  }, [])

  async function enableBrowserNotifications() {
    if (window.Capacitor?.isNativePlatform?.()) {
      setNotice('Push notification untuk APK memerlukan konfigurasi Firebase Cloud Messaging. Notifikasi browser diaktifkan lewat versi web.')
      return
    }
    if (!('Notification' in window)) {
      setNotificationPermission('unsupported')
      setNotice('Browser ini tidak mendukung notifikasi.')
      return
    }
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      setNotice(permission === 'granted' ? 'Notifikasi browser berhasil diaktifkan.' : 'Izin notifikasi belum diberikan.')
    } catch (error) { setNotice('Tidak dapat meminta izin notifikasi: ' + (error.message || 'kesalahan')) }
  }

  function notifyIncomingMessage(conversationId, message) {
    if (!document.hidden || notificationPermissionRef.current !== 'granted' || window.Capacitor?.isNativePlatform?.()) return
    try {
      const conversation = conversationsRef.current.find(item => item.id === conversationId)
      const title = conversation?.kind === 'group' ? conversation.title : displayName(conversation?.other)
      const body = message?.body || (message?.message_type === 'image' ? 'Mengirim foto' : message?.message_type === 'video' ? 'Mengirim video' : message?.media_mime_type?.startsWith('audio/') ? 'Mengirim Voice Note' : 'Mengirim lampiran')
      const notification = new Notification(title || 'Pesan baru di ChatWave', {
        body, tag: 'chatwave-' + conversationId, renotify: true
      })
      notification.onclick = () => {
        window.focus()
        setHomeTab('chat')
        const target = conversationsRef.current.find(item => item.id === conversationId)
        if (target) setActive(target)
        notification.close()
      }
    } catch (error) { console.warn('Notifikasi browser gagal ditampilkan:', error) }
  }

  function notifyIncomingCall(row, conversationId) {
    if (!document.hidden || notificationPermissionRef.current !== 'granted' || window.Capacitor?.isNativePlatform?.()) return
    try {
      const conversation = conversationsRef.current.find(item => item.id === conversationId)
      const title = conversation?.kind === 'group' ? conversation.title : displayName(conversation?.other)
      const notification = new Notification(title || 'Panggilan masuk ChatWave', {
        body: row.call_type === 'video' ? 'Panggilan video masuk' : 'Panggilan suara masuk',
        tag: 'chatwave-call-' + row.id, renotify: true
      })
      notification.onclick = () => {
        window.focus()
        setHomeTab('chat')
        const target = conversationsRef.current.find(item => item.id === conversationId)
        if (target) setActive(target)
        notification.close()
      }
    } catch (error) { console.warn('Notifikasi panggilan gagal ditampilkan:', error) }
  }

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

  async function loadStatusFeed() {
    if (!session?.user?.id) return
    setStatusLoading(true)
    try {
      const { data: rows, error } = await supabase.from('statuses').select('*')
        .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: true }).limit(150)
      if (error) throw error
      if (!rows?.length) { setStatuses([]); return }
      const userIds = [...new Set(rows.map(row => row.user_id))]
      const statusIds = rows.map(row => row.id)
      const [{ data: profiles, error: profileError }, { data: views, error: viewError }] = await Promise.all([
        supabase.from('profiles').select('id,display_name,username,avatar_url').in('id', userIds),
        supabase.from('status_views').select('status_id,viewer_id,viewed_at').in('status_id', statusIds)
      ])
      if (profileError) throw profileError
      if (viewError) throw viewError
      const profileById = new Map((profiles || []).map(item => [item.id, item]))
      const viewRows = views || []
      const enriched = await Promise.all(rows.map(async row => {
        let mediaUrl = null
        if (row.media_path) {
          const { data, error: signedError } = await supabase.storage.from('status-media').createSignedUrl(row.media_path, 3600)
          if (!signedError) mediaUrl = data?.signedUrl || null
        }
        const statusViews = viewRows.filter(view => view.status_id === row.id)
        return { ...row, user: profileById.get(row.user_id) || null, media_url: mediaUrl,
          view_count: statusViews.length, viewed_by_me: statusViews.some(view => view.viewer_id === session.user.id) }
      }))
      setStatuses(enriched)
    } catch (error) {
      setNotice('Gagal memuat Status: ' + (error.message || 'kesalahan'))
    } finally { setStatusLoading(false) }
  }

  useEffect(() => {
    if (!session?.user?.id || homeTab !== 'status') return
    loadStatusFeed()
    const channel = supabase.channel('status-feed-' + session.user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'statuses' }, () => loadStatusFeed())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'status_views' }, () => loadStatusFeed())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session?.user?.id, homeTab])

  async function loadProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
    setProfile(data)
  }

  async function loadConversations() {
    const { data: memberships, error } = await supabase.from('conversation_members')
      .select('conversation_id').eq('user_id', session.user.id)
    if (error) { setNotice(error.message); return }
    const ids = (memberships || []).map(item => item.conversation_id)
    if (!ids.length) { setConversations([]); return }
    const { data: rows, error: convError } = await supabase.from('conversations')
      .select('*').in('id', ids).order('updated_at', { ascending: false })
    if (convError) { setNotice(convError.message); return }
    const enriched = await Promise.all((rows || []).map(async conversation => {
      const [{ data: memberRows }, { data: last }] = await Promise.all([
        supabase.from('conversation_members').select('user_id,role,last_read_at')
          .eq('conversation_id', conversation.id),
        supabase.from('messages').select('body,created_at,sender_id,message_type')
          .eq('conversation_id', conversation.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ])
      const memberIds = (memberRows || []).map(item => item.user_id)
      const { data: profiles } = memberIds.length
        ? await supabase.from('profiles').select('id,display_name,username,avatar_url,last_seen_at')
            .in('id', memberIds)
        : { data: [] }
      const profileById = new Map((profiles || []).map(item => [item.id, item]))
      const members = (memberRows || []).map(member => ({
        ...member, profile: profileById.get(member.user_id) || null
      }))
      const otherId = conversation.kind === 'direct'
        ? memberIds.find(id => id !== session.user.id)
        : null
      const other = otherId ? profileById.get(otherId) || null : null
      const lastMember = last?.sender_id ? members.find(member => member.user_id === last.sender_id) : null
      return {
        ...conversation, members, other,
        last: last ? { ...last, sender_name: lastMember?.profile?.display_name || lastMember?.profile?.username || null } : null
      }
    }))
    setConversations(enriched.sort((a, b) =>
      new Date(b.last?.created_at || b.updated_at || 0) - new Date(a.last?.created_at || a.updated_at || 0)
    ))
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
          if (incoming.sender_id !== session.user.id) notifyIncomingMessage(conversationId, incoming)
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
    setReplyTarget(null)
    setEditingMessage(null)
    setOpenMessageMenu(null)
    setReactionPickerFor(null)
    setDraft('')
  }, [active?.id])

  useEffect(() => {
    if (!openMessageMenu) return
    const closeMenuOutside = event => {
      if (!event.target.closest?.('.message-tools')) setOpenMessageMenu(null)
    }
    document.addEventListener('pointerdown', closeMenuOutside)
    return () => document.removeEventListener('pointerdown', closeMenuOutside)
  }, [openMessageMenu])

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
        if (alive && !error) {
          const rows = (data || []).reverse()
          const { data: reactions, error: reactionError } = rows.length
            ? await supabase.from('message_reactions').select('message_id,user_id,emoji').in('message_id', rows.map(row => row.id))
            : { data: [], error: null }
          if (reactionError) console.warn('Gagal memuat reaksi pesan:', reactionError.message)
          const grouped = new Map()
          ;(reactions || []).forEach(reaction => {
            if (!grouped.has(reaction.message_id)) grouped.set(reaction.message_id, [])
            grouped.get(reaction.message_id).push(reaction)
          })
          const enriched = rows.map(row => ({ ...row, reactions: grouped.get(row.id) || [] }))
          setMessages(await attachSignedMedia(enriched))
        }
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
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'message_reactions'
      }, () => refreshMessages())
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
    if (!active?.id || !session?.user?.id || active.kind !== 'group') { setGroupReadMembers([]); return }
    let alive = true
    let refreshing = false
    const loadGroupReadMembers = async () => {
      if (refreshing) return
      refreshing = true
      try {
        const { data, error } = await supabase.from('conversation_members')
          .select('user_id,role,last_read_at').eq('conversation_id', active.id)
        if (!alive || error) return
        const rows = data || []
        setGroupReadMembers(rows)
        setActive(old => old?.id === active.id ? {
          ...old,
          members: (old.members || []).map(member => {
            const latest = rows.find(item => item.user_id === member.user_id)
            return latest ? { ...member, last_read_at: latest.last_read_at, role: latest.role } : member
          }).concat(rows.filter(item => !(old.members || []).some(member => member.user_id === item.user_id)).map(item => ({ ...item, profile: null })))
        } : old)
      } finally { refreshing = false }
    }
    loadGroupReadMembers()
    const channel = supabase.channel('group-members-' + active.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members', filter: 'conversation_id=eq.' + active.id }, loadGroupReadMembers)
      .subscribe(status => { if (status === 'SUBSCRIBED') loadGroupReadMembers() })
    const timer = window.setInterval(loadGroupReadMembers, 4000)
    return () => { alive = false; window.clearInterval(timer); supabase.removeChannel(channel) }
  }, [active?.id, active?.kind, session?.user?.id])

  useEffect(() => {
    if (!active?.id || !session?.user?.id || active.kind === 'group') { setPeerReadAt(null); return }
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
    if (error) { setNotice(error.message); return }
    const rows = (data || []).reverse()
    if (!rows.length) { setMessages([]); return }
    const { data: reactions, error: reactionError } = await supabase.from('message_reactions')
      .select('message_id,user_id,emoji').in('message_id', rows.map(row => row.id))
    if (reactionError) console.warn('Gagal memuat reaksi pesan:', reactionError.message)
    const groupedReactions = new Map()
    ;(reactions || []).forEach(reaction => {
      if (!groupedReactions.has(reaction.message_id)) groupedReactions.set(reaction.message_id, [])
      groupedReactions.get(reaction.message_id).push(reaction)
    })
    const enriched = rows.map(row => ({ ...row, reactions: groupedReactions.get(row.id) || [] }))
    setMessages(await attachSignedMedia(enriched))
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
      const { error } = await supabase.from('messages').insert({ conversation_id: active.id, sender_id: session.user.id, body: file.name, message_type: isImage ? 'image' : 'file', media_path: path, media_mime_type: file.type || null, media_size_bytes: file.size, reply_to: replyTarget?.id || null })
      if (error) throw error
      await loadMessages(active.id); await loadConversations(); setReplyTarget(null); setNotice('File berhasil dikirim.')
    } catch (err) { setNotice('Gagal mengirim file: ' + (err.message || 'Kesalahan tidak diketahui')) }
    finally { setUploadBusy(false); if (attachmentInputRef.current) attachmentInputRef.current.value = '' }
  }

  async function handleAttachmentFiles(fileList) {
    const files = Array.from(fileList || [])
    for (const file of files) await uploadAttachment(file)
    setShowAttachmentMenu(false)
  }

  function formatVoiceDuration(seconds) {
    return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0')
  }

  async function uploadVoiceNote(blob, mimeType, durationSeconds, conversationId, replyToId) {
    if (!blob?.size || blob.size > 25 * 1024 * 1024) {
      setNotice(blob?.size ? 'Voice Note maksimal 25 MB.' : 'Rekaman kosong, silakan coba lagi.')
      return
    }
    const normalizedMime = (mimeType || blob.type || 'audio/webm').split(';')[0]
    const extension = normalizedMime === 'audio/mp4' ? 'm4a' : normalizedMime === 'audio/ogg' ? 'ogg' : 'webm'
    const durationLabel = formatVoiceDuration(durationSeconds)
    const path = `${conversationId}/${session.user.id}/${crypto.randomUUID()}-voice-note.${extension}`
    setUploadBusy(true)
    setNotice('Mengirim Voice Note...')
    let uploaded = false
    try {
      const { error: uploadError } = await supabase.storage.from('chat-media').upload(path, blob, {
        contentType: mimeType || normalizedMime,
        cacheControl: '3600'
      })
      if (uploadError) throw uploadError
      uploaded = true
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: session.user.id,
        body: `Voice Note (${durationLabel})`,
        message_type: 'file',
        media_path: path,
        media_mime_type: mimeType || normalizedMime,
        media_size_bytes: blob.size,
        reply_to: replyToId || null
      })
      if (error) throw error
      if (activeConversationIdRef.current === conversationId) await loadMessages(conversationId)
      await loadConversations()
      if (activeConversationIdRef.current === conversationId) setReplyTarget(null)
      setNotice('Voice Note berhasil dikirim.')
    } catch (error) {
      if (uploaded) await supabase.storage.from('chat-media').remove([path]).catch(() => {})
      setNotice('Gagal mengirim Voice Note: ' + (error.message || 'Kesalahan tidak diketahui'))
    } finally {
      setUploadBusy(false)
    }
  }

  async function startVoiceRecording() {
    if (!active || !session?.user?.id || uploadBusy || recordingVoiceNote) return
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setNotice('Perekaman Voice Note tidak didukung oleh browser/perangkat ini.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      const preferredType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported?.(type))
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream)
      voiceStreamRef.current = stream
      voiceChunksRef.current = []
      voiceConversationRef.current = active.id
      voiceReplyToRef.current = replyTarget?.id || null
      voiceStartedAtRef.current = Date.now()
      recorder.ondataavailable = event => {
        if (event.data?.size) voiceChunksRef.current.push(event.data)
      }
      recorder.onerror = () => setNotice('Terjadi masalah saat merekam Voice Note.')
      recorder.onstop = async () => {
        const elapsed = Math.max(1, Math.round((Date.now() - voiceStartedAtRef.current) / 1000))
        const mime = recorder.mimeType || voiceChunksRef.current[0]?.type || 'audio/webm'
        const blob = new Blob(voiceChunksRef.current, { type: mime })
        const targetConversation = voiceConversationRef.current
        const targetReply = voiceReplyToRef.current
        voiceChunksRef.current = []
        voiceRecorderRef.current = null
        voiceStreamRef.current?.getTracks().forEach(track => track.stop())
        voiceStreamRef.current = null
        voiceConversationRef.current = null
        voiceReplyToRef.current = null
        setRecordingVoiceNote(false)
        setRecordingSeconds(0)
        if (blob.size && targetConversation) await uploadVoiceNote(blob, mime, elapsed, targetConversation, targetReply)
        else setNotice('Rekaman kosong, silakan coba lagi.')
      }
      voiceRecorderRef.current = recorder
      recorder.start(250)
      setRecordingSeconds(0)
      setRecordingVoiceNote(true)
      setNotice('Sedang merekam Voice Note...')
    } catch (error) {
      voiceStreamRef.current?.getTracks().forEach(track => track.stop())
      voiceStreamRef.current = null
      setNotice(error.name === 'NotAllowedError'
        ? 'Izin mikrofon ditolak. Izinkan mikrofon untuk ChatWave.'
        : 'Tidak dapat memulai rekaman: ' + (error.message || 'mikrofon tidak tersedia'))
    }
  }

  function stopVoiceRecording() {
    const recorder = voiceRecorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  useEffect(() => {
    if (!recordingVoiceNote) return
    const timer = window.setInterval(() => setRecordingSeconds(seconds => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [recordingVoiceNote])

  useEffect(() => {
    if (recordingVoiceNote && voiceConversationRef.current && voiceConversationRef.current !== active?.id) {
      stopVoiceRecording()
    }
  }, [active?.id, recordingVoiceNote])

  async function publishStatus() {
    if (!session?.user?.id || statusBusy) return
    const body = statusDraft.trim()
    if (!statusFile && !body) { setNotice('Tulis status atau pilih foto/video terlebih dahulu.'); return }
    if (statusFile && statusFile.size > 50 * 1024 * 1024) { setNotice('Ukuran foto/video Status maksimal 50 MB.'); return }
    setStatusBusy(true)
    setNotice('Menerbitkan Status...')
    let mediaPath = null
    try {
      let mediaType = 'text'
      if (statusFile) {
        mediaType = statusFile.type.startsWith('video/') ? 'video' : 'image'
        const safeName = statusFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
        mediaPath = session.user.id + '/' + crypto.randomUUID() + '-' + safeName
        const { error: uploadError } = await supabase.storage.from('status-media').upload(mediaPath, statusFile, {
          contentType: statusFile.type, cacheControl: '3600'
        })
        if (uploadError) throw uploadError
      }
      const { error } = await supabase.from('statuses').insert({
        user_id: session.user.id, media_type: mediaType, body: body || null, media_path: mediaPath,
        background_color: mediaType === 'text' ? statusBackground : null, audience: statusAudience
      })
      if (error) throw error
      setShowStatusComposer(false); setStatusDraft(''); setStatusFile(null)
      await loadStatusFeed()
      setNotice('Status berhasil diterbitkan dan akan hilang setelah 24 jam.')
    } catch (error) {
      if (mediaPath) await supabase.storage.from('status-media').remove([mediaPath]).catch(() => {})
      setNotice('Gagal menerbitkan Status: ' + (error.message || 'kesalahan'))
    } finally {
      setStatusBusy(false)
      if (statusMediaInputRef.current) statusMediaInputRef.current.value = ''
    }
  }

  async function markStatusViewed(status) {
    if (!status || status.user_id === session?.user?.id) return
    const { error } = await supabase.from('status_views').upsert({
      status_id: status.id, viewer_id: session.user.id
    }, { onConflict: 'status_id,viewer_id', ignoreDuplicates: true })
    if (error) console.warn('Gagal mencatat Status dilihat:', error.message)
    setStatuses(current => current.map(item => item.id === status.id ? { ...item, viewed_by_me: true } : item))
  }

  function openStatusGroup(group) {
    if (!group?.statuses?.length) return
    setViewingStatusGroup(group); setViewingStatusIndex(0)
    markStatusViewed(group.statuses[0])
  }

  function moveStatus(direction) {
    if (!viewingStatusGroup) return
    const nextIndex = viewingStatusIndex + direction
    if (nextIndex < 0) return
    if (nextIndex >= viewingStatusGroup.statuses.length) { setViewingStatusGroup(null); return }
    setViewingStatusIndex(nextIndex)
    markStatusViewed(viewingStatusGroup.statuses[nextIndex])
  }

  function advanceStatus() {
    if (!viewingStatusGroup) return
    moveStatus(1)
  }

  useEffect(() => {
    if (!viewingStatusGroup || !currentViewedStatus || currentViewedStatus.media_type === 'video') return
    const timer = window.setTimeout(advanceStatus, 5000)
    return () => window.clearTimeout(timer)
  }, [viewingStatusGroup?.statuses?.length, viewingStatusIndex, currentViewedStatus?.id])

  async function deleteOwnStatus(status) {
    if (!status || status.user_id !== session?.user?.id) return
    if (!window.confirm('Hapus Status ini?')) return
    const { error } = await supabase.from('statuses').delete().eq('id', status.id).eq('user_id', session.user.id)
    if (error) { setNotice('Gagal menghapus Status: ' + error.message); return }
    if (status.media_path) await supabase.storage.from('status-media').remove([status.media_path]).catch(() => {})
    const remaining = viewingStatusGroup.statuses.filter(item => item.id !== status.id)
    setStatuses(current => current.filter(item => item.id !== status.id))
    if (!remaining.length) setViewingStatusGroup(null)
    else {
      const index = Math.min(viewingStatusIndex, remaining.length - 1)
      setViewingStatusGroup({ ...viewingStatusGroup, statuses: remaining })
      setViewingStatusIndex(index)
    }
    setNotice('Status berhasil dihapus.')
  }

  async function shareCurrentLocation() {
    setShowAttachmentMenu(false)
    if (!navigator.geolocation) { setNotice('Perangkat tidak mendukung berbagi lokasi.'); return }
    setNotice('Mengambil lokasi...')
    navigator.geolocation.getCurrentPosition(async position => {
      const latitude = position.coords.latitude, longitude = position.coords.longitude
      const mapUrl = 'https://www.google.com/maps?q=' + latitude + ',' + longitude
      const body = 'Lokasi saya: ' + mapUrl + ' (akurasi ±' + Math.round(position.coords.accuracy) + ' m)'
      const { error } = await supabase.from('messages').insert({ conversation_id: active.id, sender_id: session.user.id, body, message_type: 'text', reply_to: replyTarget?.id || null })
      if (error) setNotice('Gagal membagikan lokasi: ' + error.message)
      else { await loadMessages(active.id); await loadConversations(); setReplyTarget(null); setNotice('Lokasi berhasil dibagikan.') }
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
    const { data: mine, error: mineError } = await supabase.from('conversation_members')
      .select('conversation_id').eq('user_id', session.user.id)
    if (mineError) { setNotice(mineError.message); return }
    const ids = (mine || []).map(item => item.conversation_id)
    if (ids.length) {
      const { data: theirs, error: theirsError } = await supabase.from('conversation_members')
        .select('conversation_id').eq('user_id', person.id).in('conversation_id', ids)
      if (theirsError) { setNotice(theirsError.message); return }
      const sharedIds = (theirs || []).map(item => item.conversation_id)
      if (sharedIds.length) {
        const { data: found } = await supabase.from('conversations').select('*')
          .in('id', sharedIds).eq('kind', 'direct').limit(1).maybeSingle()
        if (found) {
          setActive({ ...found, other: person })
          setShowSearch(false); setSearch('')
          return
        }
      }
    }
    const { data: conv, error } = await supabase.from('conversations')
      .insert({ kind: 'direct', created_by: session.user.id }).select().single()
    if (error) { setNotice(error.message); return }
    const { error: selfMemberError } = await supabase.from('conversation_members').insert({
      conversation_id: conv.id, user_id: session.user.id, role: 'owner'
    })
    if (selfMemberError) { setNotice(selfMemberError.message); return }
    const { error: memberError } = await supabase.from('conversation_members').insert({
      conversation_id: conv.id, user_id: person.id, role: 'member'
    })
    if (memberError) {
      await supabase.from('conversations').delete().eq('id', conv.id)
      setNotice(memberError.message); return
    }
    const next = { ...conv, other: person, members: [
      { user_id: session.user.id, role: 'owner', profile },
      { user_id: person.id, role: 'member', profile: person }
    ] }
    setActive(next); setShowSearch(false); setSearch('')
    await loadConversations()
  }

  function toggleGroupMember(person) {
    setGroupMemberIds(current => current.includes(person.id)
      ? current.filter(id => id !== person.id)
      : current.length >= 20 ? current : [...current, person.id])
  }

  function openChatInfo() {
    if (active?.kind === 'group') setGroupTitleEdit(active.title || '')
    setShowChatInfo(true)
  }

  async function saveGroupTitle() {
    if (!active || active.kind !== 'group' || active.created_by !== session?.user?.id) return
    const title = groupTitleEdit.trim()
    if (title.length < 2 || title.length > 40) { setNotice('Nama grup harus 2–40 karakter.'); return }
    setGroupManageBusy(true)
    const { data, error } = await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() })
      .eq('id', active.id).eq('created_by', session.user.id).select('*').maybeSingle()
    if (error || !data) setNotice('Gagal mengubah nama grup: ' + (error?.message || 'Akses ditolak.'))
    else {
      setActive(old => old?.id === data.id ? { ...old, title: data.title } : old)
      setConversations(old => old.map(item => item.id === data.id ? { ...item, title: data.title } : item))
      setNotice('Nama grup berhasil diperbarui.')
    }
    setGroupManageBusy(false)
  }

  async function addGroupMembers() {
    if (!active || active.kind !== 'group' || active.created_by !== session?.user?.id) return
    const existing = new Set((active.members || []).map(member => member.user_id))
    const ids = groupMemberIds.filter(id => !existing.has(id))
    if (!ids.length) { setNotice('Pilih anggota baru terlebih dahulu.'); return }
    setGroupManageBusy(true)
    try {
      const rows = ids.map(userId => ({ conversation_id: active.id, user_id: userId, role: 'member' }))
      const { error } = await supabase.from('conversation_members').insert(rows)
      if (error) throw error
      const { data: profiles, error: profileError } = await supabase.from('profiles')
        .select('id,display_name,username,avatar_url,last_seen_at').in('id', ids)
      if (profileError) throw profileError
      const added = (profiles || []).map(person => ({ user_id: person.id, role: 'member', profile: person }))
      setActive(old => old?.id === active.id ? { ...old, members: [...(old.members || []), ...added] } : old)
      await loadConversations()
      setGroupMemberIds([]); setShowAddGroupMembers(false); setSearch(''); setPeople([])
      setNotice('Anggota berhasil ditambahkan ke grup.')
    } catch (error) { setNotice('Gagal menambah anggota: ' + (error.message || 'kesalahan')) }
    finally { setGroupManageBusy(false) }
  }

  async function removeGroupMember(member) {
    if (!active || active.kind !== 'group' || active.created_by !== session?.user?.id || member.user_id === session.user.id) return
    if (!window.confirm('Keluarkan ' + (member.profile?.display_name || member.profile?.username || 'anggota ini') + ' dari grup?')) return
    const { error } = await supabase.from('conversation_members').delete()
      .eq('conversation_id', active.id).eq('user_id', member.user_id)
    if (error) { setNotice('Gagal mengeluarkan anggota: ' + error.message); return }
    setActive(old => old?.id === active.id ? { ...old, members: (old.members || []).filter(item => item.user_id !== member.user_id) } : old)
    await loadConversations()
    setNotice('Anggota berhasil dikeluarkan.')
  }

  async function toggleGroupAdmin(member) {
    if (!active || active.kind !== 'group' || active.created_by !== session?.user?.id || member.user_id === session.user.id) return
    const nextRole = member.role === 'admin' ? 'member' : 'admin'
    const { data, error } = await supabase.from('conversation_members').update({ role: nextRole })
      .eq('conversation_id', active.id).eq('user_id', member.user_id).select('user_id,role').maybeSingle()
    if (error || !data) { setNotice('Gagal mengubah peran anggota: ' + (error?.message || 'Akses ditolak.')); return }
    setActive(old => old?.id === active.id ? { ...old, members: (old.members || []).map(item => item.user_id === member.user_id ? { ...item, role: nextRole } : item) } : old)
    await loadConversations()
  }

  async function leaveOrDeleteGroup() {
    if (!active || active.kind !== 'group') return
    const isOwner = active.created_by === session?.user?.id
    const prompt = isOwner ? 'Hapus grup beserta seluruh riwayat percakapannya untuk semua anggota?' : 'Keluar dari grup ini? Anda tidak akan menerima pesan baru dari grup.'
    if (!window.confirm(prompt)) return
    setGroupManageBusy(true)
    try {
      if (isOwner) {
        const { error } = await supabase.from('conversations').delete().eq('id', active.id).eq('created_by', session.user.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('conversation_members').delete()
          .eq('conversation_id', active.id).eq('user_id', session.user.id)
        if (error) throw error
      }
      setShowChatInfo(false); setActive(null)
      await loadConversations()
      setNotice(isOwner ? 'Grup berhasil dihapus.' : 'Anda telah keluar dari grup.')
    } catch (error) { setNotice('Gagal memproses grup: ' + (error.message || 'kesalahan')) }
    finally { setGroupManageBusy(false) }
  }

  async function createGroupConversation() {
    const title = groupTitle.trim()
    if (title.length < 2 || title.length > 40) {
      setNotice('Nama grup harus 2–40 karakter.')
      return
    }
    if (groupMemberIds.length < 2) {
      setNotice('Pilih minimal 2 anggota selain Anda untuk membuat grup.')
      return
    }
    if (groupBusy) return
    setGroupBusy(true)
    setNotice('')
    let createdConversationId = null
    try {
      const { data: conversation, error: conversationError } = await supabase.from('conversations')
        .insert({ kind: 'group', title, created_by: session.user.id }).select().single()
      if (conversationError) throw conversationError
      createdConversationId = conversation.id
      const participantRows = [
        { conversation_id: conversation.id, user_id: session.user.id, role: 'owner' },
        ...groupMemberIds.map(userId => ({ conversation_id: conversation.id, user_id: userId, role: 'member' }))
      ]
      const { error: membersError } = await supabase.from('conversation_members').insert(participantRows)
      if (membersError) throw membersError
      const { data: chosenProfiles, error: profileError } = await supabase.from('profiles')
        .select('id,display_name,username,avatar_url,last_seen_at').in('id', groupMemberIds)
      if (profileError) throw profileError
      const members = [
        { user_id: session.user.id, role: 'owner', profile },
        ...chosenProfiles.map(person => ({ user_id: person.id, role: 'member', profile: person }))
      ]
      setActive({ ...conversation, members, other: null })
      setGroupTitle(''); setGroupMemberIds([])
      setShowGroupComposer(false); setShowSearch(false); setSearch('')
      await loadConversations()
      setNotice('Grup berhasil dibuat.')
    } catch (error) {
      if (createdConversationId) await supabase.from('conversations').delete().eq('id', createdConversationId)
      setNotice('Gagal membuat grup: ' + (error.message || 'kesalahan'))
    } finally { setGroupBusy(false) }
  }


  useEffect(() => {
    if (!session?.user?.id) return
    const channel = supabase.channel('calls-inbox-'+session.user.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'calls'},async payload=>{
      const row=payload.new;if(row.started_by===session.user.id||row.status!=='ringing')return
      const {data:members}=await supabase.from('conversation_members').select('user_id').eq('conversation_id',row.conversation_id)
      if((members||[]).some(m=>m.user_id===session.user.id)){notifyIncomingCall(row,row.conversation_id);setCall(row);setCallStatus('Panggilan masuk')}
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
    if (editingMessage) {
      const { data: updatedMessage, error } = await supabase.from('messages').update({ body: content, edited_at: new Date().toISOString() }).eq('id', editingMessage.id).eq('sender_id', session.user.id).select('id').maybeSingle()
      if (error || !updatedMessage) { setNotice('Gagal mengedit pesan: ' + (error?.message || 'Pesan tidak ditemukan atau bukan milik Anda.')); return }
      setEditingMessage(null); setDraft('')
      await loadMessages(active.id); await loadConversations()
      setNotice('Pesan berhasil diedit.')
      return
    }
    setDraft('')
    const { error } = await supabase.from('messages').insert({ conversation_id: active.id, sender_id: session.user.id, body: content, message_type: 'text', reply_to: replyTarget?.id || null })
    if (error) { setDraft(content); setNotice(error.message) }
    else {
      setReplyTarget(null)
      await loadMessages(active.id); await loadConversations()
      window.setTimeout(() => { const area = messageAreaRef.current; if (area) area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' }) }, 80)
    }
  }

  async function toggleMessageReaction(message, emoji) {
    if (!active || !session?.user?.id || !message || message.deleted_at) return
    setReactionPickerFor(null)
    const exists = (message.reactions || []).some(item => item.user_id === session.user.id && item.emoji === emoji)
    const result = exists
      ? await supabase.from('message_reactions').delete().eq('message_id', message.id).eq('user_id', session.user.id).eq('emoji', emoji)
      : await supabase.from('message_reactions').insert({ message_id: message.id, user_id: session.user.id, emoji })
    if (result.error) { setNotice('Gagal memperbarui reaksi: ' + result.error.message); return }
    await loadMessages(active.id)
  }

  function beginReply(message) {
    setReplyTarget(message); setEditingMessage(null); setDraft(''); setOpenMessageMenu(null); setReactionPickerFor(null)
  }

  function beginEdit(message) {
    setEditingMessage({ id: message.id, body: message.body || '' }); setReplyTarget(null); setDraft(message.body || ''); setOpenMessageMenu(null)
  }

  async function deleteMessageForEveryone(message) {
    setOpenMessageMenu(null)
    if (!window.confirm('Tarik pesan ini untuk semua orang?')) return
    const { data: deletedMessage, error } = await supabase.from('messages').update({
      message_type: 'system', body: 'Pesan ini telah dihapus', media_path: null,
      media_mime_type: null, media_size_bytes: null, deleted_at: new Date().toISOString()
    }).eq('id', message.id).eq('sender_id', session.user.id).select('id').maybeSingle()
    if (error || !deletedMessage) { setNotice('Gagal menarik pesan: ' + (error?.message || 'Pesan tidak ditemukan atau bukan milik Anda.')); return }
    if (message.media_path) {
      const { error: storageError } = await supabase.storage.from('chat-media').remove([message.media_path])
      if (storageError) console.warn('Media pesan yang ditarik belum dapat dibersihkan:', storageError.message)
    }
    if (replyTarget?.id === message.id) setReplyTarget(null)
    await loadMessages(active.id); await loadConversations()
    setNotice('Pesan ditarik untuk semua orang.')
  }

  const displayName = p => p?.display_name || p?.username || p?.email || 'Pengguna ChatWave'
  const activeName = active?.title || displayName(active?.other)
  const statusGroups = useMemo(() => {
    const grouped = new Map()
    statuses.forEach(status => {
      if (!grouped.has(status.user_id)) grouped.set(status.user_id, { user_id: status.user_id, user: status.user, statuses: [] })
      grouped.get(status.user_id).statuses.push(status)
    })
    return [...grouped.values()].sort((a,b) => a.user_id === session?.user?.id ? -1 : b.user_id === session?.user?.id ? 1 : 0)
  }, [statuses, session?.user?.id])
  const currentViewedStatus = viewingStatusGroup?.statuses?.[viewingStatusIndex] || null

  if (!session) return <main className="auth-shell"><div className="auth-card"><div className="brand-mark"><MessageCircle size={27}/></div><div className="eyebrow">YOUR SPACE TO CONNECT</div><h1>Chat<span>Wave</span></h1><p className="muted">Percakapan terasa lebih dekat.</p><form onSubmit={handleAuth} className="auth-form">{authMode === 'signup' && <label>Nama lengkap<input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Nama Anda" required /></label>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required /></label><label>Password<input type="password" minLength="6" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter" required /></label><button className="primary-btn" disabled={authBusy}>{authBusy ? 'Memproses...' : authMode === 'login' ? 'Masuk ke ChatWave' : 'Buat akun'}</button></form><button className="text-btn" onClick={()=>{setAuthMode(authMode === 'login' ? 'signup' : 'login');setNotice('')}}>{authMode === 'login' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}</button>{notice && <div className="notice">{notice}</div>}<div className="secure-note">Private conversations · Realtime messaging</div></div></main>

  return <main className="app-shell"><aside className={'sidebar ' + (active ? 'mobile-hidden' : '')}><header className="side-header"><div className="brand-small"><div className="brand-mark small"><MessageCircle size={20}/></div><b>Chat<span>Wave</span></b></div><div className="header-actions"><button title={notificationPermission==='granted'?'Notifikasi aktif':'Aktifkan notifikasi browser'} onClick={enableBrowserNotifications}><Bell size={17}/></button><button title="Cari pengguna" onClick={()=>setShowSearch(!showSearch)}><Plus/></button><button title="Buat grup" onClick={()=>{setGroupMemberIds([]);setGroupTitle('');setShowGroupComposer(true)}}><Users size={18}/></button><button title="Keluar" onClick={()=>supabase.auth.signOut()}><LogOut/></button></div></header><button className="profile-strip profile-open" onClick={openProfileSettings} title="Ubah profil"><div className="avatar self">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : <UserRound/>}</div><div className="profile-copy"><b>{displayName(profile)}</b><small>@{profile?.username || 'pengguna'} · Ubah profil</small></div><Settings className="profile-settings-icon" size={17}/></button><div className="search-box"><Search size={17}/><input value={search} onChange={e=>{setShowSearch(true);findPeople(e.target.value)}} onFocus={()=>setShowSearch(true)} placeholder="Cari teman untuk chat..." /></div>{showSearch && search.trim() ? <div className="people-list"><div className="people-list-heading"><div className="section-label">HASIL PENCARIAN</div><button type="button" className="create-group-open" onClick={()=>setShowGroupComposer(true)}><Users size={15}/>Buat grup</button></div>{people.map(p=><button className="person-row" key={p.id} onClick={()=>startChat(p)}><div className="avatar">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : (displayName(p)[0] || 'U').toUpperCase()}</div><div><b>{displayName(p)}</b><small>@{p.username || 'pengguna'}</small></div></button>)}{!people.length && <p className="empty-hint">Tidak ada pengguna ditemukan.</p>}</div> : <div className="sidebar-home">
        {homeTab === 'chat' && <><div className="list-heading"><span>Pesan</span><span className="muted-count">{conversations.length}</span></div><div className="conversation-list">{conversations.map(c=><button key={c.id} className={'conversation-row ' + (active?.id === c.id ? 'selected' : '')} onClick={()=>setActive(c)}><div className="avatar">{c.kind==='group'?<Users size={20}/>:c.other?.avatar_url ? <img src={c.other.avatar_url} alt=""/> : (displayName(c.other)[0] || 'U').toUpperCase()}</div><div className="conversation-info"><div className="conversation-top"><b>{c.kind==='group'?c.title:displayName(c.other)}</b><small>{c.last?.created_at ? new Date(c.last.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : ''}</small></div><p>{c.last ? (c.kind==='group' && c.last.sender_name ? c.last.sender_name + ': ' : '') + (c.last.body || (c.last.message_type==='image'?'Foto':c.last.message_type==='video'?'Video':c.last.message_type==='audio'?'Voice Note':'Lampiran')) : 'Mulai percakapan baru'}</p></div></button>)}{!conversations.length && <div className="empty-state"><MessageCircle size={28}/><b>Belum ada percakapan</b><p>Tekan tombol + untuk mencari teman.</p></div>}</div></>}
        {homeTab === 'status' && <div className="home-tab-content"><div className="list-heading"><span>Status</span><div className="status-header-actions"><button type="button" onClick={loadStatusFeed} disabled={statusLoading} title="Muat ulang Status"><History size={15}/></button><button type="button" onClick={()=>setShowStatusComposer(true)}><Plus size={15}/>Tambah</button></div></div><div className="status-list">{statusGroups.map(group=>{const latest=group.statuses[group.statuses.length-1];const isMine=group.user_id===session.user.id;const hasUnseen=group.statuses.some(item=>!item.viewed_by_me&&!isMine);return <button type="button" className="status-row" key={group.user_id} onClick={()=>openStatusGroup(group)}><div className={'status-avatar-ring '+(hasUnseen?'unseen':'')}>{group.user?.avatar_url?<img src={group.user.avatar_url} alt=""/>:(displayName(group.user)[0]||'U').toUpperCase()}</div><div className="status-row-info"><b>{isMine?'Status saya':displayName(group.user)}</b><small>{group.statuses.length} status · {new Date(latest.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</small><span>{latest.body || (latest.media_type==='video'?'Video':latest.media_type==='image'?'Foto':'Status')}</span></div>{isMine&&<span className="status-add-mini" onClick={e=>{e.stopPropagation();setShowStatusComposer(true)}}><Plus size={17}/></span>}</button>})}{statusLoading&&!statusGroups.length?<div className="tab-empty">Memuat Status...</div>:!statusGroups.length?<div className="tab-empty"><CircleDot size={34}/><b>Belum ada Status</b><p>Bagikan teks, foto, atau video. Status akan tersedia selama 24 jam.</p><button type="button" className="status-first-add" onClick={()=>setShowStatusComposer(true)}>Buat Status pertama</button></div>:null}</div><input ref={statusMediaInputRef} className="hidden-file-input" type="file" accept="image/*,video/*" onChange={e=>setStatusFile(e.target.files?.[0]||null)}/></div>}
        {homeTab === 'calls' && <div className="home-tab-content"><div className="list-heading"><span>Log Panggilan</span><button type="button" className="text-btn" onClick={loadCallLogs}>Muat ulang</button></div><div className="call-log-list">{callLogsLoading && !callLogs.length ? <div className="tab-empty">Memuat riwayat panggilan...</div> : callLogs.length ? callLogs.map(row => { const outgoing = row.started_by === session.user.id; const durationSeconds = row.started_at && row.ended_at ? Math.max(0, Math.floor((new Date(row.ended_at).getTime() - new Date(row.started_at).getTime()) / 1000)) : null; const durationLabel = durationSeconds === null ? '—' : String(Math.floor(durationSeconds / 60)).padStart(2, '0') + ':' + String(durationSeconds % 60).padStart(2, '0'); const statusLabel = row.status === 'missed' || (row.status === 'ringing' && !outgoing) ? 'Tidak terjawab' : row.status === 'declined' ? 'Ditolak' : row.status === 'ended' ? 'Berakhir' : row.status === 'accepted' ? 'Terhubung' : 'Memanggil'; return <div className="call-log-row" key={row.id}><div className="avatar">{row.peer?.avatar_url ? <img src={row.peer.avatar_url} alt=""/> : (displayName(row.peer)[0] || 'U').toUpperCase()}</div><div className="call-log-info"><b>{displayName(row.peer)}</b><small>{outgoing ? 'Panggilan keluar' : 'Panggilan masuk'} · {row.call_type === 'video' ? 'Video' : 'Suara'}</small><small>{new Date(row.started_at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small><small>Durasi: {durationLabel}</small></div><div className="call-log-result"><b>{statusLabel}</b><small>{row.ended_at ? new Date(row.ended_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : ''}</small></div></div> }) : <div className="tab-empty"><History size={34}/><b>Belum ada panggilan</b><p>Riwayat panggilan akan muncul otomatis di sini.</p></div>}</div></div>}
        <nav className="home-bottom-nav"><button className={homeTab==='chat'?'active':''} onClick={()=>{setHomeTab('chat');setShowSearch(false)}}><MessageCircle size={21}/><span>Chat</span></button><button className={homeTab==='status'?'active':''} onClick={()=>{setHomeTab('status');setShowSearch(false)}}><CircleDot size={21}/><span>Status</span></button><button className={homeTab==='calls'?'active':''} onClick={()=>{setHomeTab('calls');setShowSearch(false)}}><History size={21}/><span>Panggilan</span></button></nav></div>}</aside><section className={'chat-panel ' + (!active ? 'mobile-hidden' : '')}>{active ? <><header className="chat-header"><button className="back-btn" onClick={()=>setActive(null)}><ArrowLeft/></button><div className="avatar">{active.kind==='group'?<Users size={20}/>:active.other?.avatar_url ? <img src={active.other.avatar_url} alt=""/> : (activeName[0] || 'U').toUpperCase()}</div><div className="chat-person"><b>{activeName}</b><small>{active.kind==='group' ? (active.members?.length || 0) + ' anggota grup' : peerTyping ? 'sedang mengetik...' : peerOnline ? 'Online' : active.other?.last_seen_at ? 'Terakhir dilihat ' + new Date(active.other.last_seen_at).toLocaleString('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : 'Waktu terakhir online belum tercatat'}</small></div><div className="chat-actions">{active.kind!=='group' && <><button title="Panggilan suara" onClick={startCall}><Phone/></button><button title="Panggilan video" onClick={startVideoCall}><Video/></button></>}<button title={active.kind==='group'?'Info grup':'Info kontak'} onClick={openChatInfo}>{active.kind==='group'?<Users/>:<MoreVertical/>}</button></div></header><div className="message-area" ref={messageAreaRef} onScroll={trackMessageScroll}>{messages.length ? messages.map(m=><div key={m.id} className={'message-row ' + (m.sender_id === session.user.id ? 'mine' : '')}><div className="bubble">{active.kind==='group' && m.sender_id!==session.user.id && <b className="group-message-sender">{displayName(active.members?.find(member=>member.user_id===m.sender_id)?.profile)}</b>}<div className="message-tools"><button type="button" className="message-action-trigger" title="Opsi pesan" aria-label="Opsi pesan" onClick={()=>setOpenMessageMenu(openMessageMenu===m.id?null:m.id)}><MoreVertical size={16}/></button>{openMessageMenu===m.id && <div className="message-action-menu"><button type="button" onClick={()=>beginReply(m)}><Reply size={15}/>Balas</button>{!m.deleted_at && <button type="button" onClick={()=>{setReactionPickerFor(reactionPickerFor===m.id?null:m.id);setOpenMessageMenu(null)}}>😊 Reaksi</button>}{m.sender_id===session.user.id && !m.deleted_at && m.message_type==='text' && <button type="button" onClick={()=>beginEdit(m)}><Pencil size={15}/>Edit</button>}{m.sender_id===session.user.id && !m.deleted_at && <button type="button" className="danger-action" onClick={()=>deleteMessageForEveryone(m)}><Trash2 size={15}/>Tarik untuk semua</button>}</div>}</div>}{reactionPickerFor===m.id && <div className="message-reaction-picker">{QUICK_REACTIONS.map(emoji=><button type="button" key={emoji} onClick={()=>toggleMessageReaction(m,emoji)}>{emoji}</button>)}</div>}{m.reply_to && <div className="reply-quote"><b>{messages.find(x=>x.id===m.reply_to)?.sender_id===session.user.id?'Anda':active.kind==='group'?displayName(active.members?.find(member=>member.user_id===messages.find(x=>x.id===m.reply_to)?.sender_id)?.profile):active.other?.display_name || 'Pesan'}</b><span>{messages.find(x=>x.id===m.reply_to)?.deleted_at?'Pesan telah dihapus':messages.find(x=>x.id===m.reply_to)?.body || 'Pesan sebelumnya'}</span></div>}{m.deleted_at ? <span className="deleted-message"><em>Pesan ini telah dihapus</em></span> : m.message_type === 'image' && m.media_url ? <a href={m.media_url} target="_blank" rel="noreferrer"><img className="message-image" src={m.media_url} alt={m.body || 'Foto'} onLoad={()=>{if(initialChatScrollRef.current===active?.id){const area=messageAreaRef.current;if(area)area.scrollTop=area.scrollHeight}}} /></a> : m.message_type === 'file' && m.media_mime_type?.startsWith('audio/') && m.media_url ? <div className="voice-note-player"><audio controls preload="metadata" src={m.media_url}/><small>{m.body || 'Voice Note'}</small></div> : m.message_type === 'file' ? <a className="file-attachment" href={m.media_url || '#'} target="_blank" rel="noreferrer"><FileText size={18}/><span>{m.body || 'Unduh file'}</span></a> : m.body}{(m.reactions||[]).length>0 && <div className="message-reactions">{[...new Set(m.reactions.map(item=>item.emoji))].map(emoji=>{const count=m.reactions.filter(item=>item.emoji===emoji).length;const mine=m.reactions.some(item=>item.emoji===emoji&&item.user_id===session.user.id);return <button type="button" key={emoji} className={mine?'reacted':''} onClick={()=>toggleMessageReaction(m,emoji)}>{emoji}<span>{count}</span></button>})}</div>}<div className="message-meta">{m.edited_at && !m.deleted_at ? <span className="edited-label">diedit</span> : null}{new Date(m.created_at).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}{m.sender_id === session.user.id && active.kind==='group' && <span className="group-read-count">Dibaca {groupReadMembers.filter(member=>member.user_id!==session.user.id && member.last_read_at && new Date(member.last_read_at)>=new Date(m.created_at)).length}/{Math.max(0,groupReadMembers.filter(member=>member.user_id!==session.user.id).length)}</span>}{m.sender_id === session.user.id && active.kind!=='group' && (peerReadAt && new Date(peerReadAt) >= new Date(m.created_at) ? <CheckCheck className="read-check" size={14}/> : <Check size={14}/>)}</div></div></div>) : <div className="chat-empty"><div className="brand-mark"><MessageCircle/></div><b>Mulai percakapan</b><p>Kirim pesan pertama Anda.</p></div>}</div><form className="composer" onSubmit={sendMessage}>{(replyTarget || editingMessage) && <div className="composer-context"><div><b>{editingMessage ? "Mengedit pesan" : "Membalas " + (replyTarget.sender_id===session.user.id ? "pesan Anda" : (active.other?.display_name || "pesan"))}</b><span>{editingMessage ? "Ubah teks lalu simpan." : replyTarget.body || "Lampiran"}</span></div><button type="button" title="Batal" onClick={()=>{setReplyTarget(null);setEditingMessage(null);setDraft("")}}><X size={17}/></button></div>}<div className="emoji-picker-wrap" ref={emojiPickerRef}><button type="button" title="Emoji" aria-label="Buka pemilih emoji" onClick={()=>setShowEmojiPicker(value=>!value)}><Smile/></button>{showEmojiPicker && <div className="emoji-picker-panel" role="group" aria-label="Pilih emoji">{CHAT_EMOJIS.map(emoji=><button type="button" key={emoji} onClick={()=>{setDraft(value=>value+emoji);setShowEmojiPicker(false);broadcastTyping(true)}}>{emoji}</button>)}</div>}</div><button type="button" className={'voice-record-btn ' + (recordingVoiceNote ? 'recording' : '')} title={recordingVoiceNote ? 'Hentikan dan kirim Voice Note' : 'Rekam Voice Note'} aria-label={recordingVoiceNote ? 'Hentikan rekaman' : 'Rekam Voice Note'} disabled={uploadBusy} onClick={recordingVoiceNote ? stopVoiceRecording : startVoiceRecording}>{recordingVoiceNote ? <><Square size={15}/><span>{formatVoiceDuration(recordingSeconds)}</span></> : <Mic size={19}/>}</button><div className="attachment-picker-wrap" ref={attachmentPickerRef}><button type="button" title="Lampiran" aria-label="Buka pilihan lampiran" disabled={uploadBusy} onClick={()=>setShowAttachmentMenu(v=>!v)}><Paperclip/></button>{showAttachmentMenu && <div className="attachment-menu"><button type="button" onClick={()=>{setShowAttachmentMenu(false);cameraInputRef.current?.click()}}><Camera size={19}/><span>Kamera</span></button><button type="button" onClick={()=>{setShowAttachmentMenu(false);attachmentInputRef.current?.click()}}><FolderOpen size={19}/><span>File</span></button><button type="button" onClick={()=>{setShowAttachmentMenu(false);shareCurrentLocation()}}><MapPin size={19}/><span>Bagikan lokasi</span></button><button type="button" onClick={()=>{setShowAttachmentMenu(false);galleryInputRef.current?.click()}}><Images size={19}/><span>Galeri</span></button></div>}</div><input ref={cameraInputRef} className="hidden-file-input" type="file" accept="image/*" capture="environment" onChange={e=>handleAttachmentFiles(e.target.files)}/><input ref={attachmentInputRef} className="hidden-file-input" type="file" onChange={e=>handleAttachmentFiles(e.target.files)}/><input ref={galleryInputRef} className="hidden-file-input" type="file" accept="image/*,video/*" multiple onChange={e=>handleAttachmentFiles(e.target.files)}/><input value={draft} onChange={e=>{setDraft(e.target.value);if(!editingMessage)broadcastTyping(!!e.target.value.trim())}} placeholder={uploadBusy ? 'Mengunggah...' : editingMessage ? 'Edit pesan...' : 'Tulis pesan...'} /><button className="send-btn" type="submit" disabled={!draft.trim()}>{editingMessage ? <Save size={19}/> : <Send size={19}/>}</button></form></> : <div className="welcome-panel"><div className="welcome-art"><MessageCircle size={54}/></div><h2>Selamat datang di ChatWave</h2><p>Pilih percakapan atau cari teman untuk mulai mengobrol.</p><span>PRIVATE · SIMPLE · CONNECTED</span></div>}</section>{showAddGroupMembers && active?.kind==='group' && <div className="group-composer-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!groupManageBusy){setShowAddGroupMembers(false);setGroupMemberIds([]);setPeople([]);setSearch('')}}}><section className="group-composer-card"><header><div><span>CHATWAVE GROUP</span><h2>Tambah anggota</h2></div><button type="button" disabled={groupManageBusy} onClick={()=>{setShowAddGroupMembers(false);setGroupMemberIds([]);setPeople([]);setSearch('')}}><X size={19}/></button></header><div className="group-member-count"><b>Pilih anggota baru</b><span>{groupMemberIds.length} dipilih</span></div><div className="group-search"><Search size={16}/><input value={search} onChange={e=>{setSearch(e.target.value);findPeople(e.target.value)}} placeholder="Cari username atau nama..."/></div><div className="group-people-list">{people.filter(person=>!(active.members||[]).some(member=>member.user_id===person.id)).map(person=>{const selected=groupMemberIds.includes(person.id);return <button type="button" key={person.id} className={'group-person-row '+(selected?'selected':'')} onClick={()=>toggleGroupMember(person)}><div className="avatar">{person.avatar_url?<img src={person.avatar_url} alt=""/>:(displayName(person)[0]||'U').toUpperCase()}</div><div><b>{displayName(person)}</b><small>@{person.username||'pengguna'}</small></div><span className={'group-select-check '+(selected?'checked':'')}>{selected?'✓':'+'}</span></button>})}{!people.filter(person=>!(active.members||[]).some(member=>member.user_id===person.id)).length && <div className="group-empty-hint">Cari pengguna yang belum menjadi anggota grup.</div>}</div><footer><button type="button" disabled={groupManageBusy} onClick={()=>{setShowAddGroupMembers(false);setGroupMemberIds([]);setPeople([]);setSearch('')}}>Batal</button><button type="button" disabled={groupManageBusy||!groupMemberIds.length} onClick={addGroupMembers}>{groupManageBusy?'Memproses...':'Tambah ke grup'}</button></footer></section></div>}{showGroupComposer && <div className="group-composer-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!groupBusy){setShowGroupComposer(false);setGroupMemberIds([]);setGroupTitle('')}}}><section className="group-composer-card"><header><div><span>CHATWAVE GROUP</span><h2>Buat grup baru</h2></div><button type="button" disabled={groupBusy} onClick={()=>{setShowGroupComposer(false);setGroupMemberIds([]);setGroupTitle('')}}><X size={19}/></button></header><label>Nama grup<input value={groupTitle} onChange={e=>setGroupTitle(e.target.value)} maxLength={40} placeholder="Contoh: Keluarga, Tim Kerja..." /></label><div className="group-member-count"><b>Pilih anggota</b><span>{groupMemberIds.length} dipilih · maksimal 20 anggota tambahan</span></div><div className="group-search"><Search size={16}/><input value={search} onChange={e=>{setSearch(e.target.value);findPeople(e.target.value)}} placeholder="Cari username atau nama..."/></div><div className="group-people-list">{people.map(person=>{const selected=groupMemberIds.includes(person.id);return <button type="button" key={person.id} className={'group-person-row '+(selected?'selected':'')} onClick={()=>toggleGroupMember(person)}><div className="avatar">{person.avatar_url?<img src={person.avatar_url} alt=""/>:(displayName(person)[0]||'U').toUpperCase()}</div><div><b>{displayName(person)}</b><small>@{person.username||'pengguna'}</small></div><span className={'group-select-check '+(selected?'checked':'')}>{selected?'✓':'+'}</span></button>})}{!people.length && <div className="group-empty-hint">Cari teman di atas, lalu pilih untuk dimasukkan ke grup.</div>}</div><footer><button type="button" disabled={groupBusy} onClick={()=>{setShowGroupComposer(false);setGroupMemberIds([]);setGroupTitle('')}}>Batal</button><button type="button" disabled={groupBusy||groupMemberIds.length<2||groupTitle.trim().length<2} onClick={createGroupConversation}>{groupBusy?'Membuat...':'Buat grup'}</button></footer></section></div>}{showStatusComposer && <div className="status-composer-overlay" onMouseDown={e=>{if(e.target===e.currentTarget&&!statusBusy){setShowStatusComposer(false);setStatusFile(null)}}}><section className="status-composer-card"><header><div><span>CHATWAVE STATUS</span><h2>Buat Status</h2></div><button type="button" onClick={()=>{setShowStatusComposer(false);setStatusFile(null)}} disabled={statusBusy}><X size={19}/></button></header><textarea value={statusDraft} onChange={e=>setStatusDraft(e.target.value)} maxLength={500} placeholder="Apa yang sedang Anda pikirkan?"/><label className="status-audience-control"><span>Siapa yang dapat melihat Status ini?</span><select value={statusAudience} onChange={e=>setStatusAudience(e.target.value)}><option value="contacts">Kontak ChatWave</option><option value="everyone">Semua pengguna ChatWave</option></select></label><div className="status-composer-tools"><button type="button" onClick={()=>statusMediaInputRef.current?.click()} disabled={statusBusy}><Images size={17}/>Pilih foto/video</button><small>{statusDraft.length}/500</small></div>{statusFile && <div className="status-selected-file"><span>{statusFile.name}</span><button type="button" onClick={()=>setStatusFile(null)} disabled={statusBusy}><X size={15}/></button></div>}{!statusFile && <div className="status-color-picker"><span>Warna latar</span>{['#17483b','#234b78','#783f67','#815128','#34435e','#5c416f'].map(color=><button key={color} type="button" aria-label={'Warna '+color} className={statusBackground===color?'selected':''} style={{background:color}} onClick={()=>setStatusBackground(color)}/>)}</div>}<div className="status-composer-actions"><button type="button" onClick={()=>{setShowStatusComposer(false);setStatusFile(null)}} disabled={statusBusy}>Batal</button><button type="button" onClick={publishStatus} disabled={statusBusy||(!statusDraft.trim()&&!statusFile)}>{statusBusy?'Menerbitkan...':'Bagikan Status'}</button></div><small className="status-expiry-note">Status akan hilang otomatis dari daftar setelah 24 jam.</small></section></div>}{viewingStatusGroup && currentViewedStatus && <div className="status-view-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setViewingStatusGroup(null)}}><section className="status-viewer" style={{background:currentViewedStatus.background_color||'#10251f'}}><div className="status-progress">{viewingStatusGroup.statuses.map((item,index)=><span key={item.id} className={index<viewingStatusIndex?'done':index===viewingStatusIndex?'current':''}/>)}</div><header><div className="status-view-owner">{viewingStatusGroup.user?.avatar_url?<img src={viewingStatusGroup.user.avatar_url} alt=""/>:(displayName(viewingStatusGroup.user)[0]||'U').toUpperCase()}<div><b>{viewingStatusGroup.user_id===session.user.id?'Status saya':displayName(viewingStatusGroup.user)}</b><small>{new Date(currentViewedStatus.created_at).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></div></div><div className="status-view-actions">{viewingStatusGroup.user_id===session.user.id && <button type="button" title="Hapus Status" onClick={()=>deleteOwnStatus(currentViewedStatus)}><Trash2 size={17}/></button>}<button type="button" title="Tutup" onClick={()=>setViewingStatusGroup(null)}><X size={20}/></button></div></header><div className="status-view-content">{currentViewedStatus.media_type==='image'&&currentViewedStatus.media_url?<img src={currentViewedStatus.media_url} alt="Status"/>:currentViewedStatus.media_type==='video'&&currentViewedStatus.media_url?<video src={currentViewedStatus.media_url} controls autoPlay playsInline onEnded={advanceStatus}/>:<div className="status-text-content">{currentViewedStatus.body}</div>}{currentViewedStatus.media_type!=='text'&&currentViewedStatus.body&&<p>{currentViewedStatus.body}</p>}</div><button type="button" className="status-view-prev" onClick={()=>moveStatus(-1)} disabled={viewingStatusIndex===0} aria-label="Status sebelumnya"/><button type="button" className="status-view-next" onClick={()=>moveStatus(1)} disabled={viewingStatusIndex===viewingStatusGroup.statuses.length-1} aria-label="Status berikutnya"/><footer>{viewingStatusGroup.user_id===session.user.id?<span>{currentViewedStatus.view_count||0} dilihat</span>:<span>Status berakhir dalam 24 jam</span>}<span>{viewingStatusIndex+1}/{viewingStatusGroup.statuses.length}</span></footer></section></div>}{showChatInfo && active && <div className="chat-info-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowChatInfo(false)}}><section className="chat-info-card"><button type="button" className="chat-info-close" onClick={()=>setShowChatInfo(false)} aria-label="Tutup"><X size={19}/></button>{active.kind==='group'?<><div className="chat-info-avatar"><Users size={27}/></div><h2>{activeName}</h2><p className="chat-info-username">{active.members?.length||0} anggota grup</p><div className="chat-info-divider"/>{active.created_by===session.user.id && <div className="group-info-rename"><input value={groupTitleEdit} onChange={e=>setGroupTitleEdit(e.target.value)} maxLength={40} aria-label="Nama grup"/><button type="button" disabled={groupManageBusy||groupTitleEdit.trim()===active.title} onClick={saveGroupTitle}>Simpan</button></div>}<div className="group-info-actions">{active.created_by===session.user.id && <button type="button" onClick={()=>{setGroupMemberIds([]);setSearch('');setPeople([]);setShowAddGroupMembers(true)}}><UserPlus size={15}/>Tambah anggota</button>}<button type="button" className="danger" disabled={groupManageBusy} onClick={leaveOrDeleteGroup}>{active.created_by===session.user.id?'Hapus grup':'Keluar dari grup'}</button></div><div className="group-member-list">{(active.members||[]).map(member=><div className="group-member-row" key={member.user_id}><div className="avatar">{member.profile?.avatar_url?<img src={member.profile.avatar_url} alt=""/>:(displayName(member.profile)[0]||'U').toUpperCase()}</div><div><b>{member.user_id===session.user.id?'Anda':displayName(member.profile)}</b><small>{member.role==='owner'?'Pemilik grup':member.role==='admin'?'Admin':'Anggota'}</small></div>{active.created_by===session.user.id && member.role!=='owner' && <div className="group-member-actions"><button type="button" title={member.role==='admin'?'Turunkan jadi anggota':'Jadikan admin'} onClick={()=>toggleGroupAdmin(member)}>{member.role==='admin'?'Admin':'Anggota'}</button><button type="button" title="Keluarkan anggota" onClick={()=>removeGroupMember(member)}><X size={14}/></button></div>}</div>)}</div></>:<><div className="chat-info-avatar">{active.other?.avatar_url ? <img src={active.other.avatar_url} alt="Foto profil"/> : (activeName[0] || 'U').toUpperCase()}</div><h2>{activeName}</h2><p className="chat-info-username">@{active.other?.username || 'pengguna'}</p><div className="chat-info-divider"/><div className="chat-info-status"><span className={'chat-info-dot ' + (peerOnline ? 'online' : '')}/>{peerOnline ? 'Sedang online' : 'Tidak sedang online'}</div></>}<button type="button" className="chat-info-done" onClick={()=>setShowChatInfo(false)}>Tutup</button></section></div>}{showProfile && <div className="profile-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setShowProfile(false)}}><section className="profile-modal"><header className="profile-modal-head"><div><span className="profile-kicker">AKUN CHATWAVE</span><h2>Pengaturan Profil</h2></div><button type="button" className="profile-close" onClick={()=>setShowProfile(false)} aria-label="Tutup"><X size={20}/></button></header><form className="profile-form" onSubmit={saveProfile}><div className="avatar-editor"><div className="avatar avatar-large">{profile?.avatar_url ? <img src={profile.avatar_url} alt="Foto profil"/> : <UserRound/>}</div><div><b>Foto profil</b><small>JPG, PNG, WEBP atau GIF · Maks. 5 MB</small><button type="button" className="avatar-upload-btn" disabled={uploadBusy} onClick={()=>avatarInputRef.current?.click()}><Upload size={14}/>{uploadBusy ? 'Mengunggah...' : 'Pilih foto'}</button><input ref={avatarInputRef} className="hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e=>uploadAvatar(e.target.files?.[0])}/></div></div><label>Nama tampilan<input value={editDisplayName} onChange={e=>setEditDisplayName(e.target.value)} maxLength={40} placeholder="Nama yang terlihat di chat" required /></label><p className="field-help">Nama ini akan terlihat oleh teman saat mengobrol.</p><label>Username<input value={editUsername} onChange={e=>setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} minLength={3} maxLength={24} placeholder="contoh: elsaddhai" required /></label><p className="field-help">Dipakai orang lain untuk menemukan akun Anda. 3–24 karakter, huruf kecil, angka, atau _.</p><label>Email akun<input value={session.user.email || ''} disabled /></label><button className="primary-btn profile-save" type="submit" disabled={profileBusy}><Save size={17}/>{profileBusy ? 'Menyimpan...' : 'Simpan perubahan'}</button></form></section></div>}{call && <div className="call-overlay"><section className="call-card"><div className="call-avatar"><Phone size={28}/></div><h2>{activeName}</h2><p>{callStatus||'Panggilan'}</p><div className="call-time">{String(Math.floor(callSeconds/60)).padStart(2,'0')}:{String(callSeconds%60).padStart(2,'0')}</div>{call.call_type==='video'&&<div className="video-call-stage"><video ref={localVideoRef} autoPlay playsInline muted className="local-video"/><video autoPlay playsInline className="remote-video" ref={el=>{if(el&&remoteVideoStream&&el.srcObject!==remoteVideoStream){el.srcObject=remoteVideoStream;el.play().catch(()=>{})}}}/></div>}<audio ref={audioRef} autoPlay playsInline style={{display:'block',width:'100%',marginTop:8}}/><div className="call-route-controls"><button type="button" className={audioRoute==='earpiece'?'route-active':''} disabled={audioRouteBusy} onClick={()=>changeAudioRoute('earpiece')}><PhoneCall size={16}/> Telepon</button><button type="button" className={audioRoute==='speaker'?'route-active':''} disabled={audioRouteBusy} onClick={()=>changeAudioRoute('speaker')}><Volume2 size={16}/> Speaker</button></div><div className="call-controls">{call.started_by!==session.user.id&&call.status==='ringing'?<><button onClick={acceptCall}>Terima</button><button className="end-call" onClick={()=>endCall('declined')}>Tolak</button></>:<><button onClick={toggleMute}>{callMuted?'Aktifkan mic':'Mute mic'}</button><button className="end-call" onClick={()=>endCall('ended')}>Akhiri</button></>}</div></section></div>}{notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}</main>
}