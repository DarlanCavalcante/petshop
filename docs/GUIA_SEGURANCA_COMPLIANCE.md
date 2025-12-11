# 🔒 GUIA DE SEGURANÇA E COMPLIANCE - Sistema Petshop

**Nível de Acesso:** Segurança / Compliance / Jurídico  
**Setor:** DPO / Segurança da Informação / Legal  
**Última Atualização:** 11/11/2025

---

## 🎯 OBJETIVO DESTE DOCUMENTO

Garantir conformidade com **LGPD (Lei Geral de Proteção de Dados)** e outras regulamentações, além de manter a segurança da informação em todos os níveis do sistema.

---

## 📋 ÍNDICE RÁPIDO

1. [LGPD - Conformidade](#lgpd---conformidade)
2. [Dados Pessoais Armazenados](#dados-pessoais-armazenados)
3. [Direitos dos Titulares](#direitos-dos-titulares)
4. [Segurança Técnica](#segurança-técnica)
5. [Auditoria e Logs](#auditoria-e-logs)
6. [Políticas de Acesso](#políticas-de-acesso)
7. [Incidentes de Segurança](#incidentes-de-segurança)
8. [Checklists de Compliance](#checklists-de-compliance)

---

## ⚖️ LGPD - CONFORMIDADE

### Bases Legais Aplicadas

**Execução de Contrato (Art. 7º, V)**
- Dados de clientes para execução de vendas e serviços

**Legítimo Interesse (Art. 7º, IX)**
- Análise de crédito
- Prevenção de fraudes
- Melhoria de serviços

**Consentimento (Art. 7º, I)**
- Marketing e comunicações
- Compartilhamento com parceiros

### Adequações Implementadas

✅ **Transparência**
- Política de Privacidade disponível
- Termos de Uso claros
- Avisos de coleta de dados

✅ **Segurança**
- Senhas com hash bcrypt
- Comunicação HTTPS obrigatória
- Controle de acesso baseado em funções (RBAC)

✅ **Minimização**
- Apenas dados necessários são coletados
- Campos opcionais marcados claramente

✅ **Qualidade dos Dados**
- Validação de CPF
- Validação de email
- Atualização periódica incentivada

---

## 📊 DADOS PESSOAIS ARMAZENADOS

### Categorização de Dados

#### 1. Dados Pessoais Comuns

**Clientes:**
- Nome completo
- CPF
- Telefone
- Email
- Endereço
- Data de nascimento

**Funcionários:**
- Nome completo
- CPF
- Cargo
- Salário
- Data de admissão

#### 2. Dados Sensíveis

**⚠️ NENHUM dado sensível é coletado atualmente**

Exemplos de dados sensíveis **NÃO coletados:**
- Origem racial/étnica
- Convicção religiosa
- Opinião política
- Dado biométrico
- Dado genético
- Saúde (humana)

**Nota:** Dados de saúde **do pet** não são considerados dados sensíveis de pessoa natural.

#### 3. Dados de Uso

**Logs de Sistema:**
- Endereço IP
- Data/hora de acesso
- Ações realizadas
- User-Agent (navegador)

**Finalidade:** Segurança, detecção de fraudes, auditoria

---

## 👤 DIREITOS DOS TITULARES (Art. 18 LGPD)

### Como Atender Solicitações

#### 1. Confirmação de Tratamento
**Solicitação:** "Vocês têm meus dados?"

**Resposta:**
```
1. Verificar no sistema se CPF existe
2. Responder em até 15 dias
3. Informar quais dados são tratados
```

**Via sistema:**
```sql
-- Apenas Administrador/DPO pode executar
SELECT * FROM clientes WHERE cpf = '12345678900';
```

#### 2. Acesso aos Dados
**Solicitação:** "Quero ver meus dados"

**Processo:**
```
1. Validar identidade (documento com foto)
2. Gerar relatório completo
3. Enviar em até 15 dias
4. Formato legível (PDF)
```

**Dados a incluir:**
- Dados cadastrais
- Histórico de compras
- Agendamentos
- Pets cadastrados
- Data da última atualização

#### 3. Correção de Dados
**Solicitação:** "Meu telefone está errado"

**Processo:**
```
1. Cliente pode corrigir diretamente (futuro: área do cliente)
2. Atendente corrige mediante validação
3. Log de alteração é registrado
```

#### 4. Anonimização/Bloqueio
**Solicitação:** "Quero bloquear meus dados para marketing"

**Processo:**
```
1. Marcar flag no cadastro: marketing_opt_out = TRUE
2. Cliente continua podendo usar serviços
3. Não recebe mais comunicações de marketing
```

#### 5. Eliminação de Dados
**Solicitação:** "Quero deletar minha conta"

**⚠️ IMPORTANTE:**
```
NÃO podemos deletar imediatamente se:
- Existem obrigações legais (NFe, contrato vigente)
- Há débitos pendentes
- Processo judicial em curso
```

**Processo:**
```
1. Verificar impedimentos legais
2. Se OK: anonimizar dados pessoais
3. Manter apenas dados obrigatórios por lei
4. Período de retenção: 5 anos (obrigação fiscal)
```

**Exemplo de anonimização:**
```sql
UPDATE clientes 
SET 
  nome = 'CLIENTE ANONIMIZADO',
  cpf = NULL,
  telefone = NULL,
  email = NULL,
  endereco = NULL,
  data_nascimento = NULL,
  anonimizado = TRUE,
  data_anonimizacao = NOW()
WHERE id = 123;
```

#### 6. Portabilidade
**Solicitação:** "Quero meus dados em formato digital"

**Formato:** JSON ou CSV

**Processo:**
```
1. Gerar export completo
2. Incluir todos os dados estruturados
3. Enviar via email seguro
4. Prazo: 15 dias
```

---

## 🔐 SEGURANÇA TÉCNICA

### Camadas de Segurança Implementadas

#### 1. Autenticação e Autorização

**Senhas:**
- Hash: bcrypt (custo 12)
- Mínimo: 8 caracteres
- Validação: letra + número + especial
- Troca obrigatória: primeiro acesso

**Tokens JWT:**
- Expiração: 24 horas
- Armazenamento: sessionStorage (navegador)
- Refresh: Não implementado (sessão expira)

**Controle de Acesso:**
```
Admin      → Acesso total
Gerente    → Leitura de tudo, escrita limitada
Atendente  → Apenas operações do dia-a-dia
```

#### 2. Rate Limiting

**Proteção contra brute-force:**
```
Login:          5 tentativas/minuto
API Geral:      200 requisições/minuto
Endpoints Admin: 50 requisições/minuto
```

**Bloqueio:**
- Temporário: 5 minutos
- IP é bloqueado automaticamente
- Log de segurança gerado

#### 3. Comunicação Segura

**HTTPS Obrigatório:**
- TLS 1.2+ apenas
- Certificado válido
- HSTS habilitado

**Headers de Segurança:**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

#### 4. Proteção de Dados em Repouso

**Banco de Dados:**
- Senhas: bcrypt hash
- Conexão: TLS/SSL
- Backup: Criptografado

**Arquivos:**
- Logs: JSON estruturado
- Dados sensíveis: Mascarados nos logs

#### 5. Proteção contra Injeções

**SQL Injection:**
- Queries parametrizadas (100%)
- ORM (SQLAlchemy)
- Validação de entrada

**XSS (Cross-Site Scripting):**
- Sanitização de inputs
- Content-Security-Policy
- React (escapa automaticamente)

#### 6. Proteção de Infraestrutura

**Docker:**
- Containers isolados
- Redes privadas
- Secrets gerenciados externamente

**Firewall:**
- Apenas portas necessárias abertas
- IP Whitelist (opcional)

---

## 📋 AUDITORIA E LOGS

### Sistema de Logs

#### Estrutura de Log

**Formato:** JSON estruturado

**Campos obrigatórios:**
```json
{
  "timestamp": "2025-11-11T10:30:45.123Z",
  "level": "INFO",
  "event_type": "security",
  "action": "login_success",
  "user_id": 123,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "message": "Login realizado com sucesso"
}
```

#### Tipos de Eventos Logados

**1. Segurança:**
- Login (sucesso/falha)
- Logout
- Tentativas de acesso não autorizado
- Alteração de senha
- Bloqueio por rate limit

**2. Dados Pessoais:**
- Criação de cliente
- Atualização de dados pessoais
- Exclusão/anonimização
- Exportação de dados (portabilidade)
- Acesso a dados sensíveis

**3. Operações Críticas:**
- Criação/exclusão de usuário
- Alteração de permissões
- Acesso ao banco de dados direto
- Modificação de configurações

**4. Erros:**
- Exceções não tratadas
- Falhas de banco de dados
- Timeout de requisições

### Retenção de Logs

**Período:**
- Logs operacionais: 90 dias
- Logs de segurança: 1 ano
- Logs de acesso a dados pessoais: 5 anos (LGPD)

**Armazenamento:**
- Localização: `/var/log/petshop/`
- Backup diário
- Criptografia em repouso

### Auditoria Manual

**Como acessar logs:**

```bash
# SSH no servidor
ssh admin@servidor

# Logs do dia
cat /var/log/petshop/app-$(date +%Y-%m-%d).log | jq '.'

# Filtrar por tipo
cat app.log | jq 'select(.event_type == "security")'

# Filtrar por usuário
cat app.log | jq 'select(.user_id == 123)'

# Logins falhados
cat app.log | jq 'select(.action == "login_failed")'
```

**Relatório de Auditoria:**

```bash
# Gerar relatório mensal
./scripts/generate_audit_report.sh 2025-11
```

---

## 🚨 INCIDENTES DE SEGURANÇA

### Classificação de Incidentes

#### Nível 1 - Crítico
**Exemplos:**
- Vazamento de dados pessoais
- Acesso não autorizado ao banco
- Ransomware
- DDoS bem-sucedido

**Ação:** Resposta imediata (< 1 hora)

#### Nível 2 - Alto
**Exemplos:**
- Tentativa de invasão detectada
- Vulnerabilidade crítica descoberta
- Perda de backup

**Ação:** Resposta em até 4 horas

#### Nível 3 - Médio
**Exemplos:**
- Login suspeito
- Erro de configuração
- Falha em componente secundário

**Ação:** Resposta em até 24 horas

#### Nível 4 - Baixo
**Exemplos:**
- Alerta falso positivo
- Violação de política menor

**Ação:** Análise em até 72 horas

### Plano de Resposta a Incidentes

**Fase 1: Detecção (0-15 min)**
```
1. Alerta é acionado (automático ou manual)
2. DPO/Segurança é notificado
3. Classificação inicial do incidente
```

**Fase 2: Contenção (15 min - 1 hora)**
```
1. Isolar sistema afetado
2. Bloquear acesso suspeito
3. Preservar evidências (logs, snapshots)
4. Comunicar equipe de resposta
```

**Fase 3: Análise (1-4 horas)**
```
1. Determinar escopo do incidente
2. Identificar dados afetados
3. Verificar se há vazamento
4. Documentar cronologia
```

**Fase 4: Erradicação (4-24 horas)**
```
1. Corrigir vulnerabilidade
2. Remover acessos não autorizados
3. Aplicar patches necessários
4. Restaurar sistemas limpos
```

**Fase 5: Recuperação (24-72 horas)**
```
1. Restaurar operação normal
2. Monitorar comportamento anômalo
3. Verificar integridade dos dados
```

**Fase 6: Notificação (até 72 horas - LGPD)**
```
Se houver vazamento de dados pessoais:

1. Notificar ANPD (Autoridade Nacional)
2. Notificar titulares afetados
3. Publicar comunicado (se necessário)
```

**Fase 7: Lições Aprendidas (pós-incidente)**
```
1. Reunião de análise
2. Documentar o que funcionou/falhou
3. Atualizar procedimentos
4. Implementar melhorias
```

### Template de Notificação ANPD

```
Para: comunicacao@anpd.gov.br
Assunto: Notificação de Incidente de Segurança

Controlador: [Nome da Empresa]
CNPJ: [CNPJ]
DPO: [Nome do DPO]
Email DPO: [email]

Data do Incidente: [data]
Data da Detecção: [data]

Descrição: [Descrever o incidente]

Dados Afetados:
- Tipos de dados: [CPF, email, etc]
- Quantidade de titulares: [número]

Medidas Adotadas:
1. [Ação 1]
2. [Ação 2]

Impacto: [Baixo/Médio/Alto]

Cronologia:
- [timestamp] - [evento]
```

---

## ✅ CHECKLISTS DE COMPLIANCE

### Checklist Mensal

- [ ] Revisar logs de acesso
- [ ] Verificar backups (integridade)
- [ ] Testar restore de backup
- [ ] Atualizar dependências (segurança)
- [ ] Revisar permissões de usuários
- [ ] Verificar certificados SSL (validade)
- [ ] Analisar tentativas de login falhadas
- [ ] Gerar relatório de auditoria

### Checklist Trimestral

- [ ] Revisar Política de Privacidade
- [ ] Atualizar Termos de Uso (se necessário)
- [ ] Treinamento de equipe (LGPD)
- [ ] Simulação de incidente de segurança
- [ ] Auditoria de acessos (usuários inativos)
- [ ] Revisar contratos com fornecedores (DPA)
- [ ] Inventário de dados atualizado

### Checklist Anual

- [ ] Relatório de Impacto (RIPD) completo
- [ ] Auditoria externa de segurança
- [ ] Penetration test
- [ ] Revisão completa de código (vulnerabilidades)
- [ ] Atualização de documentação
- [ ] Renovação de certificados
- [ ] Plano de continuidade de negócio (teste)

---

## 📞 CONTATOS DE EMERGÊNCIA

**DPO (Data Protection Officer):**
- Nome: [Nome do DPO]
- Email: dpo@petshop.com
- Telefone: (XX) 9XXXX-XXXX (24/7)

**Equipe de Segurança:**
- Email: security@petshop.com
- Telefone: (XX) 9XXXX-XXXX

**Fornecedores Críticos:**
- Hosting: [contato]
- Backup: [contato]

**Autoridades:**
- ANPD: comunicacao@anpd.gov.br
- Polícia Federal (Crimes Cibernéticos): 194

---

## 📚 REFERÊNCIAS LEGAIS

- **LGPD:** Lei 13.709/2018
- **Marco Civil da Internet:** Lei 12.965/2014
- **Código de Defesa do Consumidor:** Lei 8.078/1990

**Documentação Complementar:**
- [Guia do Administrador](./GUIA_ADMINISTRADOR.md)
- [Guia do Desenvolvedor](./GUIA_DESENVOLVEDOR.md)

---

**🔒 LEMBRE-SE:**
> "Segurança e privacidade não são opcionais. São obrigações legais e éticas."

---

**Última Atualização:** 11/11/2025  
**Versão:** 2.0.0  
**Próxima Revisão:** 11/02/2026
