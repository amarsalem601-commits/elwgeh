import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ImagePlus, MessageCircle, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

type AssistantType = 'erp' | 'design';
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; action: Json | null };
type ChatThread = { id: string; title: string; updated_at: string };
type ActionProposal = {
  kind: 'business' | 'design';
  status: 'pending' | 'applying' | 'confirmed' | 'cancelled';
  summary: string;
  operation?: string;
  entity?: string;
  data?: Record<string, Json>;
  before?: Record<string, Json>;
  changes?: Array<{ scope: string; key: string; oldValue?: string; value: string }>;
  theme?: Record<string, string>;
};

const parseAction = (value: Json | null): ActionProposal | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const action = value as Record<string, Json | undefined>;
  if (
    (action.kind !== 'business' && action.kind !== 'design') ||
    (action.status !== 'pending' && action.status !== 'applying' && action.status !== 'confirmed' && action.status !== 'cancelled') ||
    typeof action.summary !== 'string'
  ) return null;

  return {
    kind: action.kind,
    status: action.status,
    summary: action.summary,
    operation: typeof action.operation === 'string' ? action.operation : undefined,
    entity: typeof action.entity === 'string' ? action.entity : undefined,
    data: action.data && typeof action.data === 'object' && !Array.isArray(action.data)
      ? action.data as Record<string, Json>
      : undefined,
    before: action.before && typeof action.before === 'object' && !Array.isArray(action.before)
      ? action.before as Record<string, Json>
      : undefined,
    changes: Array.isArray(action.changes)
      ? action.changes.filter((change): change is { [key: string]: Json | undefined } =>
        Boolean(change && typeof change === 'object' && !Array.isArray(change))
      ).map(change => ({
        scope: typeof change.scope === 'string' ? change.scope : '',
        key: typeof change.key === 'string' ? change.key : '',
        oldValue: typeof change.oldValue === 'string' ? change.oldValue : undefined,
        value: typeof change.value === 'string' ? change.value : '',
      }))
      : undefined,
    theme: action.theme && typeof action.theme === 'object' && !Array.isArray(action.theme)
      ? Object.fromEntries(
        Object.entries(action.theme).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      )
      : undefined,
  };
};

