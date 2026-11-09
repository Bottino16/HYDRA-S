#include <DHT.h> // Biblioteca do DHT11
// Configuração do DHT11
#define DHTPIN 10
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
const int sensor = A5;
const int bomba = 7;
const int trig = 9;
const int echo = 8;
const int buzzer = 6;
int valorUmidade;
long duracao;
int distancia;
unsigned long tempoUltimoEnvio = 0; 
void setup() {
  Serial.begin(9600);
  dht.begin(); 
  
  pinMode(bomba, OUTPUT);
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  pinMode(buzzer, OUTPUT);
  
  digitalWrite(bomba, HIGH); // Relé desligado
  digitalWrite(buzzer, LOW); 
}
void bipAviso() {
  for(int i = 0; i < 3; i++) {
    digitalWrite(buzzer, HIGH); delay(150);
    digitalWrite(buzzer, LOW); delay(150);
  }
}
// === FUNÇÃO: FILTRO DE RUÍDO DO ULTRASSÔNICO ===
int lerDistanciaFiltrada() {
  long soma = 0;
  int quantidade_leituras = 5; 
  
  for(int i = 0; i < quantidade_leituras; i++) {
    digitalWrite(trig, LOW); 
    delayMicroseconds(2);
    digitalWrite(trig, HIGH); 
    delayMicroseconds(10);
    digitalWrite(trig, LOW);
    
    long tempo = pulseIn(echo, HIGH, 30000); 
    int dist = tempo * 0.034 / 2;
    
    if(dist > 400 || dist <= 0) {
      dist = 11; 
    }
    
    soma += dist;
    delay(10);
  }
  return soma / quantidade_leituras;
}
void loop() {
  // =================================================================
  // 1. RECEBENDO ORDENS (TRAVA DE SEGURANÇA DESATIVADA PARA TESTE)
  // =================================================================
  while (Serial.available() > 0) {
    char comando = Serial.read();
    
    // REMOVI O "if (distancia < 11)". Agora obedece sempre!
    if (comando == 'R') { 
      bipAviso();
      digitalWrite(bomba, LOW); // LIGA A BOMBA
      delay(4000); 
      digitalWrite(bomba, HIGH); // DESLIGA A BOMBA
      bipAviso();
    } 
    else if (comando == 'L') {
      bipAviso();
      digitalWrite(bomba, LOW); // LIGA A BOMBA NA HORA
    }
    else if (comando == 'D') {
      digitalWrite(bomba, HIGH); // DESLIGA A BOMBA NA HORA
      bipAviso();
    }
  }
  // =================================================================
  // 2. CRONÔMETRO INTELIGENTE E SENSORES
  // =================================================================
  unsigned long tempoAtual = millis();
  
  if (tempoAtual - tempoUltimoEnvio >= 1000) { 
    tempoUltimoEnvio = tempoAtual; 
    valorUmidade = analogRead(sensor);
    distancia = lerDistanciaFiltrada(); 
    float umidadeAr = dht.readHumidity();
    float temperatura = dht.readTemperature();
    if (isnan(umidadeAr) || isnan(temperatura)) {
      umidadeAr = 0;
      temperatura = 0;
    }
    // REMOVI AQUI TAMBÉM o desligamento forçado da bomba pela distância
    if (distancia >= 11) {
      // digitalWrite(bomba, HIGH); <-- Desativado para não te atrapalhar
      digitalWrite(buzzer, HIGH); delay(100); 
      digitalWrite(buzzer, LOW); delay(100);
    }
    // Envia os dados para o Painel Web
    Serial.print(valorUmidade);
    Serial.print(",");
    Serial.print(distancia); 
    Serial.print(",");
    Serial.print(temperatura); 
    Serial.print(",");
    Serial.println(umidadeAr); 
  }
}
