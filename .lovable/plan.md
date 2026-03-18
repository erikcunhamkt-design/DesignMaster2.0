

## Problema

No `/studio/criador`, ao selecionar uma foto no campo de upload (Sujeito ou Referencia), o arquivo e selecionado mas nao aparece na tela. Nenhum erro ou log e exibido.

## Causa Raiz

A funcao `handleFileSelect` em `SubjectSection.tsx` e `ReferencesSection.tsx` chama `createNormalizedObjectUrl()` (de `imageUtils.ts`), que importa `heic2any` no topo do modulo. Se essa dependencia causar qualquer problema de carregamento ou se a Promise rejeitar, nao ha `try-catch` em lugar nenhum do fluxo -- o erro e engolido silenciosamente e a foto nunca e adicionada ao state.

A session replay confirma: o usuario seleciona o arquivo "chapoline-20959752.jpg", o input recebe o valor e e limpo (handler executou), mas a Promise de `createNormalizedObjectUrl` provavelmente rejeita sem tratamento.

## Plano de Correcao

### 1. Simplificar `createNormalizedObjectUrl` em `src/lib/imageUtils.ts`

Para arquivos nao-HEIC (JPG, PNG, WEBP etc), usar `URL.createObjectURL(file)` diretamente sem passar por `normalizeImageFile`. Manter a conversao HEIC apenas quando necessario, com try-catch:

```typescript
export async function createNormalizedObjectUrl(file: File): Promise<string> {
  if (!isHeicFile(file)) {
    return URL.createObjectURL(file);
  }
  try {
    const blob = await normalizeImageFile(file);
    return URL.createObjectURL(blob);
  } catch (e) {
    console.warn('HEIC conversion failed, using original:', e);
    return URL.createObjectURL(file);
  }
}
```

### 2. Adicionar try-catch em `SubjectSection.tsx` handleFileSelect

Envolver o `Promise.all` com tratamento de erro e toast de feedback:

```typescript
try {
  const newUrls = await Promise.all(selected.map(f => createNormalizedObjectUrl(f)));
  onUpdate({ subjectPhotos: [...config.subjectPhotos, ...newUrls] });
} catch (err) {
  console.error('Erro ao processar foto:', err);
  toast.error('Erro ao processar a imagem. Tente outro formato.');
}
```

### 3. Adicionar try-catch em `ReferencesSection.tsx` handleFileSelect

Mesmo tratamento de erro na secao de referencias.

### 4. Tornar import de heic2any lazy (opcional mas seguro)

Mover o import de `heic2any` para dentro da funcao `normalizeImageFile` usando `import()` dinamico, evitando que um problema de carregamento do modulo quebre todo o `imageUtils.ts`:

```typescript
async function normalizeImageFile(file: File): Promise<Blob> {
  if (!isHeicFile(file)) return file;
  const { default: heic2any } = await import('heic2any');
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  return Array.isArray(result) ? result[0] : result;
}
```

---

**Resumo**: 4 arquivos editados. A correcao principal e o bypass direto com `URL.createObjectURL` para arquivos comuns + try-catch em todos os handlers de upload.