const AssistantChatPage: React.FC = () => {
  const { user, userRole } = useAuth();
  const { lang, isRTL } = useLanguage();
  const { toast } = useToast();
  const [assistantType, setAssistantType] = useState<AssistantType>('erp');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmingActionId, setConfirmingActionId] = useState<string | null>(null);
  const [threadToDelete, setThreadToDelete] = useState<ChatThread | null>(null);
  const [deletingThread, setDeletingThread] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isArabic = lang === 'ar';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!user) return;

    let isCurrent = true;
    const loadLatestConversation = async () => {
      setLoadingHistory(true);
      setThreads([]);
      setActiveThreadId(null);
      setMessages([]);

      const { data: threadData, error: threadError } = await supabase
        .from('ai_assistant_threads')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .eq('assistant_type', assistantType)
        .order('updated_at', { ascending: false });

      if (!isCurrent) return;
      if (threadError) {
        toast({
          title: isArabic ? 'تعذر تحميل المحادثات' : 'Could not load conversations',
          description: threadError.message,
          variant: 'destructive',
        });
        setLoadingHistory(false);
        return;
      }

      const loadedThreads = threadData || [];
      setThreads(loadedThreads);
      const latestThread = loadedThreads[0];
      if (latestThread) {
        setActiveThreadId(latestThread.id);
        const { data: messageData, error: messageError } = await supabase
          .from('ai_assistant_messages')
          .select('id, role, content, action')
          .eq('thread_id', latestThread.id)
          .order('created_at', { ascending: true });

        if (!isCurrent) return;
        if (messageError) {
          toast({
            title: isArabic ? 'تعذر تحميل الرسائل' : 'Could not load messages',
            description: messageError.message,
            variant: 'destructive',
          });
        } else {
          setMessages((messageData || []).filter(
            (message): message is ChatMessage =>
              (message.role === 'user' || message.role === 'assistant') && 'action' in message
          ));
        }
      }
      setLoadingHistory(false);
    };

    loadLatestConversation();
    return () => {
      isCurrent = false;
    };
  }, [assistantType, isArabic, toast, user]);

  const selectThread = async (thread: ChatThread) => {
    setActiveThreadId(thread.id);
    setMessages([]);
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('ai_assistant_messages')
      .select('id, role, content, action')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: isArabic ? 'تعذر تحميل الرسائل' : 'Could not load messages',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setMessages((data || []).filter(
        (message): message is ChatMessage =>
          (message.role === 'user' || message.role === 'assistant') && 'action' in message
      ));
    }
    setLoadingHistory(false);
  };

  const loadThreadMessages = async (threadId: string) => {
    const { data, error } = await supabase
      .from('ai_assistant_messages')
      .select('id, role, content, action')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    setMessages((data || []).filter(
      (message): message is ChatMessage =>
        (message.role === 'user' || message.role === 'assistant') && 'action' in message
    ));
  };

  const handleImageSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      toast({
        title: isArabic ? 'نوع الصورة غير مدعوم' : 'Unsupported image type',
        description: isArabic ? 'استخدم PNG أو JPG أو WEBP.' : 'Use PNG, JPG, or WEBP.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: isArabic ? 'الصورة أكبر من المسموح' : 'Image is too large',
        description: isArabic ? 'الحد الأقصى ٤ ميجابايت.' : 'The maximum size is 4 MB.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast({
        title: isArabic ? 'تعذر قراءة الصورة' : 'Could not read the image',
        variant: 'destructive',
      });
    };
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachment({ name: file.name, dataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim() || (attachment
      ? (isArabic ? 'حلل الصورة المرفقة واقترح التعديل المناسب.' : 'Analyze the attached image and suggest a suitable change.')
      : '');
    if (!content || sending || !user) return;
    if (content.length > 4000) {
      toast({
        title: isArabic ? 'الرسالة طويلة جدًا' : 'Message is too long',
        description: isArabic ? 'الحد الأقصى ٤٠٠٠ حرف.' : 'The maximum length is 4,000 characters.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    let threadId = activeThreadId;
    try {
      if (!threadId) {
        const { data, error } = await supabase
          .from('ai_assistant_threads')
          .insert({
            user_id: user.id,
            assistant_type: assistantType,
            title: (input.trim() || attachment?.name || content).slice(0, 60),
          })
          .select('id, title, updated_at')
          .single();
        if (error) throw error;
        threadId = data.id;
        setActiveThreadId(data.id);
        setThreads(previous => [data, ...previous]);
      }

      const { data: savedMessage, error: saveError } = await supabase
        .from('ai_assistant_messages')
        .insert({
          thread_id: threadId,
          role: 'user',
          content: attachment ? `${content}\n[${isArabic ? 'صورة مرفقة' : 'Image attached'}: ${attachment.name}]` : content,
        })
        .select('id, role, content, action')
        .single();
      if (saveError) throw saveError;

      setInput('');
      const selectedAttachment = attachment;
      setAttachment(null);
      setMessages(previous => [...previous, savedMessage as ChatMessage]);

      const { data: response, error: assistantError } = await supabase.functions.invoke('erp-assistant', {
        body: { threadId, imageDataUrl: selectedAttachment?.dataUrl },
      });
      if (assistantError) throw assistantError;
      if (!response?.reply || typeof response.reply !== 'string') {
        throw new Error(isArabic ? 'لم يصل رد من المساعد.' : 'The assistant returned no response.');
      }

      const { data: updatedMessages, error: reloadError } = await supabase
        .from('ai_assistant_messages')
        .select('id, role, content, action')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (reloadError) throw reloadError;
      setMessages((updatedMessages || []).filter(
        (message): message is ChatMessage =>
          (message.role === 'user' || message.role === 'assistant') && 'action' in message
      ));

      const { data: updatedThread, error: updatedThreadError } = await supabase
        .from('ai_assistant_threads')
        .select('id, title, updated_at')
        .eq('id', threadId)
        .single();
      if (updatedThreadError) throw updatedThreadError;
      if (updatedThread) {
        setThreads(previous => [
          updatedThread,
          ...previous.filter(thread => thread.id !== updatedThread.id),
        ]);
      }
    } catch (error) {
      toast({
        title: isArabic ? 'تعذر إرسال الرسالة' : 'Could not send message',
        description: error instanceof Error ? error.message : (isArabic ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const decideAction = async (message: ChatMessage, decision: 'confirm' | 'cancel') => {
    if (!activeThreadId || confirmingActionId) return;
    setConfirmingActionId(message.id);
    try {
      const { error: insertError } = await supabase
        .from('ai_assistant_messages')
        .insert({
          thread_id: activeThreadId,
          role: 'user',
          content: decision === 'confirm'
            ? (isArabic ? 'أؤكد تنفيذ التغيير المقترح.' : 'I confirm the proposed change.')
            : (isArabic ? 'إلغاء التغيير المقترح.' : 'Cancel the proposed change.'),
        });
      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke('erp-assistant', {
        body: { threadId: activeThreadId, actionMessageId: message.id, decision },
      });
      if (error) throw error;
      if (data?.theme && typeof data.theme === 'object') {
        window.dispatchEvent(new CustomEvent('global-theme-updated', { detail: data.theme }));
      }
      await loadThreadMessages(activeThreadId);
      toast({
        title: data?.reply || (isArabic ? 'تم تحديث حالة المقترح.' : 'Proposal status updated.'),
      });
    } catch (error) {
      toast({
        title: isArabic ? 'تعذر معالجة المقترح' : 'Could not process proposal',
        description: error instanceof Error ? error.message : (isArabic ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'),
        variant: 'destructive',
      });
    } finally {
      setConfirmingActionId(null);
    }
  };

  const deleteThread = async () => {
    if (!threadToDelete || !user || deletingThread) return;
    setDeletingThread(true);
    try {
      const { error } = await supabase
        .from('ai_assistant_threads')
        .delete()
        .eq('id', threadToDelete.id)
        .eq('user_id', user.id);
      if (error) throw error;

      const remainingThreads = threads.filter(thread => thread.id !== threadToDelete.id);
      setThreads(remainingThreads);
      if (activeThreadId === threadToDelete.id) {
        setActiveThreadId(null);
        setMessages([]);
        if (remainingThreads[0]) await selectThread(remainingThreads[0]);
      }
      toast({ title: isArabic ? 'تم حذف المحادثة.' : 'Conversation deleted.' });
      setThreadToDelete(null);
    } catch (error) {
      toast({
        title: isArabic ? 'تعذر حذف المحادثة' : 'Could not delete conversation',
        description: error instanceof Error ? error.message : (isArabic ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.'),
        variant: 'destructive',
      });
    } finally {
      setDeletingThread(false);
    }
  };

  const startNewConversation = () => {
    setActiveThreadId(null);
    setMessages([]);
    setInput('');
    setAttachment(null);
  };

  const assistantTitle = assistantType === 'erp'
    ? (isArabic ? 'مساعد النظام' : 'ERP Assistant')
    : (isArabic ? 'مساعد التصميم' : 'Design Assistant');

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="grid h-full min-h-[420px] grid-cols-1 gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={assistantType === 'erp' ? 'default' : 'outline'}
            className="font-cairo"
            onClick={() => setAssistantType('erp')}
          >
            <MessageCircle className="me-2 h-4 w-4" />
            {isArabic ? 'مساعد النظام' : 'ERP'}
          </Button>
          <Button
            type="button"
            variant={assistantType === 'design' ? 'default' : 'outline'}
            className="font-cairo"
            onClick={() => setAssistantType('design')}
          >
            <Sparkles className="me-2 h-4 w-4" />
            {isArabic ? 'مساعد التصميم' : 'Design'}
          </Button>
        </div>

        <Button type="button" variant="outline" className="mt-3 w-full font-cairo" onClick={startNewConversation}>
          <Plus className="me-2 h-4 w-4" />
          {isArabic ? 'محادثة جديدة' : 'New conversation'}
        </Button>

        <div className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
          <p className="px-2 pb-2 text-xs font-semibold text-muted-foreground">
            {isArabic ? 'المحادثات السابقة' : 'Previous conversations'}
          </p>
          {threads.map(thread => (
            <div key={thread.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => selectThread(thread)}
                className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-start text-sm font-cairo transition-colors ${
                  activeThreadId === thread.id ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                }`}
              >
                {thread.title}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setThreadToDelete(thread)}
                aria-label={isArabic ? `حذف محادثة ${thread.title}` : `Delete conversation ${thread.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!loadingHistory && threads.length === 0 && (
            <p className="px-2 py-2 text-xs text-muted-foreground">
              {isArabic ? 'لا توجد محادثات سابقة' : 'No previous conversations'}
            </p>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-cairo font-bold">{assistantTitle}</h1>
            <p className="text-xs text-muted-foreground">
              {userRole === 'admin'
                ? (isArabic ? 'متاح لمساعدتك في إدارة النظام' : 'Ready to help you with the ERP')
                : (isArabic ? 'مساعدك الذكي حسب صلاحياتك' : 'Your assistant, based on your permissions')}
            </p>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {loadingHistory ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {isArabic ? 'جارٍ تحميل المحادثة...' : 'Loading conversation...'}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <h2 className="font-cairo text-lg font-bold">
                {isArabic ? `أهلًا بك في ${assistantTitle}` : `Welcome to the ${assistantTitle}`}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {assistantType === 'erp'
                  ? (isArabic ? 'اسألني عن استخدام النظام أو تنظيم مهامك اليومية.' : 'Ask me about using the system or organizing your daily work.')
                  : (isArabic ? 'شارك فكرتك وسأساعدك باقتراحات لتصميم صفحات النظام.' : 'Share your idea and I can suggest improvements for the system design.')}
              </p>
            </div>
          ) : (
            messages.map(message => {
              const action = parseAction(message.action);
              return (
                <div key={message.id} className="space-y-2">
                  <div className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                  {action && (
                    <div className={`max-w-[90%] rounded-xl border p-4 ${message.role === 'user' ? 'me-auto' : 'ms-auto'}`}>
                      <p className="font-cairo text-sm font-semibold">{action.summary}</p>
                      {action.data && Object.keys(action.data).length > 0 && (
                        <dl className="mt-2 grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                          {Object.entries(action.data).map(([key, value]) => (
                            <div key={key} className="flex gap-1">
                              <dt className="font-semibold">{key}:</dt>
                              <dd className="break-all">{typeof value === 'string' ? value : JSON.stringify(value)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {action.changes?.map(change => (
                        <p key={`${change.scope}-${change.key}`} className="mt-2 text-xs">
                          {change.key}: {change.oldValue || '—'} → {change.value}
                        </p>
                      ))}
                      {action.status === 'pending' ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => decideAction(message, 'confirm')}
                            disabled={confirmingActionId !== null}
                          >
                            {confirmingActionId === message.id
                              ? (isArabic ? 'جاري التنفيذ...' : 'Applying...')
                              : (isArabic ? 'تأكيد التنفيذ' : 'Confirm and apply')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => decideAction(message, 'cancel')}
                            disabled={confirmingActionId !== null}
                          >
                            {isArabic ? 'إلغاء' : 'Cancel'}
                          </Button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs font-semibold text-muted-foreground">
                          {action.status === 'confirmed'
                            ? (isArabic ? 'تم تأكيد التغيير' : 'Change confirmed')
                            : action.status === 'applying'
                              ? (isArabic ? 'جاري تطبيق التغيير' : 'Change is being applied')
                              : (isArabic ? 'تم إلغاء التغيير' : 'Change cancelled')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {sending && (
            <div className="flex justify-end">
              <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                {isArabic ? 'المساعد يكتب...' : 'Assistant is typing...'}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="border-t border-border p-3 sm:p-4">
          {attachment && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-border p-2">
              <img src={attachment.dataUrl} alt={attachment.name} className="h-14 w-14 rounded object-cover" />
              <span className="min-w-0 flex-1 truncate text-sm">{attachment.name}</span>
              <Button type="button" variant="ghost" size="icon" onClick={() => setAttachment(null)} aria-label={isArabic ? 'إزالة الصورة' : 'Remove image'}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:ring-2 focus-within:ring-primary/30">
            <Textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Write your message...'}
              className="max-h-32 min-h-10 resize-none border-0 shadow-none focus-visible:ring-0"
              maxLength={4000}
              disabled={sending}
            />
            {assistantType === 'design' && (
              <>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleImageSelection}
                  aria-label={isArabic ? 'رفع صورة' : 'Upload image'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-xl"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={sending}
                  aria-label={isArabic ? 'إرفاق صورة' : 'Attach image'}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button type="submit" size="icon" className="shrink-0 rounded-xl" disabled={(!input.trim() && !attachment) || sending}>
              <Send className="h-4 w-4" />
              <span className="sr-only">{isArabic ? 'إرسال' : 'Send'}</span>
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {isArabic
              ? 'أي تغيير سيظهر كمقترح ولن يُطبّق إلا بعد تأكيدك.'
              : 'Changes are proposals and are only applied after your confirmation.'}
          </p>
        </form>
      </section>

      <AlertDialog open={threadToDelete !== null} onOpenChange={open => {
        if (!open && !deletingThread) setThreadToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isArabic ? 'حذف المحادثة؟' : 'Delete conversation?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isArabic
                ? 'سيتم حذف المحادثة ورسائلها نهائيًا من حسابك.'
                : 'This conversation and its messages will be permanently deleted from your account.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingThread}>{isArabic ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={event => {
                event.preventDefault();
                void deleteThread();
              }}
              disabled={deletingThread}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingThread ? (isArabic ? 'جارٍ الحذف...' : 'Deleting...') : (isArabic ? 'حذف المحادثة' : 'Delete conversation')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AssistantChatPage;
