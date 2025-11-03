# Debug Storage Helper

## Verificar o que está no Zustand Store

Abra o **Console do Navegador** (F12) e execute:

```javascript
// Ver todo o storage do Zustand
const storage = localStorage.getItem('channel-creation-form')
console.log('📦 Zustand Storage:', JSON.parse(storage))

// Ver especificamente o userWabaConnectionId
const parsed = JSON.parse(storage)
console.log('🔑 userWabaConnectionId:', parsed?.state?.userWabaConnectionId)
```

## Limpar o Storage (se necessário)

```javascript
localStorage.removeItem('channel-creation-form')
console.log('✅ Storage limpo! Recarregue a página.')
```

## Verificar se o código está atualizado

Se você ver o arquivo `index-Cqm9V2yz.js` nos erros, significa que o navegador está usando código em cache.

**Solução:**
1. **Ctrl + Shift + R** (Windows/Linux) ou **Cmd + Shift + R** (Mac) para hard refresh
2. Ou limpar cache do navegador manualmente
3. Ou em modo anônimo/privado

## Build do Frontend

Se ainda não funcionar, rebuild:

```bash
cd ialogus-clinics-frontend
pnpm run build
```
