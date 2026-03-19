

## Problema: Referências de estilo chegam como `blob:` URLs inacessiveis ao backend

### Diagnostico

No `src/pages/Index.tsx` (linha 89), as imagens de referência de estilo (`scenery` e `inspiration`) sao enviadas como URLs cruas (`blob:...`), sem conversão para base64:

```javascript
// Linha 87: subject photos → convertidas para base64 ✅
subjectImages.push(await compressImageToBase64(ref.url, 1024, 0.9));

// Linha 89: style references → blob: URL crua ❌
styleReferenceImages.push(ref.url);
```

No backend (`generate-image/index.ts`, linhas 248-253), o código tenta extrair base64 com regex, mas a URL `blob:` não casa com o pattern `data:...;base64,...`, então a imagem é **silenciosamente ignorada**. O modelo nunca "vê" a referência.

### Solução

**1 arquivo frontend** (`src/pages/Index.tsx`):
- Converter `styleReferenceImages` para base64 usando `compressImageToBase64`, exatamente como já é feito para `subjectImages`
- Aplicar a mesma resolução máxima de 1024px para manter o payload controlado

### Mudança concreta

```text
// ANTES (linha 89):
styleReferenceImages.push(ref.url);

// DEPOIS:
styleReferenceImages.push(await compressImageToBase64(ref.url, 1024, 0.9));
```

### Detalhes técnicos

- `compressImageToBase64` já existe em `src/lib/imageUtils.ts` e produz `data:image/jpeg;base64,...`
- O backend já sabe processar esse formato (regex na linha 249)
- Sem mudanças no backend necessárias
- Impacto: todas as referências de estilo/pose/cenário passarão a ser efetivamente "vistas" pelo modelo Gemini

