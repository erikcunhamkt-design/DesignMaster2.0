import { useState, useEffect, useCallback } from 'react';
import { Camera, Loader2, AtSign, Check, Shield, Instagram, Linkedin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StudioTopbar } from '@/components/layout/StudioTopbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'seu.usuario' },
  { key: 'behance', label: 'Behance', icon: ExternalLink, placeholder: 'behance.net/usuario' },
  { key: 'tiktok', label: 'TikTok', icon: ExternalLink, placeholder: '@usuario' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'linkedin.com/in/usuario' },
] as const;

type SocialKey = typeof SOCIAL_FIELDS[number]['key'];

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [cargo, setCargo] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [socials, setSocials] = useState<Record<SocialKey, string>>({ instagram: '', behance: '', tiktok: '', linkedin: '' });
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [originalUsername, setOriginalUsername] = useState('');

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    const [{ data: profile }, { data: userRoles }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_roles').select('role').eq('user_id', user.id),
    ]);
    
    if (profile) {
      const p = profile as any;
      setDisplayName(p.display_name || '');
      setUsername(p.username || '');
      setOriginalUsername(p.username || '');
      setAvatarUrl(p.avatar_url || null);
      setCargo(p.cargo || '');
      setTitle(p.title || '');
      setBio(p.bio || '');
      setSocials({
        instagram: p.instagram || '',
        behance: p.behance || '',
        tiktok: p.tiktok || '',
        linkedin: p.linkedin || '',
      });
    }
    
    if (userRoles) {
      setRoles(userRoles.map((r: any) => r.role));
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
    const updates: any = {
      display_name: displayName.trim(),
      bio: bio.trim(),
      instagram: socials.instagram.trim(),
      behance: socials.behance.trim(),
      tiktok: socials.tiktok.trim(),
      linkedin: socials.linkedin.trim(),
    };
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

  const roleLabels: Record<string, { label: string; className: string }> = {
    admin: { label: 'Administrador', className: 'bg-destructive/15 text-destructive border-destructive/20' },
    moderator: { label: 'Moderador', className: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    user: { label: 'Usuário', className: 'bg-primary/15 text-primary border-primary/20' },
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <StudioTopbar title="Meu Perfil" showApiKey={false} />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-8 space-y-6">
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

          {/* Roles & Badges */}
          {(roles.length > 0 || cargo || title) && (
            <div className="space-y-3 p-4 rounded-xl bg-card/50 border border-border/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Poderes & Títulos</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => {
                  const info = roleLabels[role] || roleLabels.user;
                  return (
                    <Badge key={role} variant="outline" className={`text-[10px] font-semibold ${info.className}`}>
                      {info.label}
                    </Badge>
                  );
                })}
                {cargo && (
                  <Badge variant="outline" className="text-[10px] font-semibold bg-primary/15 text-primary border-primary/20">
                    {cargo}
                  </Badge>
                )}
                {title && (
                  <Badge variant="outline" className="text-[10px] font-medium bg-accent/20 text-accent-foreground/70 border-accent/30">
                    {title}
                  </Badge>
                )}
              </div>
            </div>
          )}

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
                  <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                )}
              </div>
              {username.length > 0 && username.length < 3 && (
                <p className="text-[10px] text-amber-500">Mínimo 3 caracteres</p>
              )}
              {usernameAvailable === false && (
                <p className="text-[10px] text-destructive">Já está em uso</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Sobre mim</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                className="min-h-[80px] bg-secondary/30 border-border/20 resize-none"
                maxLength={300}
              />
              <p className="text-[9px] text-muted-foreground/50 text-right">{bio.length}/300</p>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground">Redes sociais</label>
              <div className="space-y-2.5">
                {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <Input
                      value={socials[key]}
                      onChange={(e) => setSocials(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="h-10 pl-9 bg-secondary/30 border-border/20 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

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
