# Como contribuir

Este guia é para quem **nunca usou git**. Dá para ajudar de três jeitos, do mais
fácil para o mais completo. Nenhum deles exige instalar nada.

| Quero... | Caminho | Precisa de conta no GitHub? |
| --- | --- | --- |
| Avisar de um erro ou dar uma ideia | [1. Feedback pelo site](#1-feedback-pelo-site) | Não, quando o envio sem conta estiver ligado |
| Corrigir um texto ou uma fórmula | [2. Corrigir pelo navegador](#2-corrigir-pelo-navegador) | Sim (gratuita) |
| Mexer no código no meu computador | [3. Rodar o projeto](#3-rodar-o-projeto-no-seu-computador) | Sim |

---

## 1. Feedback pelo site

1. Abra o simulador e vá até a tela onde está o problema.
2. Clique em **Feedback**, no canto inferior direito do palco.
3. Escolha o tipo, escreva o que aconteceu e clique no botão de envio.

```text
┌──────────────────────────────────────────────┐
│  Feedback e contribuição                 [✕] │
│                                              │
│  Sobre o que é?                              │
│  (•) Algo não funciona   ( ) Erro na matemá… │
│  ( ) Sugestão ou pedido  ( ) Dúvida          │
│                                              │
│  O que aconteceu ou o que você sugere?       │
│  ┌────────────────────────────────────────┐  │
│  │ No passo 3 o slider trava quando...    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [ Enviar sem conta ]  [ Abrir no GitHub ]   │
└──────────────────────────────────────────────┘
```

O site anexa sozinho o módulo, o passo, o idioma e o tamanho da tela, para
ajudar a reproduzir. Nada além disso é enviado, e você pode conferir em
"O que vai junto com o seu relato".

**Um bom relato de erro tem três partes:** o que você fez, o que esperava e o
que apareceu. Exemplo: *"No módulo de Laplace, passo 2, escolhi a exponencial
anticausal. Esperava a ROC à esquerda do polo, mas ela aparece à direita."*

O relato fica **público** na lista de tarefas do projeto. Não escreva dados
pessoais nele.

---

## 2. Corrigir pelo navegador

O GitHub tem um editor na própria página. Ao salvar, ele cria uma cópia sua do
projeto e monta o pedido de alteração. Você não digita nenhum comando.

### Passo a passo

1. Na janela **Feedback**, role até *"Quer corrigir você mesmo?"* e clique em
   **Editar os textos do site** ou **Editar o módulo atual**.
2. Entre na sua conta do GitHub. Se aparecer o aviso abaixo, clique no botão
   verde: ele cria a sua cópia (isso se chama *fork*).

   ```text
   You need to fork this repository to propose changes.
   [ Fork this repository ]
   ```

3. Edite o texto direto na página.
4. Clique em **Commit changes...** (canto superior direito), escreva em uma
   linha o que você mudou e confirme em **Propose changes**.
5. Na tela seguinte, clique em **Create pull request** e depois em
   **Create pull request** de novo.

```text
 você edita          GitHub cria           professor            entra no site
 na página     →     o pedido (PR)    →    revisa e aceita  →   em alguns minutos
```

Pronto. O professor recebe um aviso, revisa e, se estiver certo, publica.
Se ele pedir um ajuste, a conversa acontece na página do pedido.

### Onde fica cada coisa

| O que você quer mudar | Arquivo |
| --- | --- |
| Botões, títulos e rótulos da interface (português e inglês) | `js/i18n.js` |
| Textos do caderno e fórmulas de Laplace, Z, DTFT, DFT e convolução discreta | `js/modules/<módulo>.js` |
| Textos do caderno de convolução, série de Fourier e CTFT | `js/notebook.js` |
| A matemática de cada módulo | `js/*-engine.js` e `js/math-engine.js` |
| Este guia | `CONTRIBUTING.md` |

### Cuidados com fórmulas

As fórmulas são escritas em LaTeX dentro de textos do JavaScript, e ali cada
barra invertida aparece **dobrada**: `\\frac{1}{s}` no arquivo vira
$\frac{1}{s}$ na tela. Se você apagar uma das barras, a fórmula quebra.

Mude só o que precisa. Uma correção pequena é revisada em minutos; uma grande
demora e pode conflitar com o trabalho de outra pessoa.

---

## 3. Rodar o projeto no seu computador

Para quem quer programar. Precisa de [Node.js](https://nodejs.org) e de git.

```powershell
git clone https://github.com/SEU-USUARIO/interactive-signals-and-systems.git
```

```powershell
cd interactive-signals-and-systems
```

```powershell
node server.js
```

Abra `http://localhost:3000`. Não há etapa de build: é só editar e recarregar.

Antes de enviar, rode os testes:

```powershell
npm test
```

### Convenções

- **Matemática no padrão Lathi/UFPA:** $u(0) = 1/2$, $\operatorname{sinc}(x) = \sin(x)/x$.
- **Um módulo novo é um arquivo** em `js/modules/` com `registerModule({...})`,
  mais um motor sem interface em `js/` e os testes em `tests/`. Use
  `js/modules/laplace.js` como modelo.
- **Toda conta nova ganha teste**, de preferência comparando a forma fechada
  com a integral ou a soma numérica.
- **Textos em português e inglês**, com acentuação correta.
- **Um pedido por assunto.** Não misture correção com mudança de estilo.

---

## Dúvidas

Abra a janela **Feedback** e escolha **Dúvida**, ou escreva em
[Issues](https://github.com/joaosnet/interactive-signals-and-systems/issues).
Não existe pergunta boba: se você travou em um passo deste guia, o guia é que
precisa melhorar.
