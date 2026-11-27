# Worker de feedback (envio sem conta)

O site é estático, então não pode guardar um token do GitHub. Este Worker da
Cloudflare guarda o token e cria a issue quando alguém usa o botão
**"Enviar sem conta"** da janela de feedback.

Enquanto ele não estiver no ar, o site mostra só o botão **"Abrir no GitHub"**
(que exige conta no GitHub). Nada quebra.

## O que você precisa

- Uma conta gratuita na Cloudflare.
- Um token do GitHub com acesso mínimo (passo 1).
- Node.js instalado (o mesmo usado para `npm test`).

## 1. Criar o token do GitHub

1. No GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. **Repository access**: *Only select repositories* → `interactive-signals-and-systems`.
3. **Permissions → Repository permissions → Issues**: *Read and write*. Nenhuma outra permissão.
4. Defina uma validade e anote a data: quando o token vencer, o envio sem conta para de funcionar até você gerar outro.
5. Copie o token. Ele não deve ser colado em nenhum arquivo do repositório.

## 2. Publicar o Worker

Na pasta `worker/`:

```powershell
npx wrangler login
```

```powershell
npx wrangler secret put GITHUB_TOKEN
```

```powershell
npx wrangler deploy
```

O segundo comando pede o token e o guarda como segredo na Cloudflare. O
terceiro imprime o endereço do Worker, parecido com
`https://sinais-feedback.SEU-USUARIO.workers.dev`.

## 3. Ligar o botão no site

Em `js/feedback-core.js`, preencha a constante com o endereço do passo 2:

```js
export const FEEDBACK_ENDPOINT = 'https://sinais-feedback.SEU-USUARIO.workers.dev';
```

Faça o commit e publique. O botão "Enviar sem conta" passa a aparecer.

## 4. Testar

Abra o site publicado, envie um relato de teste e confira se a issue apareceu
com os rótulos `feedback-site` e o do tipo escolhido. Para testar a partir de
`http://localhost:3000`, acrescente essa origem em `ALLOWED_ORIGINS` no
`wrangler.toml` e publique de novo.

## Proteções que já estão no código

| Proteção | Como funciona |
| --- | --- |
| Origem | Só aceita chamadas das origens em `ALLOWED_ORIGINS`. |
| Campo-isca | Um campo invisível que só robôs preenchem; o relato é descartado. |
| Tamanho | Relato entre 10 e 4000 caracteres; corpo de até 12 kB. |
| Texto neutralizado | `@menções`, referências `#123` e HTML não têm efeito na issue. |
| Limite por IP | Opcional, via binding `RATE_LIMITER` (ver `wrangler.toml`). |
| Privacidade | O Worker não guarda o relato nem o IP. |

A verificação de origem barra o uso a partir de outros sites, mas não impede
alguém de forjar o cabeçalho com um script. Se aparecer spam, ative o limite por
IP; as issues vindas do formulário têm o rótulo `feedback-site`, o que permite
filtrar e fechar em lote. Em último caso, apague o segredo
(`npx wrangler secret delete GITHUB_TOKEN`) e o envio sem conta é desligado na hora.

## Testes

A lógica do Worker é testada junto com o resto do projeto, sem chamar o GitHub:

```powershell
npm test
```
