#pragma once
#include <stdint.h>
// Configuração única: conferir polaridades e calibrar antes de energizar as bombas.
namespace Config {
constexpr uint8_t SOIL_PIN=14; // A0 no UNO
constexpr uint8_t FLOAT_PINS[5]={2,3,8,9,10}; // rio, poço mínimo/máximo, caixa mínimo/máximo
// Mínimas fecham para GND com água. Máximas ABREM ao atingir cheio (falha aberta segura).
constexpr uint8_t FLOAT_ACTIVE_LEVEL[5]={0,0,1,0,1};
constexpr uint8_t RELAY_PINS[3]={7,5,4};
constexpr uint8_t RELAY_ON=0, RELAY_OFF=1;
constexpr uint8_t BUZZER_PIN=6, DHT_PIN=11, TRIG_PIN=12, ECHO_PIN=13;
constexpr bool BUZZER_ACTIVE=true; // false usa tone() para buzzer passivo.
constexpr uint16_t BUZZER_HZ=2000;
constexpr uint32_t ALERT_HOLD_MS=3000;
constexpr uint8_t WATCHDOG_PRESCALER=7; // WDTO_2S: reset em 2 s se o loop bloquear.
constexpr uint32_t BAUD=9600, TELEMETRY_MS=1000, HEARTBEAT_MS=10000;
constexpr uint32_t BOOT_HOLD_MS=5000, DEBOUNCE_MS=80, FLOAT_STALE_MS=500;
constexpr uint32_t SOIL_SAMPLE_MS=100, SOIL_STALE_MS=2000, DHT_SAMPLE_MS=2200, DHT_STALE_MS=6000;
constexpr uint32_t ULTRA_SAMPLE_MS=120, ULTRA_TIMEOUT_US=25000, ULTRA_STALE_MS=1200;
constexpr uint8_t SOIL_SAMPLES=8, ULTRA_SAMPLES=5, ULTRA_MIN_SAMPLES=3;
constexpr uint16_t SOIL_DRY_RAW=800, SOIL_WET_RAW=300; // Valores provisórios; calibrar em bancada.
constexpr uint16_t SOIL_RAW_MIN=5, SOIL_RAW_MAX=1018;
constexpr uint8_t DRY=25, WET=40;
constexpr uint32_t MAX_CYCLE_MS[3]={120000,120000,60000};
constexpr uint32_t MIN_OFF_MS[3]={30000,30000,30000};
constexpr uint32_t START_GAP_MS=2000;
constexpr uint8_t MAX_SIMULTANEOUS=1; // Aumentar só após medir corrente de partida/carga.
constexpr uint16_t BOX_FULL_MM=30, BOX_EMPTY_MM=200; // Geometria provisória da caixa.
constexpr uint8_t BOX_MIN_PERCENT=20, BOX_MAX_PERCENT=90, LEVEL_TOLERANCE=15;
constexpr uint16_t RX_SIZE=192, TX_SIZE=360;
static_assert(HEARTBEAT_MS>=3000 && START_GAP_MS>=500,"Tempos de comunicação/partida inseguros");
static_assert(SOIL_DRY_RAW>SOIL_WET_RAW+50 && SOIL_DRY_RAW<=1023,"Calibração de solo inválida");
static_assert(MAX_SIMULTANEOUS>=1 && MAX_SIMULTANEOUS<=2,"Limite de bombas inválido");
static_assert(DRY<WET && WET<=100,"Histerese inválida");
static_assert(BOX_FULL_MM<BOX_EMPTY_MM,"Geometria inválida");
}
