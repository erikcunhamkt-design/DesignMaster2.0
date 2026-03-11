import { UserPlus, UserCheck, Clock, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  userId: string;
  displayName: string;
  username?: string | null;
  friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
  onAddFriend: () => void;
  onAcceptFriend?: () => void;
  onStartConversation: () => void;
  children: React.ReactNode;
}

export function UserProfilePopover({
  displayName, username, friendStatus,
  onAddFriend, onAcceptFriend, onStartConversation, children,
}: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-3 space-y-3" align="start" side="bottom">
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-foreground">{displayName}</p>
          {username && <p className="text-[11px] text-muted-foreground">@{username}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          {friendStatus === 'none' && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 justify-start" onClick={onAddFriend}>
              <UserPlus className="h-3.5 w-3.5" /> Adicionar amigo
            </Button>
          )}
          {friendStatus === 'pending_sent' && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1.5">
              <Clock className="h-3.5 w-3.5" /> Solicitação enviada
            </div>
          )}
          {friendStatus === 'pending_received' && onAcceptFriend && (
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 justify-start text-primary" onClick={onAcceptFriend}>
              <UserCheck className="h-3.5 w-3.5" /> Aceitar pedido
            </Button>
          )}
          {friendStatus === 'accepted' && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-primary/60 px-2 py-1">
                <UserCheck className="h-3.5 w-3.5" /> Amigos
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 justify-start" onClick={onStartConversation}>
                <MessageCircle className="h-3.5 w-3.5" /> Enviar mensagem
              </Button>
            </>
          )}
          {friendStatus === 'none' && (
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 justify-start" onClick={onStartConversation}>
              <MessageCircle className="h-3.5 w-3.5" /> Enviar mensagem
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
