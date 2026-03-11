import { useState, useEffect, useCallback } from 'react';
import { Camera, Loader2, ArrowLeft, AtSign, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cargo, setCargo] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      const p = data as any;
      setDisplayName(p.display_name || '');
      setUsername(p.username || '');
      setOriginalUsername(p.username || '');
      setAvatarUrl(p.avatar_url || null);
      setCargo(p.cargo || '');
      setTitle(p.title || '');
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const checkUsername = useCallback(async (name: string) => {
    if (!user || name.length < 3 || name === originalUsername) { setUsernameAvailable(name === originalUsername ? true : null); return; }
    setCheckingUsername(true);
    const { data } = await supabase.from('profiles').select('id').eq('username', name).neq('id', user.id).maybeSingle();
    setUsernameAvailable(!data);
    setCheckingUsername(false);
  }, [user, originalUsername]);

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 20);
    setUsername(clean);
    setUsernameAvailable(null);
    if (clean.length >= 3) {
      const t = setTimeout(() => checkUsername(clean), 400);
      return () => clearTimeout(t);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande (máx 2MB)'); return; }
    setUploadingAvatar(true);
    const ext = file.name.split('.').pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file, { upsert: true });
    if (error) { toast.error('Erro ao enviar imagem'); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
    const url = urlData.publicUrl + '?t=' + Date.now();
    setAvatarUrl(url);
    await supabase.from('profiles').update({ avatar_url: url } as any).eq('id', user.id);
    toast.success('Avatar atualizado!');
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (username.length > 0 && username.length < 3) { toast.error('Username precisa ter no mínimo 3 caracteres'); return; }
    if (username !== originalUsername && usernameAvailable === false) { toast.error('Username já está em uso'); return; }
    if (!displayName.trim()) { toast.error('Nome de exibição é obrigatório'); return; }
    setSaving(true);
    const updates: any = { display_name: displayName.trim() };
    if (username) updates.username = username;
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) {
      if (error.code === '23505') toast.error('Username já em uso');
      else toast.error('Erro ao salvar');
      setSaving(false);
      return;
    }
    toast.success('Perfil atualizado! ✨');
    setOriginalUsername(username);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col bg-background">
        <StudioTopbar title="Meu Perfil" showApiKey={false} />
        <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Meu Perfil" showApiKey={false} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-8 space-y-8">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden border-2 border-border/20">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary">{(displayName || '?').slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin text-foreground" /> : <Camera className="h-5 w-5 text-foreground" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">Clique para alterar o avatar</p>
          </div>

          {/* Fields */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nome de exibição</label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                className="h-11 bg-secondary/30 border-border/20"
                maxLength={50}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Nome de usuário</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"><AtSign className="h-4 w-4" /></span>
                <Input
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="seu.usuario"
                  className="h-11 pl-9 bg-secondary/30 border-border/20"
                  maxLength={20}
                />
                {checkingUsername && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                {!checkingUsername && usernameAvailable === true && username !== originalUsername && (
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                )}
              </div>
              {username.length > 0 && username.length < 3 && (
                <p className="text-[10px] text-amber-500">Mínimo 3 caracteres</p>
              )}
              {usernameAvailable === false && (
                <p className="text-[10px] text-destructive">Já está em uso</p>
              )}
            </div>

            {/* Read-only fields */}
            {(cargo || title) && (
              <div className="space-y-3 p-3 rounded-xl bg-card/40 border border-border/15">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Atribuições (definido por admin)</p>
                {cargo && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">{cargo}</span>
                  </div>
                )}
                {title && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium bg-accent/30 text-accent-foreground/70 px-2 py-0.5 rounded-full">{title}</span>
                  </div>
                )}
              </div>
            )}

            <div className="text-[10px] text-muted-foreground/50">
              E-mail: {user?.email}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
}
