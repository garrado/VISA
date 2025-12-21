# 🔒 SEGURANÇA DO FIREBASE - GUIA RÁPIDO

## Sobre a chave API exposta no código

A chave `AIzaSyDo473puJesZ9rr3IBoX5AWczCIMuKBTrg` que aparece no seu código HTML **é normal** estar exposta para aplicações Firebase Web.

### ✅ Por que isso é seguro?

1. **As chaves do Firebase Web são públicas por design**
   - Elas sempre ficam no código frontend (navegador)
   - Não há como escondê-las completamente

2. **A segurança REAL vem das Regras do Firestore/Database**
   - As regras controlam quem pode ler/escrever dados
   - Mesmo com a chave, ninguém acessa dados sem permissão

## 🛡️ CHECKLIST DE SEGURANÇA

### 1. Regras do Firestore (MAIS IMPORTANTE)

Acesse: https://console.firebase.google.com/project/visam-3a30b/firestore/rules

**✅ SEGURO:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Só usuários autenticados podem ler/escrever
      allow read, write: if request.auth != null;
    }
  }
}
```

**❌ PERIGOSO (NÃO USE):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // ❌ QUALQUER UM PODE ACESSAR!
    }
  }
}
```

### 2. Autenticação

Verifique os métodos habilitados em:
https://console.firebase.google.com/project/visam-3a30b/authentication/providers

**Recomendado:**
- ✅ Google Sign-In (já configurado)
- ✅ Email/Password (se necessário)
- ❌ Anônimo (cuidado com este)

### 3. Regras do Storage (se usar)

Acesse: https://console.firebase.google.com/project/visam-3a30b/storage/rules

**Exemplo seguro:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 📋 Como resolver o alerta do GitHub

1. Acesse: https://github.com/seu-usuario/seu-repo/security
2. Clique no alerta da chave API
3. Escolha uma das opções:
   - **"Dismiss alert"** > **"Won't fix"**
   - Adicione comentário: "Firebase Web API key - protected by Firestore security rules"

## 🚨 QUANDO SE PREOCUPAR

Se você ver no Firebase Console:

1. **Regras abertas**: `allow read, write: if true;`
2. **Uso anormal**: Muitas requisições de IPs desconhecidos
3. **Custos inesperados**: Aumento repentino na fatura

## ✅ VOCÊ ESTÁ SEGURO SE:

- ✅ Regras do Firestore exigem autenticação
- ✅ Apenas usuários autenticados acessam dados
- ✅ Você monitora o uso no Firebase Console

## 📚 Links Úteis

- Firebase Console: https://console.firebase.google.com/project/visam-3a30b
- Documentação de Regras: https://firebase.google.com/docs/firestore/security/get-started
- Boas Práticas: https://firebase.google.com/docs/rules/basics

---

**Resumo:** Não se preocupe com a chave exposta. Foque em manter as **regras do Firestore** bem configuradas!
