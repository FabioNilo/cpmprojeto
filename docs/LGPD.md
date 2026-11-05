# LGPD: dados reais no Sistema Disciplinar CPM

**Situação:** rascunho técnico de 04/11/2026. As decisões marcadas com **A definir** cabem à direção do colégio, com orientação jurídica ou do encarregado de dados. Este documento não é parecer jurídico.

O sistema trata dados reais de cerca de 1.220 alunos, na maioria menores de idade, incluindo histórico disciplinar. O artigo 14 da LGPD exige que o tratamento de dados de crianças e adolescentes atenda ao seu melhor interesse.

## 1. Papéis

| Papel | Quem |
|---|---|
| Controlador | Colégio da Polícia Militar Rômulo Galvão (a formalizar, **A definir**) |
| Encarregado de dados | **A definir** |
| Desenvolvimento e administração técnica | Cap. PM Fábio |
| Fornecedores | Supabase (banco e anexos) e o provedor da VPS usada pelo EasyPanel |

## 2. Dados tratados

| Categoria | Exemplos | Observação |
|---|---|---|
| Alunos | Nome, matrícula, turma | Maioria menor de idade |
| Disciplinares | Ocorrências, decisões, sanções, pontuação, FAD, anexos | Exigem acesso restrito |
| Necessidade especial | Campo `necessidadeEspecial` | Pode ser dado de saúde, portanto sensível (art. 5º, II) |
| Responsáveis e equipe | Nome, CPF, e-mail, telefone, login | Dados pessoais comuns |
| Registros de uso | Auditoria, IP, navegador | Necessários para rastreabilidade |

**A definir:** a base legal de cada categoria (art. 7º e, para dado sensível, art. 11).

## 3. Demonstração com dados reais

Decisão registrada: a demonstração com alunos reais é restrita à **direção do colégio**.

Regras para a demonstração:

1. Apresentar somente a pessoas da direção. Se houver outra pessoa na sala, não usar dados reais.
2. Mostrar apenas o necessário e preferir telas de indicadores às fichas individuais.
3. Usar a conta da própria pessoa que apresenta. Nunca compartilhar login.
4. Não gravar, fotografar, transmitir ou incluir telas em slides.
5. Encerrar a sessão e fechar o navegador ao terminar.
6. Registrar data, participantes e finalidade.

Qualquer público além da direção exige nova decisão, e a demonstração deve usar nomes mascarados ou dados fictícios.

## 4. O que já foi feito

- O manual do usuário deixou de usar telas com alunos reais.
- O manual antigo e a ficha de um aluno real saíram da versão atual do repositório. A cópia local está em `docs/privado/`, fora do git.
- A recuperação de senha não grava mais links no log do servidor.
- O login tem limite de tentativas, as permissões são verificadas no servidor e as ações ficam em auditoria.
- O portal limita cada responsável aos processos dos próprios filhos.

## 5. Pendências

| Prioridade | Pendência | Responsável |
|---|---|---|
| Alta | Remover os PDFs do histórico do GitHub, que ainda os contém | Fábio decide quando |
| Alta | Não distribuir o manual antigo e recolher cópias já enviadas. Avaliar com o encarregado se a circulação exige outra providência | Fábio e direção |
| Alta | Rotacionar credenciais e usar usuário restrito ao schema `cpm` (`docs/DEPLOY.md`, seção 7) | Fábio |
| Alta | Garantir backup testado (`docs/DEPLOY.md`, seção 8) | Fábio |
| Alta | Avaliar a transferência internacional: o banco está nos EUA (`us-west-2`). Verificar o enquadramento no art. 33 ou migrar para São Paulo (`sa-east-1`) | Direção e jurídico |
| Média | Separar este sistema do projeto Supabase usado pelo sistema de custódia de munição | Fábio |
| Média | Definir prazos de retenção (seção 6) | Direção e jurídico |
| Média | Definir como pais e alunos pedem acesso ou correção dos dados (art. 18) | Direção |
| Média | Definir o plano de resposta a incidentes (art. 48) | Direção e encarregado |

## 6. Retenção de dados

**A definir** pela direção, considerando as normas de arquivo aplicáveis. Nenhuma exclusão automática existe hoje, e o Anexo A proíbe apagar fisicamente o histórico disciplinar. Por isso, qualquer prazo precisa conciliar as duas regras.

| Dado | Prazo |
|---|---|
| Processos disciplinares e FAD | A definir |
| Dados de aluno que saiu do colégio | A definir |
| Logs de auditoria | A definir |
| Sessões e tokens expirados | A definir |
| Backups | A definir |

## 7. Em caso de incidente

1. Conter: revogar acessos e trocar as credenciais afetadas.
2. Preservar os registros de auditoria.
3. Avisar a direção e o encarregado imediatamente.
4. Avaliar a comunicação à ANPD e aos titulares (art. 48).
