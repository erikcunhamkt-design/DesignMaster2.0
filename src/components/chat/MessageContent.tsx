import ReactMarkdown from 'react-markdown';

/** Renders user message content, replacing [Imagem: URL] with inline previews */
export function UserMessageContent({ content }: { content: string }) {
  const imageRegex = /\[Imagem:\s*(https?:\/\/[^\]]+)\]/g;
  const parts: (string | { type: 'image'; url: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    parts.push({ type: 'image', url: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  // Also handle [Áudio: URL] and [Documento "name": URL]
  const hasMedia = parts.some(p => typeof p !== 'string');
  
  if (!hasMedia && !content.match(/\[Áudio:|Documento "/)) {
    return <p className="whitespace-pre-wrap select-text">{content}</p>;
  }

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (typeof part === 'string') {
          // Check for audio/document tags in remaining text
          const cleaned = part
            .replace(/\[Áudio:\s*(https?:\/\/[^\]]+)\]/g, '')
            .replace(/\[Documento\s*"[^"]*":\s*(https?:\/\/[^\]]+)\]/g, '')
            .trim();
          
          // Render audio players
          const audioMatches = [...part.matchAll(/\[Áudio:\s*(https?:\/\/[^\]]+)\]/g)];
          const docMatches = [...part.matchAll(/\[Documento\s*"([^"]*)":\s*(https?:\/\/[^\]]+)\]/g)];
          
          return (
            <div key={i}>
              {cleaned && <p className="whitespace-pre-wrap select-text">{cleaned}</p>}
              {audioMatches.map((m, j) => (
                <audio key={`audio-${j}`} controls src={m[1]} className="max-w-[250px] mt-1" />
              ))}
              {docMatches.map((m, j) => (
                <a key={`doc-${j}`} href={m[2]} target="_blank" rel="noopener noreferrer" 
                   className="inline-flex items-center gap-1.5 text-xs bg-background/20 rounded-lg px-2 py-1 hover:bg-background/40 transition-colors mt-1">
                  📄 {m[1]}
                </a>
              ))}
            </div>
          );
        }
        return (
          <img
            key={i}
            src={part.url}
            alt="Imagem enviada"
            className="max-w-[200px] max-h-[160px] rounded-lg object-cover cursor-pointer"
            onClick={() => window.open(part.url, '_blank')}
          />
        );
      })}
    </div>
  );
}

/** Renders assistant message with markdown */
export function AssistantMessageContent({ content, proseClasses }: { content: string; proseClasses?: string }) {
  return (
    <div className={proseClasses || "prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
