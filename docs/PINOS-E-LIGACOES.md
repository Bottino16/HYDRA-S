# Pinos e conferência elétrica — UNO R3

**Circuito ainda não validado fisicamente.** Config.h é a fonte dos valores de software. Este desenho pressupõe módulo de relé 5 V ativo em LOW e contatos secos COM/NO/NC. Confira o modelo real, sua pinagem, corrente de bobina, capacidade de contato para carga DC indutiva e jumpers antes de ligar.

| UNO | Componente | Ligação / observação |
| --- | --- | --- |
| A0 | Umidade capacitiva | Saída analógica; faixa 0–5 V; resistor de 100 kΩ para GND como diagnóstico de fio aberto, recalibrando com ele instalado |
| D2 | Boia rio | Fecha para GND com água; LOW significa ativa |
| D3 | Boia mínima poço | Fecha para GND acima do mínimo; LOW ativa |
| D8 | Boia máxima poço | Contato fechado abaixo do máximo, **abre em cheio**; HIGH ativa |
| D9 | Boia mínima caixa | Fecha para GND acima do mínimo; LOW ativa |
| D10 | Boia máxima caixa | Fechado abaixo do máximo, **abre em cheio**; HIGH ativa |
| D7 | IN1 relé | Bomba 1: rio → poço; LOW liga |
| D5 | IN2 relé | Bomba 2: poço → caixa; LOW liga |
| D4 | IN3 relé | Bomba 3: caixa → plantação; LOW liga |
| D6 | Buzzer | Ativo em HIGH; passivo configurável; se corrente exceder GPIO, usar driver/transistor |
| D11 | DHT11 DATA | Pull-up externo conforme módulo/sensor; PCINT3 no porto B |
| A2 (digital 16) | Ultrassônico TRIG | Pulso gerado sem delay, porto C/PC2 |
| A1 (digital 15) | Ultrassônico ECHO | Entrada digital 5 V, PCINT9 no porto C/PC1 |
| D12/D13 | Livres | Sem sensor/relé; D13 pode ter atividade do LED/bootloader |
| D0/D1 | UART USB | Reservados ao monitor/servidor; não conectar bombas ou sensores |
| GND / 5 V | Referência lógica | GND comum entre UNO, sensores e entradas lógicas do módulo conforme seu fabricante |

Todas as boias usam INPUT_PULLUP e contato entre sinal e GND; nunca levam 12 V. Os termos mínima/máxima são os estados lógicos após polaridade, não a leitura HIGH/LOW crua. Se suas boias não permitem a orientação acima, ajuste FLOAT_ACTIVE_LEVEL e repita o teste SEM bombas. Não simplesmente inverta as cores dos fios supondo que isso troca NC/NO.

## Diagrama textual de potência (somente baixa tensão DC)

```text
ADAPTADOR/FONTE 12 V DC certificado
  +12 V → fusível dimensionado → interruptor acessível de corte → barramento +12 V
    barramento → COM1 do relé → NO1 → (+) bomba 1
    barramento → COM2 do relé → NO2 → (+) bomba 2
    barramento → COM3 do relé → NO3 → (+) bomba 3
  0 V  ────────────────────────────────→ (-) das três bombas

Em CADA bomba, diodo em paralelo e próximo ao motor:
  cátodo (lado da faixa) → (+) da bomba, depois do NO
  ânodo                 → (-) da bomba

NC1/NC2/NC3: sem conexão. Canal 4: sem carga; manter entrada inativa conforme módulo.
Não usar D4/D5/D7 como alimentação do motor; eles comandam APENAS entradas de relé.
```

O fusível e a bitola dependem da corrente de partida/travamento e dos cabos; a indicação 12 V/3 A não prova que a fonte suporta nem uma partida. Mantenha MAX_SIMULTANEOUS=1 até medir. Aumentar para 2 exige nova conferência de fonte, relés, diodos, cabos e repetição dos testes. O ensaio virtual com 2 não é aprovação elétrica.

O 1N4007 citado no projeto pertence a uma família de retificadores de 1 A nas condições da ficha; não é garantia de adequação ao motor desconhecido. Confira a corrente e a energia da carga e selecione o diodo com o orientador. Referência: [Vishay 1N4001–1N4007](https://www.vishay.com/docs/88503/1n4001.pdf).

## Sinais do ultrassônico — mapa corrigido na Fase 2

```text
Ultrassônico VCC  → alimentação lógica 5 V compatível com o módulo
Ultrassônico GND  → GND lógico comum
Ultrassônico TRIG → A2 / digital 16 / PC2 (saída)
Ultrassônico ECHO → A1 / digital 15 / PC1 / PCINT9 (entrada)
D13              → livre; não conectar ECHO
A0               → somente solo; ADC0 permanece inalterado
```

A1/A2 são usados como GPIO digitais. A1 tem interrupção de mudança no porto C, separada do DHT11 em D11. O remapeamento remove a conexão de ECHO ao pino do LED/bootloader. Não houve alteração física, upload ou validação real. Ensaios físicos permanecem pausados e o firmware NÃO VALIDADO.

## Alimentação e inicialização

- UNO por USB ou alimentação regulada adequada; sensores e módulo obedecem às tensões de seus fabricantes. **12 V nunca vai a pino 5 V, GPIO ou sensor de 5 V.** Uma alimentação 5 V separada para relés pode ser necessária; não una fontes 5 V em paralelo nem remova/ponha jumper JD-VCC por suposição.
- Quando o módulo tem somente VCC/GND/INx com lógica comum, a referência do módulo e Arduino precisa coincidir. Se há optoisolação real com JD-VCC, siga seu esquema específico. O circuito dos motores através de contatos secos pode permanecer isolado da lógica: não é necessário unir o negativo de 12 V ao GND lógico só porque há relés.
- Instalar polarização externa para manter cada IN ativo LOW em nível de desligamento durante reset/bootloader. Um pull-up de 10 kΩ a 5 V é ponto de partida a conferir no módulo real, não garantia universal. Sem polarização/enable seguro, o software sozinho não garante OFF enquanto o microcontrolador está em alta impedância.
- O sketch escreve HIGH antes de configurar D4/D5/D7 como OUTPUT, mantém 5 s de retenção e exige sensores válidos. Isso complementa, não substitui, a polarização do circuito.
- Ultrassônico fica no topo da caixa olhando para a superfície, sem obstáculos/espuma. Meça distâncias reais em vazio/cheio. A curva de volume depende da geometria: porcentagem de altura não é automaticamente litros.
- Reserve corte físico dos 12 V acessível e coloque eletrônica/conexões fora de respingos. Relé colado não pode ser corrigido por firmware.

Referência da placa: [Arduino UNO R3 — datasheet](https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf). O projeto foi compilado especificamente para UNO R3 ATmega328P, com 2 KB de SRAM; não pressupõe compatibilidade com UNO R4.

## Limites de diagnóstico

Máxima aberta parece “cheio”; isso para enchimento, mas não identifica fio rompido. Um contato travado fechado pode parecer “não cheio” e depender do limite de tempo. Mínima desconectada parece “sem água”. Fio do sensor analógico aberto pode flutuar se não houver polarização externa. Detecção completa exige circuitos de supervisão/diagnóstico adicionais. Não declarar essas falhas detectadas somente porque a simulação possui uma flag de sensor inválido.
