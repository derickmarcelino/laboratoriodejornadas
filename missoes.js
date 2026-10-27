/* Dados compartilhados entre a página de missões (index.html) e o painel (painel.html). */

/* =========================================================
   MISSÕES — cada uma passa por fricções no app simulado,
   depois por atendimento (Roteamento) e feedback (EscutAI).
   Ação: {l, d?, est?:'item'|'sec', ir?, erro?, cod?, vezes?, irErro?, espera?, ajuda?}
   - erro sem "vezes": acontece sempre; com "vezes": só nas N primeiras tentativas.
   ========================================================= */
const MISSOES = [
{ id:'pix', codinome:'Operação Meia-Noite', rotulo:'PIX', local:'Sua casa', hora:'22h47', urgencia:3, dificuldade:2, titulo:'Pix fora de hora', produto:'Pix', intencao:'pix',
  contexto:'São 22h47. A Júlia pagou o seu ingresso do show e você prometeu devolver o dinheiro hoje.',
  objetivo:'Enviar R$ 1.200 por Pix para a Júlia.',
  entradas:{pix:'p1'},
  telas:{
    p1:{t:'Pix',sub:'Transferir',txt:'Para quem você quer transferir?',campos:[{l:'Chave Pix (e-mail, CPF ou celular)',v:'julia.souza@emial.com'}],
        acoes:[{l:'Continuar',espera:900,erro:'Chave Pix não encontrada. Confira os dados e tente novamente.',cod:'DICT-404',vezes:1,ir:'p2'}]},
    p2:{t:'Pix',sub:'Valor',linhas:[['Para','Júlia Souza'],['Instituição','Banco Digital S.A.']],campos:[{l:'Valor',v:'R$ 1.200,00'}],acoes:[{l:'Continuar',ir:'p3'}]},
    p3:{t:'Pix',sub:'Confirmação',linhas:[['Para','Júlia Souza'],['Valor','R$ 1.200,00'],['Quando','Agora']],campos:[{l:'Senha de 6 dígitos',v:'123456',tipo:'password'}],
        acoes:[{l:'Confirmar Pix',espera:1200,erro:'Valor acima do seu limite Pix noturno. Entre 20h e 6h, o limite por transação é de R$ 1.000,00.',cod:'PIX-LIM-NOT',irErro:'p4'}]},
    p4:{t:'Pix',sub:'Meus limites',linhas:[['Limite diurno','R$ 5.000,00'],['Limite noturno (20h–6h)','R$ 1.000,00']],
        acoes:[{l:'Aumentar limite noturno',espera:900,erro:'Por segurança, o aumento do limite noturno só passa a valer 24 horas após a solicitação.',cod:'PIX-LIM-24H',irErro:'p5'},{l:'Voltar para o Pix',est:'sec',ir:'p3'}]},
    p5:{t:'Pix',sub:'Não concluído',aviso:'Seu Pix não foi enviado.',avisoTipo:'erro',txt:'Não foi possível concluir a transferência.',
        acoes:[{l:'Tentar novamente',ir:'p3'},{l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['À noite, o Pix tem um teto de R$ 1.000 por transação, e o aumento leva 24h por segurança. Proposta: envio agora R$ 1.000 para a Júlia e agendo os R$ 200 restantes para as 6h. Pode ser?',
           'Feito! R$ 1.000 enviados para Júlia Souza e R$ 200 agendados para as 6h. Também deixei registrado o aumento do seu limite noturno, que vale a partir de amanhã.'],
  simples:'à noite o Pix tem um teto de R$ 1.000. Eu mando R$ 1.000 agora e os R$ 200 que faltam saem sozinhos às 6h.'},

{ id:'boleto', codinome:'Operação Apagão', rotulo:'BOLETO', local:'Sua casa', hora:'22h10', urgencia:3, dificuldade:2, titulo:'Conta de luz vencendo', produto:'Pagamento de boletos', intencao:'boleto',
  contexto:'A conta de luz vence hoje e o aviso de corte já chegou. O boleto está em PDF no seu celular. São 22h10.',
  objetivo:'Pagar o boleto da conta de luz hoje.',
  entradas:{pagar:'b1'},
  telas:{
    b1:{t:'Pagar',sub:'Boleto',txt:'Como você quer informar o boleto?',
        acoes:[{l:'Ler código de barras',d:'Use a câmera',est:'item',espera:1500,erro:'Não conseguimos ler o código. Aproxime a câmera ou melhore a iluminação.',cod:'CAM-READ'},
               {l:'Digitar linha digitável',d:'Os números abaixo do código',est:'item',ir:'b2'}]},
    b2:{t:'Pagar',sub:'Linha digitável',campos:[{l:'Linha digitável',v:'83660000001 2 84310162202 4 61004090002 5 10202610153 8'}],
        acoes:[{l:'Continuar',espera:900,erro:'Código inválido. Confira os números digitados.',cod:'BOL-DV',vezes:1,ir:'b3'}]},
    b3:{t:'Pagar',sub:'Confirmação',linhas:[['Beneficiário','Companhia de Energia'],['Vencimento','Hoje'],['Valor','R$ 287,43']],
        aviso:'Pagamentos de boleto após as 22h são processados no próximo dia útil.',
        acoes:[{l:'Pagar agora',espera:1000,erro:'Horário limite excedido. O pagamento será feito amanhã, depois do vencimento.',cod:'BOL-HOR-22H',irErro:'b4'}]},
    b4:{t:'Pagar',sub:'Agendamento',txt:'Deseja agendar o pagamento para o próximo dia útil?',
        acoes:[{l:'Agendar mesmo assim',espera:900,erro:'Não é possível agendar boleto para data posterior ao vencimento. Consulte o beneficiário.',cod:'BOL-VENC'},
               {l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['Depois das 22h, boleto pago pelo código de barras só é processado no dia seguinte, por isso ele venceria. Mas esse boleto tem QR Code Pix: pagando por ele, a baixa é imediata, 24h por dia. Quer que eu faça o pagamento por esse caminho?',
           'Pago! A conta de luz foi quitada hoje, sem juros e sem risco de corte. O comprovante já está no seu app.'],
  simples:'depois das 22h, boleto pelo código de barras só é pago no dia seguinte. Pagando pelo QR Code Pix do próprio boleto, ele é pago na hora.'},

{ id:'investimento', codinome:'Operação Primeiro Passo', rotulo:'INVESTIR', local:'Sofá da sala', hora:'19h30', urgencia:1, dificuldade:2, titulo:'Primeiro investimento', produto:'Investimentos', intencao:'investimento',
  contexto:'Você juntou R$ 3.000 e cansou de deixar o dinheiro parado na conta. Viu um CDB com resgate a qualquer momento.',
  objetivo:'Investir R$ 3.000 no CDB Liquidez Diária.',
  entradas:{investir:'i1'},
  telas:{
    i1:{t:'Investimentos',sub:'Para você',txt:'Recomendados',
        acoes:[{l:'CDB Liquidez Diária',d:'100% do CDI · resgate quando quiser',est:'item',ir:'i2'},
               {l:'Tesouro Selic',d:'Título público · a partir de R$ 150',est:'item',erro:'Produto indisponível no momento. Tente mais tarde.',cod:'TD-503'},
               {l:'Fundo Multimercado',d:'Risco moderado',est:'item',erro:'Este produto não é compatível com o seu perfil de investidor.',cod:'SUIT-INC'}]},
    i2:{t:'CDB Liquidez Diária',sub:'Aplicar',linhas:[['Rentabilidade','100% do CDI'],['Liquidez','Diária'],['Aplicação mínima','R$ 100,00']],campos:[{l:'Valor',v:'R$ 3.000,00'}],
        acoes:[{l:'Aplicar',espera:1000,erro:'Seu perfil de investidor está vencido. Para continuar, responda o questionário de perfil.',cod:'SUIT-EXP',irErro:'i3'}]},
    i3:{t:'Perfil de investidor',sub:'Pergunta 10 de 10',txt:'Por quanto tempo você pretende manter este dinheiro investido?',
        acoes:[{l:'Menos de 1 ano',est:'item',ir:'i4'},{l:'De 1 a 3 anos',est:'item',ir:'i4'},{l:'Mais de 3 anos',est:'item',ir:'i4'}]},
    i4:{t:'Perfil de investidor',sub:'Concluir',txt:'Revise suas respostas e confirme.',
        acoes:[{l:'Salvar respostas',espera:1400,erro:'Não foi possível salvar suas respostas. O questionário será reiniciado.',cod:'SUIT-500',vezes:1,irErro:'i3',ir:'i5'}]},
    i5:{t:'CDB Liquidez Diária',sub:'Termo de ciência',txt:'Declaro que li a lâmina do produto e compreendo a tributação regressiva de IR, a incidência de IOF nos primeiros 30 dias, a cobertura do FGC e o risco de crédito do emissor.',
        acoes:[{l:'Li e concordo',espera:1000,erro:'Sua sessão expirou por segurança. Faça login novamente.',cod:'SESS-401',irErro:'i1'},
               {l:'Não entendi esses termos',est:'sec',ir:'i6'}]},
    i6:{t:'Ajuda',sub:'Investimentos',txt:'Para dúvidas sobre investimentos, consulte a lâmina do produto.',
        acoes:[{l:'Abrir lâmina (PDF, 14 páginas)',erro:'Não foi possível abrir o arquivo.',cod:'PDF-ERR'},{l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['Vou simplificar: o CDB Liquidez Diária rende 100% do CDI, você resgata quando quiser e ele é protegido pelo FGC até R$ 250 mil. O imposto diminui quanto mais tempo o dinheiro fica aplicado. Já reprocessei o seu questionário de perfil, que deu erro ao salvar: ficou como Moderado. Quer seguir com os R$ 3.000?',
           'Aplicação feita! R$ 3.000 no CDB Liquidez Diária. Deixei também um lembrete para conversarmos sobre diversificação quando você quiser.'],
  simples:'é como uma poupança que rende mais: você tira o dinheiro quando quiser, e ele é garantido até R$ 250 mil.'},

{ id:'contestacao', codinome:'Operação Compra Fantasma', rotulo:'CONTESTAR', local:'No trabalho', hora:'14h05', urgencia:2, dificuldade:2, titulo:'Compra que você não fez', produto:'Cartão de crédito', intencao:'contestacao',
  contexto:'Chegou uma notificação: compra de R$ 489,90 em “MKTPLACE*TECHSTORE” no seu cartão. Você não reconhece essa compra.',
  objetivo:'Contestar a compra e não pagar por ela.',
  entradas:{cartoes:'c1'},
  telas:{
    c1:{t:'Cartões',sub:'Fatura atual',linhas:[['Supermercado Bom Preço','R$ 132,40'],['Posto Avenida','R$ 210,00']],
        acoes:[{l:'MKTPLACE*TECHSTORE',d:'Hoje · R$ 489,90 · pendente',est:'item',ir:'c2'}]},
    c2:{t:'Detalhe da compra',linhas:[['Estabelecimento','MKTPLACE*TECHSTORE'],['Valor','R$ 489,90'],['Status','Pendente'],['Cartão','final 4821']],
        acoes:[{l:'Contestar compra',espera:800,erro:'Compras pendentes não podem ser contestadas. Aguarde a confirmação, que pode levar até 5 dias.',cod:'CTS-PEND'},
               {l:'Bloquear cartão',est:'sec',ir:'c3'}]},
    c3:{t:'Bloquear cartão',txt:'Como você quer bloquear?',
        acoes:[{l:'Bloqueio temporário',d:'Você pode desbloquear depois',est:'item',espera:900,ir:'c4'},
               {l:'Cancelar definitivamente',d:'Um novo cartão será emitido',est:'item',erro:'Seu cartão possui débitos automáticos vinculados (streaming, academia). Revise-os antes de cancelar.',cod:'CRT-DEB-AUT'}]},
    c4:{t:'Cartão final 4821',aviso:'Cartão bloqueado temporariamente.',txt:'A compra de R$ 489,90 continua pendente na sua fatura.',
        acoes:[{l:'Contestar compra',espera:800,erro:'Compras pendentes não podem ser contestadas. Aguarde a confirmação, que pode levar até 5 dias.',cod:'CTS-PEND'},
               {l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['No app, compras pendentes ainda não aparecem para contestação, mas eu consigo abrir a contestação agora mesmo. Vi que você já bloqueou o cartão, ótimo. Vou emitir um cartão novo e migrar seus débitos automáticos para ele. Posso seguir?',
           'Contestação aberta! Protocolo 2026-48713. Os R$ 489,90 não serão cobrados enquanto analisamos, e o cartão novo chega em até 7 dias úteis. O cartão virtual já está liberado no app.'],
  simples:'eu abro a contestação daqui, você não paga essa compra enquanto analisamos e eu mando um cartão novo.'},

{ id:'viagem', codinome:'Operação Tango', rotulo:'VIAGEM', local:'Restaurante em Buenos Aires', hora:'21h15', urgencia:3, dificuldade:3, titulo:'Cartão recusado no exterior', produto:'Cartão de crédito', intencao:'viagem',
  contexto:'Você está em Buenos Aires, no caixa do restaurante. A conta deu R$ 380 e o cartão foi recusado. O garçom está esperando.',
  objetivo:'Liberar o cartão para pagar a conta.',
  entradas:{cartoes:'v1'},
  telas:{
    v1:{t:'Cartões',sub:'Cartão final 4821',aviso:'Compra recusada: R$ 380,00 · Buenos Aires',avisoTipo:'erro',
        acoes:[{l:'Configurações do cartão',est:'item',ir:'v2'},
               {l:'Avisar viagem',est:'item',erro:'Essa funcionalidade foi descontinuada. Ajuste o uso no exterior nas configurações do cartão.',cod:'FN-DEPREC'}]},
    v2:{t:'Configurações',sub:'Cartão final 4821',linhas:[['Compras por aproximação','Ativo'],['Compras online','Ativo'],['Uso no exterior','Desativado']],
        acoes:[{l:'Ativar uso no exterior',espera:900,erro:'Para essa alteração, use um dispositivo autorizado. Este celular ainda não está habilitado.',cod:'SEC-DEV',irErro:'v3'}]},
    v3:{t:'Habilitar dispositivo',txt:'Vamos enviar um código por SMS para (61) •••••-1234.',acoes:[{l:'Enviar SMS',espera:1500,ir:'v4'}]},
    v4:{t:'Habilitar dispositivo',txt:'O SMS pode demorar se o seu chip estiver em roaming.',campos:[{l:'Código recebido por SMS',v:''}],
        acoes:[{l:'Validar código',espera:800,erro:'Código inválido ou expirado.',cod:'SMS-EXP'},
               {l:'Reenviar SMS',est:'sec',erro:'Aguarde 5 minutos para solicitar um novo código.',cod:'SMS-WAIT'},
               {l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['Entendi a urgência. Já validei sua identidade por aqui, então você não precisa do SMS. Estou liberando o uso do seu cartão no exterior agora. Pode tentar passar de novo em instantes?',
           'Liberado! O uso internacional fica ativo pelos próximos 30 dias. Dica: o cartão virtual também funciona por aproximação no celular.'],
  simples:'eu libero seu cartão para usar fora do Brasil agora mesmo, sem precisar do SMS.'},

{ id:'limite', codinome:'Operação Geladeira', rotulo:'LIMITE', local:'Loja de eletrodomésticos', hora:'11h20', urgencia:2, dificuldade:2, titulo:'Aumento de limite', produto:'Crédito', intencao:'limite',
  contexto:'Sua geladeira quebrou. A nova custa R$ 4.500 e o limite do seu cartão é de R$ 2.000.',
  objetivo:'Conseguir limite para comprar a geladeira.',
  entradas:{cartoes:'l1'},
  telas:{
    l1:{t:'Cartões',sub:'Limite',linhas:[['Limite total','R$ 2.000,00'],['Disponível','R$ 1.640,00']],acoes:[{l:'Solicitar aumento de limite',est:'item',ir:'l2'}]},
    l2:{t:'Aumento de limite',campos:[{l:'Novo limite desejado',v:'R$ 5.000,00'}],
        acoes:[{l:'Solicitar análise',espera:2200,erro:'Não foi possível aumentar seu limite neste momento.',cod:'CRD-NEG',irErro:'l3'}]},
    l3:{t:'Aumento de limite',aviso:'Solicitação não aprovada.',avisoTipo:'erro',
        acoes:[{l:'Ver motivo',erro:'Informação indisponível. A análise considera diversos critérios internos.',cod:'CRD-MOT'},
               {l:'Tentar um valor menor (R$ 3.000)',espera:1800,erro:'Não foi possível aumentar seu limite. Nova solicitação disponível em 30 dias.',cod:'CRD-NEG-30D'},
               {l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['A análise usou a renda que temos no cadastro, que está desatualizada há mais de 2 anos. Como alternativa imediata, posso liberar um limite emergencial de R$ 3.000 só para compras parceladas, e você compra a geladeira hoje. Quer que eu faça?',
           'Pronto! Limite emergencial liberado. E se você atualizar sua renda no app, uma nova análise do limite fixo sai em até 48h.'],
  simples:'eu libero R$ 3.000 extras só para compras parceladas, e você consegue comprar a geladeira hoje.'},

{ id:'acesso', codinome:'Operação Porta Trancada', rotulo:'ACESSO', local:'Fila do caixa', hora:'09h40', urgencia:2, dificuldade:3, titulo:'Celular novo, app travado', produto:'Acesso ao app', intencao:'acesso',
  contexto:'Você trocou de celular ontem. Instalou o app e precisa ver o saldo antes de pagar o aluguel, que vence hoje.',
  objetivo:'Entrar no app pelo celular novo.',
  inicio:'a1', entradas:{},
  telas:{
    a1:{t:'Bem-vindo',sub:'Entrar',campos:[{l:'Agência',v:'1234-5'},{l:'Conta',v:'98765-4'},{l:'Senha',v:'12345678',tipo:'password'}],
        acoes:[{l:'Entrar',espera:1200,erro:'Este dispositivo não está autorizado. Vamos validar sua identidade.',cod:'DEV-NEW',irErro:'a2'}]},
    a2:{t:'Validação de identidade',sub:'Biometria facial',txt:'Posicione o rosto dentro do círculo.',
        acoes:[{l:'Iniciar biometria',espera:2000,erro:'Não foi possível validar. Tente em um local mais iluminado.',cod:'BIO-FAIL'},
               {l:'Usar outro método',est:'sec',ir:'a3'}]},
    a3:{t:'Validação de identidade',sub:'Código por SMS',txt:'Enviamos um código para o número cadastrado: (11) •••••-0042.',campos:[{l:'Código',v:''}],
        acoes:[{l:'Validar',espera:800,erro:'Código inválido.',cod:'SMS-INV'},
               {l:'Não recebi o código',est:'sec',erro:'Aguarde 5 minutos para solicitar novamente. Se o número estiver desatualizado, procure uma agência.',cod:'SMS-WAIT',irErro:'a4'}]},
    a4:{t:'Validação de identidade',aviso:'Não foi possível validar sua identidade pelo app.',avisoTipo:'erro',
        acoes:[{l:'Encontrar agência próxima',erro:'Ative a localização para continuar.',cod:'GEO-OFF'},{l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['Por segurança, um celular novo precisa ser autorizado. Como a biometria e o SMS falharam, posso validar sua identidade por aqui mesmo, com duas perguntas de segurança. Pode ser?',
           'Identidade validada! Este celular agora está autorizado e o seu saldo já aparece no app. O celular antigo foi desvinculado por segurança.'],
  simples:'eu confirmo que é você com duas perguntas, e o seu celular novo fica liberado.'},

{ id:'tarifa', codinome:'Operação Letra Miúda', rotulo:'TARIFA', local:'No ônibus', hora:'08h15', urgencia:1, dificuldade:1, titulo:'Cobrança misteriosa', produto:'Conta corrente', intencao:'tarifa',
  contexto:'Apareceu um débito de R$ 39,90 escrito “TAR PCT SERV” no seu extrato. Você não lembra de ter contratado nada.',
  objetivo:'Entender a cobrança e parar de pagar por ela.',
  entradas:{extrato:'t1'},
  telas:{
    t1:{t:'Extrato',sub:'Últimos 7 dias',linhas:[['PIX RECEBIDO · ANA','+ R$ 150,00'],['SUPERMERCADO','- R$ 87,20']],
        acoes:[{l:'TAR PCT SERV',d:'Ontem · - R$ 39,90',est:'item',ir:'t2'}]},
    t2:{t:'Lançamento',linhas:[['Descrição','TAR PCT SERV'],['Valor','R$ 39,90'],['Data','Ontem']],acoes:[{l:'Saiba mais sobre esta cobrança',est:'item',ir:'t3'}]},
    t3:{t:'Ajuda',sub:'Perguntas frequentes',txt:'O que é um pacote de serviços?\nPacotes de serviços oferecem um conjunto de serviços bancários por uma tarifa mensal.',
        acoes:[{l:'Como contratar um pacote?',est:'item',ir:'t4'},{l:'Quais pacotes estão disponíveis?',est:'item',ir:'t4'},
               {l:'Cancelar meu pacote',est:'item',espera:900,erro:'Funcionalidade temporariamente indisponível.',cod:'PKG-503'}]},
    t4:{t:'Ajuda',sub:'Pacotes',txt:'Conheça nossos pacotes: Essencial Plus, Conta Fácil, Premium… Contrate agora pelo app!',
        acoes:[{l:'Voltar às perguntas',est:'sec',ir:'t3'},{l:'Isso não responde minha dúvida',ajuda:true}]}
  },
  roteiro:['Esse “TAR PCT SERV” é a mensalidade de um pacote de serviços. Conferi aqui: você usou menos de 10% do que ele oferece. Posso migrar sua conta para os Serviços Essenciais, que são gratuitos, e pedir o estorno das duas últimas cobranças. Quer que eu faça?',
           'Feito! Sua conta passa para os Serviços Essenciais, sem mensalidade, a partir de hoje. O estorno de R$ 79,80 cai em até 2 dias úteis.'],
  simples:'você paga por um pacote que quase não usa. Eu troco por uma opção gratuita e peço o dinheiro de volta.'},

{ id:'golpe', codinome:'Operação Contra-Ataque', rotulo:'GOLPE', local:'No trabalho', hora:'16h32', urgencia:3, dificuldade:3, titulo:'Golpe do Pix', produto:'Pix / Segurança', intencao:'golpe',
  contexto:'Um “amigo” com número novo pediu R$ 800 emprestados e você fez o Pix. Dez minutos depois, o amigo de verdade disse que não foi ele.',
  objetivo:'Tentar recuperar os R$ 800.',
  entradas:{pix:'g1',seguranca:'g4'},
  telas:{
    g1:{t:'Pix',sub:'Área Pix',acoes:[{l:'Comprovantes',est:'item',ir:'g2'},{l:'Devolver um Pix',d:'Para Pix recebidos',est:'item',erro:'Não há Pix recebidos elegíveis para devolução.',cod:'PIX-DEV-0'}]},
    g2:{t:'Comprovante',linhas:[['Para','M. Oliveira'],['Valor','R$ 800,00'],['Quando','Há 12 minutos'],['Instituição','Pagamentos Rápidos IP']],
        acoes:[{l:'Ajuda com este Pix',ir:'g3'},{l:'Compartilhar comprovante',est:'sec',erro:'Não foi possível gerar o PDF.',cod:'PDF-ERR'}]},
    g3:{t:'Ajuda',sub:'Pix',txt:'Fez um Pix por engano? Entre em contato com o recebedor e solicite a devolução.',
        acoes:[{l:'Não foi engano, foi golpe',est:'item',ir:'g4'},{l:'Voltar',est:'sec',ir:'g2'}]},
    g4:{t:'Segurança',sub:'Reportar fraude',campos:[{l:'Descreva o que aconteceu',v:''}],
        acoes:[{l:'Enviar relato',espera:1600,erro:'Erro ao registrar sua solicitação. Tente novamente mais tarde.',cod:'MED-503'},{l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['Sinto muito por isso. Você agiu certo em procurar a gente rápido. Já acionei o MED, o Mecanismo Especial de Devolução do Pix, que bloqueia o valor na conta de quem recebeu, se ainda houver saldo. Só para confirmar: o Pix de R$ 800 foi feito há uns 10 minutos, certo?',
           'Registrado! Protocolo MED 2026-99012. A instituição que recebeu tem até 7 dias para analisar e devolver. Também recomendo registrar um boletim de ocorrência; já te mandei o passo a passo.'],
  simples:'existe um mecanismo do Pix que tenta recuperar o dinheiro na conta de quem recebeu. Eu já acionei.'},

{ id:'seguro', codinome:'Operação Desapego', rotulo:'SEGURO', local:'Sua casa', hora:'20h00', urgencia:1, dificuldade:2, titulo:'Cancelar um seguro', produto:'Seguros', intencao:'seguro',
  contexto:'Você descobriu que paga R$ 29,90 por mês num seguro de celular contratado junto com um empréstimo. E o celular nem é mais o mesmo.',
  objetivo:'Cancelar o seguro de celular.',
  entradas:{seguros:'s1'},
  telas:{
    s1:{t:'Seguros',sub:'Meus seguros',acoes:[{l:'Seguro Celular',d:'R$ 29,90/mês · ativo',est:'item',ir:'s2'}]},
    s2:{t:'Seguro Celular',linhas:[['Aparelho','Smartphone XZ (antigo)'],['Mensalidade','R$ 29,90'],['Contratado','Junto ao Crédito Pessoal']],
        acoes:[{l:'Cancelar seguro',espera:900,erro:'Seguros contratados junto a operações de crédito não podem ser cancelados pelo app.',cod:'SEG-VINC',irErro:'s3'}]},
    s3:{t:'Cancelamento',txt:'Para cancelar, ligue para a Central de Seguros: 0800 000 0000 (seg. a sex., das 8h às 20h).',
        acoes:[{l:'Ligar agora',erro:'Fora do horário de atendimento telefônico.',cod:'TEL-HOR'},{l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['Você pode cancelar a qualquer momento, mesmo tendo contratado junto com um empréstimo, e isso não muda nada no empréstimo. Posso cancelar agora o Seguro Celular, com devolução proporcional do mês. Confirma?',
           'Cancelado! Não haverá novas cobranças, e a devolução de R$ 14,95 cai na sua conta em até 5 dias úteis.'],
  simples:'cancelar o seguro não mexe no seu empréstimo, e você recebe de volta a parte do mês que não usou.'},

{ id:'divida', codinome:'Operação Recomeço', rotulo:'DÍVIDA', local:'Sua casa', hora:'10h00', urgencia:2, dificuldade:2, titulo:'Renegociar a fatura', produto:'Cartão de crédito', intencao:'divida',
  contexto:'Depois de um aperto, você atrasou a fatura do cartão por dois meses. Já está em R$ 2.870 e você quer resolver antes que vire uma bola de neve.',
  objetivo:'Fechar um acordo que caiba no seu bolso.',
  entradas:{cartoes:'d1'},
  telas:{
    d1:{t:'Cartões',sub:'Fatura em atraso',aviso:'Fatura em atraso há 62 dias · R$ 2.870,00',avisoTipo:'erro',
        acoes:[{l:'Negociar dívida',est:'item',espera:1200,ir:'d2'},{l:'Pagar fatura',est:'item',erro:'Saldo insuficiente para o pagamento total.',cod:'SALDO-INS'}]},
    d2:{t:'Negociação',sub:'Proposta',linhas:[['Entrada','R$ 860,00'],['Parcelas','12x de R$ 230,00'],['Total','R$ 3.620,00']],
        acoes:[{l:'Simular sem entrada',espera:1000,erro:'Não há outras condições disponíveis para negociação online.',cod:'NEG-SEM-OPC'},
               {l:'Simular em mais parcelas',espera:1000,erro:'Não há outras condições disponíveis para negociação online.',cod:'NEG-SEM-OPC'},
               {l:'Aceitar proposta',est:'sec',erro:'Saldo insuficiente para pagar a entrada.',cod:'SALDO-INS'},
               {l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['Obrigado por procurar a gente para resolver. Pelo seu histórico, consigo uma condição que não aparece no app: sem entrada, em 18x de R$ 189, com desconto de 40% nos juros de atraso. Cabe no seu orçamento?',
           'Acordo fechado! A primeira parcela vence no dia 10 do mês que vem. Assim que ela for paga, o seu cartão volta a ser liberado aos poucos.'],
  simples:'consigo parcelar sua dívida sem entrada, em parcelas menores e com desconto nos juros.'},

{ id:'cadastro', codinome:'Operação Promoção', rotulo:'RENDA', local:'Novo emprego', hora:'18h45', urgencia:1, dificuldade:1, titulo:'Atualizar a renda', produto:'Cadastro', intencao:'cadastro',
  contexto:'Você conseguiu um emprego novo com salário maior! Quer atualizar sua renda para ter melhores condições de crédito.',
  objetivo:'Atualizar a renda para R$ 8.500.',
  entradas:{perfil:'k1'},
  telas:{
    k1:{t:'Perfil',sub:'Meus dados',linhas:[['Nome','Cliente Teste'],['Renda cadastrada','R$ 4.200,00 (2023)']],acoes:[{l:'Atualizar renda',est:'item',ir:'k2'}]},
    k2:{t:'Atualizar renda',campos:[{l:'Nova renda mensal',v:'R$ 8.500,00'}],
        acoes:[{l:'Anexar comprovante (arquivo)',espera:1200,erro:'O arquivo excede o tamanho máximo de 2 MB.',cod:'UPL-SIZE'},
               {l:'Tirar foto do comprovante',espera:1800,erro:'Documento ilegível. Evite reflexos e envie novamente.',cod:'DOC-OCR',irErro:'k3'}]},
    k3:{t:'Atualizar renda',aviso:'Não foi possível validar seu comprovante.',avisoTipo:'erro',
        acoes:[{l:'Tentar novamente',ir:'k2'},{l:'Falar com o banco',est:'sec',ajuda:true}]}
  },
  roteiro:['O app recusa arquivos acima de 2 MB e fotos com reflexo. Sem problema: você pode me enviar por aqui mesmo, aceito o PDF do contracheque ou da carteira de trabalho digital. Quer que eu gere um link seguro para o envio?',
           'Recebido e validado! Sua renda foi atualizada para R$ 8.500, e uma nova análise de crédito será feita automaticamente em até 48h.'],
  simples:'você me manda o comprovante por aqui, eu valido e atualizo sua renda.'}
];

/* =========================================================
   ROTEAMENTO INTELIGENTE — intenções, palavras-chave e destinos
   ========================================================= */
const INTENCOES = {
  pix:{nome:'Pix · limite e transferência',kw:{'pix':2,'transfer':2,'chave':1,'limite':1,'noturn':3,'madrugada':2,'noite':1,'enviar':1,'mandar':1,'julia':2},destino:{tipo:'ia',area:'Pix'}},
  boleto:{nome:'Pagamento de boleto',kw:{'boleto':3,'codigo de barras':3,'linha digitavel':3,'conta de luz':3,'luz':1,'pagar':1,'pagamento':1,'venc':2,'corte':2,'juros':1,'multa':1},destino:{tipo:'ia',area:'Pagamentos'}},
  investimento:{nome:'Investimentos',kw:{'invest':3,'cdb':3,'tesouro':3,'aplic':2,'rend':2,'perfil':1,'questionario':2,'suitability':3,'poupanca':2,'dinheiro parado':2,'resgat':2,'lamina':2,'risco':1,'imposto':1},destino:{tipo:'humano',area:'Investimentos',nome:'Marina'}},
  contestacao:{nome:'Contestação de compra',kw:{'contest':3,'nao reconheco':3,'nao fiz':3,'desconhecid':3,'indevid':2,'estorn':2,'compra':2,'clonad':3,'pendente':1,'techstore':3,'fatura':1},destino:{tipo:'humano',area:'Contestações',nome:'Rafael'}},
  viagem:{nome:'Cartão no exterior',kw:{'exterior':3,'viagem':3,'viajando':3,'buenos aires':3,'argentina':3,'internacional':3,'recusad':2,'negad':1,'nao passou':2,'restaurante':2,'garcom':2,'cartao':1},destino:{tipo:'humano',area:'Cartões · prioridade',nome:'Beatriz'}},
  limite:{nome:'Aumento de limite de crédito',kw:{'aumento de limite':3,'aumentar o limite':3,'aumentar limite':3,'aumentar meu limite':3,'limite':1,'credito':2,'geladeira':2,'analise':1,'negad':1},destino:{tipo:'ia',area:'Crédito'}},
  acesso:{nome:'Acesso ao app',kw:{'senha':2,'acess':2,'login':3,'entrar':2,'logar':3,'biometri':3,'sms':2,'codigo':1,'celular novo':3,'dispositivo':2,'aparelho':1,'autoriz':2,'saldo':1},destino:{tipo:'ia',area:'Acesso e Segurança'}},
  tarifa:{nome:'Tarifas e pacote de serviços',kw:{'tarifa':3,'taxa':2,'cobranc':2,'cobrad':2,'pacote':3,'mensalidade':2,'debito':1,'nunca contratei':3,'nao contratei':3,'extrato':1,'tar pct':3},destino:{tipo:'ia',area:'Conta e Tarifas'}},
  golpe:{nome:'Golpe / fraude no Pix',kw:{'golpe':4,'golpista':4,'fraude':3,'enganad':3,'nao era ele':3,'nao foi ele':3,'roubad':2,'numero novo':2,'amigo':1,'emprestad':1,'med':2,'recuperar':2},destino:{tipo:'humano',area:'Fraudes · prioridade máxima',nome:'Carlos'}},
  seguro:{nome:'Cancelamento de seguro',kw:{'seguro':3,'cancel':2,'apolice':3,'cobertura':2,'nao quero mais':2},destino:{tipo:'ia',area:'Seguros'}},
  divida:{nome:'Negociação de dívida',kw:{'divida':3,'atrasad':3,'atraso':3,'renegoci':3,'negoci':2,'parcel':1,'entrada':1,'acordo':2,'bola de neve':2,'devendo':3,'nome sujo':3,'negativad':3},destino:{tipo:'humano',area:'Negociação',nome:'Patrícia'}},
  cadastro:{nome:'Atualização cadastral',kw:{'cadastr':3,'renda':3,'salario':2,'comprovante':3,'document':2,'foto':1,'arquivo':2,'upload':2,'atualizar dados':3,'emprego novo':2,'contracheque':3},destino:{tipo:'ia',area:'Cadastro'}}
};

/* Nomes legíveis das emoções detectadas pelo EscutAI */
const EMO_NOME = {frustracao:'Frustração',raiva:'Irritação',ansiedade:'Ansiedade',confusao:'Confusão',tristeza:'Decepção',alivio:'Alívio',satisfacao:'Satisfação',gratidao:'Gratidão'};
const destLabel = d => d.tipo==='ia' ? 'Assistente IA especialista em '+d.area : d.nome+' · Especialista em '+d.area;

/* Pontuação do jogo: etapas concluídas + bônus por obstáculo enfrentado + bônus de rapidez */
function pontuacao(p){ // p: {erros, ajuda, resolvido, avaliou, ms}
  let xp = 100;                              // aceitou e encarou o app
  xp += Math.min(p.erros||0, 8) * 15;        // cada obstáculo enfrentado
  if(p.ajuda) xp += 50;                      // pediu ajuda
  if(p.resolvido) xp += 100;                 // problema resolvido
  if(p.avaliou) xp += 50;                    // deu feedback
  if(p.avaliou && p.ms && p.ms < 4*60*1000) xp += 50; // bônus: concluiu em menos de 4 minutos
  return xp;
}
const NIVEIS = [[0,'Recruta'],[250,'Agente'],[350,'Agente Sênior'],[420,'Especialista em Jornada'],[480,'Lenda do Atendimento']];
const nivel = xp => NIVEIS.filter(n => xp >= n[0]).pop()[1];
