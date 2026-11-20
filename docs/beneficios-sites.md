# Benefícios para sites

Este PR adiciona uma campanha determinística de descontos exclusivos para desenvolvimento de sites. Nenhum sorteio, roleta, pagamento ou envio automático de mensagem foi implementado.

## Preços aprovados na conversa

| Plano | Desenvolvimento | Cupom | Final |
| --- | ---: | ---: | ---: |
| Página de apresentação | 1000 | 100 | 900 |
| Site profissional | 1500 | 200 | 1300 |
| Site institucional | 2000 | 300 | 1700 |
| Site com catálogo | 2500 | 400 | 2100 |
| Site completo com atendimento | 3000 | 500 | 2500 |

A fonte dos planos, preços e descontos é `lib/site-plans.mjs`, compartilhada entre a geração HTML e o backend. Valores enviados pelo cliente são ignorados.

- Domínio, hospedagem, manutenção, consumo de IA e terceiros têm orçamento separado.
- Loja virtual, pagamentos, login, agendamento, administração do site vendido e sistemas estão fora dos planos.
- HelenIA do último plano: configuração inicial incluída, consumo à parte.
- Cliente fornece logo, textos informativos e fotos; duas rodadas de ajustes no escopo.
- Cadastro não significa contratação; validade de 30 dias desde a emissão.

## Fluxo

1. Faixa animada no início da home e página Sites leva aos planos, com pausa e respeito à preferência de movimento reduzido.
2. Escolha do plano preenche o formulário, mantendo os dados digitados.
3. POST de nome, celular brasileiro, e-mail, plano, aceite e marketing opcional.
4. Servidor cria um código criptograficamente aleatório e registra as condições em transação.
5. Modal revela o benefício e permite copiar código e abrir mensagem no WhatsApp 5571992438726.
6. Abrir o WhatsApp não ativa nada. Cliente precisa enviar; Camacho confirma manualmente no painel.
7. Pendente → ativo → utilizado. Expirados são bloqueados. Ativar não significa consumir. Uso mantém histórico e impede nova utilização.

## Persistência e segurança

Novo Netlify Database, com migração somente aditiva. A dependência `@netlify/database` permite provisionamento pela plataforma; disponibilidade depende do plano e o serviço pode consumir créditos. Não aplicar migração manualmente em banco hospedado. A integração, o provisionamento e os custos da conta precisam ser verificados no Deploy Preview antes de aprovar produção.

Postgres mantém unicidade de telefone e e-mail por campanha. Ativação/uso bloqueiam a linha na mesma transação e gravam eventos. Não há saldo financeiro nem desconto automático em pagamentos. Mudança de plano após emissão é tratada no orçamento, sem edição silenciosa do registro.

A API pública só emite, sem endpoint para consultar cadastros ou dados de outra pessoa. Dados pessoais não são retornados no resumo do cupom. A mensagem WhatsApp inclui o nome porque o cliente a envia explicitamente. Não há dados pessoais no endereço da página do site. APIs usam no-store, validação de origem, JSON, limite de corpo de 4 KB e consultas parametrizadas. Rate limit Netlify: 5 tentativas por IP/domínio por minuto no cadastro e no login, mais campo anti-bot; não é verificação de titularidade do celular/e-mail.

Painel de cupons exige sessão existente, senha própria configurada e versão de sessão correspondente à senha atual. Sessões antigas ou criadas com senha inicial são recusadas mesmo após troca da senha. Cadastros usam renderização por textContent.

Blobs administrativos preexistentes continuam isolados por deploy no preview. Banco de preview é uma branch do banco: a plataforma pode copiar dados de produção quando já existirem. Não usar dados reais nos testes. Não compartilhar contatos ou credenciais; não registrar payloads em logs. A publicação agora usa `dist`, com lista de arquivos públicos, excluindo funções, migrações, testes e dependências do CDN.

Aviso de privacidade do cadastro incluído; revisar identificação legal do controlador, política de retenção, fornecedores e atendimento de direitos antes do lançamento. Solicitações de exclusão/correção são atendidas manualmente; não há automação de retenção ou painel de exclusão neste escopo. Não há envio de marketing implementado.

## Testes

`npm ci`, `npm test`, `npm run build`.

Testes usam PGlite isolado para executar a migração e consultas PostgreSQL reais, sem banco remoto. Cobrem preços de todos os planos, fraude de valores, unicidade, expiração, estados, auditoria e rollback; testes de funções verificam bloqueio anônimo, sessão inicial/antiga, origem e ausência de listagem pública. PGlite não valida concorrência distribuída ou provisionamento da Netlify; o bloqueio é implementado por `SELECT FOR UPDATE` em Postgres.

`npm run dev` inicia uma prévia de desenvolvimento com banco PGlite em memória e cadastro real nesse banco local. É ferramenta de QA, não backend de produção: métricas e autenticação hospedada não são simuladas. `npm run build` gera o site completo e não modifica as páginas-fonte.

## Roteiro de aceite no Deploy Preview

1. Abra a home: faixa anuncia benefícios e botão leva aos planos.
2. Confira os cinco preços, escopos e exclusões. Teste também `sites.html`, o menu e um celular real.
3. Selecione Resgatar R$ 500: formulário deve selecionar o plano de 3000/500/2500.
4. Cadastre dados de teste, marque condições e deixe marketing desmarcado.
5. Confira código, validade, valor e estado pendente. Feche e use Ver meu cupom para reabrir.
6. Abra WhatsApp apenas se quiser enviar uma mensagem de teste; clicar não ativa o cupom. Confirme o destinatário e os valores antes de enviar.
7. Em `admin.html`, faça login. Preview tem senha/sessões isoladas; altere a senha inicial se solicitado e entre novamente com a nova senha.
8. Atualize cupons: cadastro deve aparecer. Ative após receber a mensagem; depois marque como utilizado apenas para testar o consumo no ambiente de preview. Ações adicionais devem ser bloqueadas.
9. Recarregue o cadastro e repita com mesmo telefone/e-mail: nova emissão deve ser recusada.
10. Sem login, `/api/admin/coupons` deve retornar 401 e nenhum contato.

Produção não deve ser aprovada sem verificar banco hospedado, sessão administrativa e emissão ponta a ponta no preview. Entrega sem merge.
