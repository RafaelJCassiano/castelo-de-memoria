# Castelo da Memória · instalação

App instalável (PWA) com login, sincronização entre aparelhos pelo Supabase e avisos push que chegam com o app fechado. Hospedagem grátis no GitHub Pages.

## O que tem na pasta

| Arquivo | Para que serve |
|---|---|
| `index.html` | o app inteiro |
| `config.js` | **você preenche** com os dados do seu Supabase |
| `sw.js` | funciona sem internet e recebe os avisos push |
| `manifest.webmanifest`, `icon-*.png` | deixam o app instalável |
| `supabase/01_tabelas.sql` | cria as tabelas, as regras de segurança e a sincronização |
| `supabase/functions/send-push/index.ts` | função que manda os avisos e insiste até você resolver |
| `supabase/02_cron.sql` | faz a função rodar a cada minuto |
| `supabase/03_lugares.sql` | cria as tabelas dos lembretes por lugar |

Sem preencher o `config.js`, o app abre normalmente e guarda tudo só no aparelho. Dá para testar assim antes de configurar o Supabase.

## Passo a passo

### 1. Criar o projeto no Supabase
1. Em supabase.com, crie um projeto (plano Free).
2. No **SQL Editor**, cole o conteúdo de `supabase/01_tabelas.sql` e clique em **Run**. Depois faça o mesmo com `supabase/03_lugares.sql`.
3. Em **Authentication > Providers > Email**, desligue **Confirm email**. No plano grátis o envio de e-mails é muito limitado, e assim você entra logo depois de criar a conta.
4. Em **Project Settings > API**, copie a **Project URL** e a chave **anon public**.

### 2. Gerar as chaves do push (VAPID)
No computador, com Node instalado:
```
npx web-push generate-vapid-keys
```
Guarde a chave pública e a privada. A privada nunca vai para o GitHub.

### 3. Preencher o `config.js`
A URL e a chave anon do seu projeto já vêm preenchidas. Falta colocar a **chave pública** do VAPID. As três são feitas para ficar no site, quem protege seus dados são as regras do passo 1.

### 4. Publicar a função de avisos
Na pasta do projeto, no terminal:
```
npx supabase login
npx supabase link --project-ref SEU_PROJETO
npx supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:seu@email.com CRON_SECRET=invente-um-texto-longo
npx supabase functions deploy send-push --no-verify-jwt
```
`SEU_PROJETO` é a parte da URL antes de `.supabase.co`. Guarde o `CRON_SECRET`, ele é usado no próximo passo.

### 5. Agendar a cada minuto
1. Em **Database > Extensions**, ative `pg_cron` e `pg_net`.
2. Abra `supabase/02_cron.sql`, troque `SEU_PROJETO` e `SEU_SEGREDO` (o mesmo `CRON_SECRET`) e rode no SQL Editor.

### 6. Colocar no GitHub Pages
1. Crie um repositório e envie todos os arquivos da pasta.
2. Em **Settings > Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Em um ou dois minutos o app abre em `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/`.

### 7. Usar no celular
1. Abra o endereço no Chrome, crie a conta e entre.
2. Aba **Alertas > Instalar o app**.
3. Ainda em **Alertas**, toque em **Ativar avisos push** e depois em **Enviar aviso de teste**.
4. Repita nos outros aparelhos com a mesma conta. As notas sincronizam sozinhas.

## Como os alertas funcionam agora
- O servidor confere os horários a cada minuto, no fuso do seu aparelho, e manda o aviso mesmo com o app fechado.
- Se a rotina tem desafio (ou "insistir"), ele repete a cada 5 minutos, por até 1 hora, até você resolver dentro do app. Deslizar a notificação não resolve nada.
- Tocar na notificação abre o app já no desafio. Quem encerra o alerta é o app, nunca a notificação.
- Com o app aberto na tela, o alarme aparece dentro dele e o push é silenciado, para não duplicar.
- Lembretes de notas também chegam por push.

## Lembretes por lugar
Na aba **Alertas**, em **Lembretes por lugar**:
1. Crie um lugar. Estando nele, toque em “Usar minha localização atual”. Ou cole as coordenadas do Google Maps (toque e segure o ponto no mapa). O raio vai de 100 a 500 metros.
2. Crie o lembrete: “Bater o ponto”, ao chegar em Trabalho, com o desafio que quiser. Ele usa as mesmas regras de insistência dos alertas por horário.
3. Toque em **Permitir localização**.
4. Use **Testar agora** na edição do lembrete para ver como o alarme aparece.

**Com o app aberto na tela**, o Castelo confere sua posição e dispara ao chegar ou sair. Um site não consegue vigiar a localização com o app fechado. Para isso existe o segundo caminho:

**Com o app fechado**, use **Avisar com o app fechado** (aparece quando você está logado e tem um lugar). Cada lugar ganha um link para “chegar” e outro para “sair”. Um app de automação chama esse link e o Castelo manda o push:
- **Android:** MacroDroid ou Tasker. Gatilho de localização (geofence) no mesmo lugar, ação “Requisição HTTP” do tipo GET com o link.
- **iPhone:** Atalhos > Automação > Chegar (ou Sair) > “Obter conteúdo do URL”.

Os links têm um código secreto. Quem os tiver consegue disparar seus avisos, então não compartilhe. Se vazarem, use **Gerar novos links**. Nos dois caminhos o mesmo lembrete não dispara mais de uma vez a cada 10 minutos, porque o GPS oscila na borda do lugar.

Depois de atualizar os arquivos, rode o `03_lugares.sql`, publique de novo a função (`npx supabase functions deploy send-push --no-verify-jwt`) e lembre de subir o `VERSION` do `sw.js` (já está em `v2`).

## Cuidados
- **Android:** em Configurações > Bateria, deixe o Chrome (ou o app instalado) sem otimização de bateria, senão o sistema pode atrasar avisos.
- **iPhone:** o push só funciona com o app instalado pela tela inicial e iOS 16.4 ou mais novo.
- **Plano grátis:** o Supabase pausa projetos sem uso por cerca de uma semana. Se acontecer, é só reativar no painel.
- **Segredos:** nunca publique a chave `service_role` nem a chave privada do VAPID.
- **Atualizar o app:** depois de mudar o `index.html`, aumente `VERSION` no `sw.js` (de `v1` para `v2`). Sem isso, os aparelhos continuam com a versão guardada.
- **Dados do protótipo do claude.ai:** não passam sozinhos para cá. Se quiser trazer algo, use **Baixar backup** e **Restaurar backup** na aba Alertas.
- O timer "Só 5 minutos" só toca com o app aberto.

## Se algo não funcionar
| Sintoma | O que olhar |
|---|---|
| Tela de login não aparece | `config.js` vazio: o app está no modo local |
| "Não consegui enviar o teste" | a função não foi publicada, ou faltam os segredos do passo 4 |
| Teste chega, mas os alertas não | o cron do passo 5 não foi criado. Veja `select * from cron.job_run_details order by start_time desc limit 10;` |
| Alerta chega no horário errado | confira o fuso do aparelho; ele é salvo na conta ao entrar |
| Notas não aparecem em outro aparelho | confira se entrou com o mesmo e-mail |
| O lembrete por lugar não dispara | com o app fechado só funciona pelo link de automação. Com o app aberto, confira se a localização está liberada e se o raio não é pequeno demais |
| O link de automação responde “link inválido” | o link foi trocado em “Gerar novos links”, ou a função não foi publicada de novo depois da atualização |
