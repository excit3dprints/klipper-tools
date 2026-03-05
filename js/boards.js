const SENSE_RESISTORS = {
    'TMC2209': 0.110, 'TMC2226': 0.110, 'TMC2208': 0.110, 'TMC2225': 0.110,
    'TMC5160': 0.075, 'TMC5161': 0.075, 'TMC2130': 0.110, 'TMC2160': 0.075,
};

const MAX_CURRENT = {
    'TMC2209': 2.0, 'TMC2226': 2.0, 'TMC2208': 1.4, 'TMC2225': 1.4,
    'TMC5160': 3.0, 'TMC5161': 3.0, 'TMC2130': 1.2, 'TMC2160': 2.5,
};

const BOARDS = {
    'octopus_pro_v1.0': {
        name: 'BTT Octopus Pro v1.0', mcu: 'STM32F446/F429', driverCount: 8,
        drivers: [
            { id: 'DRIVER0', step: 'PF13', dir: 'PF12', enable: 'PF14', uart: 'PC4', cs: 'PC4', diag: 'PG6' },
            { id: 'DRIVER1', step: 'PG0',  dir: 'PG1',  enable: 'PF15', uart: 'PD11', cs: 'PD11', diag: 'PG9' },
            { id: 'DRIVER2', step: 'PF11', dir: 'PG3',  enable: 'PG5',  uart: 'PC6',  cs: 'PC6',  diag: 'PG10' },
            { id: 'DRIVER3', step: 'PG4',  dir: 'PC1',  enable: 'PA0',  uart: 'PC7',  cs: 'PC7',  diag: 'PG11' },
            { id: 'DRIVER4', step: 'PF9',  dir: 'PF10', enable: 'PG2',  uart: 'PF2',  cs: 'PF2',  diag: 'PG12' },
            { id: 'DRIVER5', step: 'PC13', dir: 'PF0',  enable: 'PF1',  uart: 'PE4',  cs: 'PE4',  diag: 'PG13' },
            { id: 'DRIVER6', step: 'PE2',  dir: 'PE3',  enable: 'PD4',  uart: 'PE1',  cs: 'PE1',  diag: 'PG14' },
            { id: 'DRIVER7', step: 'PE6',  dir: 'PA14', enable: 'PE0',  uart: 'PD3',  cs: 'PD3',  diag: 'PG15' }
        ],
        signaturePins: ['PF13','PF11','PF9','PG0','PG4','PC13'],
        requiredCombos: [{step:'PF13',dir:'PF12'},{step:'PF11',dir:'PG3'}],
    },
    'octopus_pro_v1.1': {
        name: 'BTT Octopus Pro v1.1', mcu: 'STM32F446/F429/H723', driverCount: 8,
        drivers: [
            { id: 'DRIVER0', step: 'PF13', dir: 'PF12', enable: 'PF14', uart: 'PC4',  cs: 'PC4',  diag: 'PG6' },
            { id: 'DRIVER1', step: 'PG0',  dir: 'PG1',  enable: 'PF15', uart: 'PD11', cs: 'PD11', diag: 'PG9' },
            { id: 'DRIVER2', step: 'PF11', dir: 'PG3',  enable: 'PG5',  uart: 'PC6',  cs: 'PC6',  diag: 'PG10' },
            { id: 'DRIVER3', step: 'PG4',  dir: 'PC1',  enable: 'PA2',  uart: 'PC7',  cs: 'PC7',  diag: 'PG11' },
            { id: 'DRIVER4', step: 'PF9',  dir: 'PF10', enable: 'PG2',  uart: 'PF2',  cs: 'PF2',  diag: 'PG12' },
            { id: 'DRIVER5', step: 'PC13', dir: 'PF0',  enable: 'PF1',  uart: 'PE4',  cs: 'PE4',  diag: 'PG13' },
            { id: 'DRIVER6', step: 'PE2',  dir: 'PE3',  enable: 'PD4',  uart: 'PE1',  cs: 'PE1',  diag: 'PG14' },
            { id: 'DRIVER7', step: 'PE6',  dir: 'PA14', enable: 'PE0',  uart: 'PD3',  cs: 'PD3',  diag: 'PG15' }
        ],
        signaturePins: ['PF13','PF11','PF9','PG0','PG4','PC13'],
        requiredCombos: [{step:'PF13',dir:'PF12'},{step:'PF11',dir:'PG3'}],
    },
    'octopus_v1.1': {
        name: 'BTT Octopus v1.1', mcu: 'STM32F446/F429', driverCount: 8,
        drivers: [
            { id: 'DRIVER0', step: 'PF13', dir: 'PF12', enable: 'PF14', uart: 'PC4',  diag: 'PG6' },
            { id: 'DRIVER1', step: 'PG0',  dir: 'PG1',  enable: 'PF15', uart: 'PD11', diag: 'PG9' },
            { id: 'DRIVER2', step: 'PF11', dir: 'PG3',  enable: 'PG5',  uart: 'PC6',  diag: 'PG10' },
            { id: 'DRIVER3', step: 'PG4',  dir: 'PC1',  enable: 'PA0',  uart: 'PC7',  diag: 'PG11' },
            { id: 'DRIVER4', step: 'PF9',  dir: 'PF10', enable: 'PG2',  uart: 'PF2',  diag: 'PG12' },
            { id: 'DRIVER5', step: 'PC13', dir: 'PF0',  enable: 'PF1',  uart: 'PE4',  diag: 'PG13' },
            { id: 'DRIVER6', step: 'PE2',  dir: 'PE3',  enable: 'PD4',  uart: 'PE1',  diag: 'PG14' },
            { id: 'DRIVER7', step: 'PE6',  dir: 'PA14', enable: 'PE0',  uart: 'PD3',  diag: 'PG15' }
        ],
        signaturePins: ['PF13','PF11','PF9'],
        requiredCombos: [{step:'PF13',dir:'PF12'}],
    },
    'kraken': {
        name: 'BTT Kraken', mcu: 'STM32H723', driverCount: 8,
        drivers: [
            { id: 'M1', step: 'PC14', dir: 'PC13', enable: 'PE6',  uart: 'PD6',  cs: 'PD6',  diag: 'PC15' },
            { id: 'M2', step: 'PE5',  dir: 'PE4',  enable: 'PE3',  uart: 'PD5',  cs: 'PD5',  diag: 'PF0' },
            { id: 'M3', step: 'PE2',  dir: 'PE1',  enable: 'PE0',  uart: 'PD4',  cs: 'PD4',  diag: 'PF1' },
            { id: 'M4', step: 'PB9',  dir: 'PB8',  enable: 'PB7',  uart: 'PD3',  cs: 'PD3',  diag: 'PF2' },
            { id: 'M5', step: 'PG9',  dir: 'PG10', enable: 'PG13', uart: 'PD2',  cs: 'PD2',  diag: 'PF3' },
            { id: 'M6', step: 'PG11', dir: 'PD7',  enable: 'PG12', uart: 'PA15', cs: 'PA15', diag: 'PF4' },
            { id: 'M7', step: 'PB4',  dir: 'PB3',  enable: 'PB5',  uart: 'PA9',  cs: 'PA9',  diag: 'PF10' },
            { id: 'M8', step: 'PG15', dir: 'PB6',  enable: 'PG14', uart: 'PA10', cs: 'PA10', diag: 'PC0' }
        ],
        signaturePins: ['PC14','PE5','PB9','PG9','PG11','PB4','PG15'],
        requiredCombos: [{step:'PC14',dir:'PC13'},{step:'PE5',dir:'PE4'},{step:'PB9',dir:'PB8'},{step:'PG9',dir:'PG10'},{step:'PG11',dir:'PD7'}],
        uniqueIdentifiers: ['PC14','PE5','PB9'],
    },
    'manta_m8p_v1': {
        name: 'BTT Manta M8P v1.0/1.1', mcu: 'STM32G0B1', driverCount: 8,
        drivers: [
            { id: 'M1', step: 'PE2',  dir: 'PB4',  enable: 'PC11', uart: 'PC10', cs: 'PC10', diag: 'PF3' },
            { id: 'M2', step: 'PF12', dir: 'PF11', enable: 'PB3',  uart: 'PF13', cs: 'PF13', diag: 'PF4' },
            { id: 'M3', step: 'PD7',  dir: 'PD6',  enable: 'PF10', uart: 'PF9',  cs: 'PF9',  diag: 'PF5' },
            { id: 'M4', step: 'PD3',  dir: 'PD2',  enable: 'PD5',  uart: 'PD4',  cs: 'PD4',  diag: 'PC0' },
            { id: 'M5', step: 'PC9',  dir: 'PC8',  enable: 'PD1',  uart: 'PD0',  cs: 'PD0',  diag: 'PC1' },
            { id: 'M6', step: 'PA10', dir: 'PA14', enable: 'PA15', uart: 'PF8',  cs: 'PF8',  diag: 'PC2' },
            { id: 'M7', step: 'PD11', dir: 'PD9',  enable: 'PD15', uart: 'PD14', cs: 'PD14', diag: 'PC3' },
            { id: 'M8', step: 'PD8',  dir: 'PC6',  enable: 'PD10', uart: 'PD13', cs: 'PD13', diag: 'PA0' }
        ],
        signaturePins: ['PF12','PD7','PC9','PD11','PD8'],
        excludePins: ['PC14','PE5','PB9'],
        requiredCombos: [{step:'PF12',dir:'PF11'},{step:'PC9',dir:'PC8'}],
        uniqueIdentifiers: ['PF12','PC9','PD11','PD8'],
    },
    'manta_m8p_v2': {
        name: 'BTT Manta M8P v2.0', mcu: 'STM32H723', driverCount: 8,
        drivers: [
            { id: 'M1', step: 'PE6',  dir: 'PE5',  enable: 'PC14', uart: 'PC13', cs: 'PC13', diag: 'PF0' },
            { id: 'M2', step: 'PE2',  dir: 'PE1',  enable: 'PE4',  uart: 'PE3',  cs: 'PE3',  diag: 'PF1' },
            { id: 'M3', step: 'PB8',  dir: 'PB7',  enable: 'PE0',  uart: 'PB9',  cs: 'PB9',  diag: 'PF2' },
            { id: 'M4', step: 'PB4',  dir: 'PB3',  enable: 'PB6',  uart: 'PB5',  cs: 'PB5',  diag: 'PF3' },
            { id: 'M5', step: 'PG13', dir: 'PG12', enable: 'PG15', uart: 'PG14', cs: 'PG14', diag: 'PF4' },
            { id: 'M6', step: 'PG9',  dir: 'PD7',  enable: 'PG10', uart: 'PG11', cs: 'PG11', diag: 'PF5' },
            { id: 'M7', step: 'PD4',  dir: 'PD3',  enable: 'PD6',  uart: 'PD5',  cs: 'PD5',  diag: 'PF6' },
            { id: 'M8', step: 'PC7',  dir: 'PC8',  enable: 'PD2',  uart: 'PC6',  cs: 'PC6',  diag: 'PF10' }
        ],
        signaturePins: ['PG13','PD4','PC7'],
        excludePins: ['PC14','PE5','PB9'],
        requiredCombos: [{step:'PE6',dir:'PE5'},{step:'PG13',dir:'PG12'}],
        uniqueIdentifiers: ['PG13','PD4','PC7'],
    },
    'skr_pro': {
        name: 'BTT SKR Pro v1.1/v1.2', mcu: 'STM32F407', driverCount: 6,
        drivers: [
            { id: 'X',  step: 'PE9',  dir: 'PF1',  enable: 'PF2',  uart: 'PC13', cs: 'PA15', diag: 'PB10' },
            { id: 'Y',  step: 'PE11', dir: 'PE8',  enable: 'PD7',  uart: 'PE3',  cs: 'PB8',  diag: 'PE12' },
            { id: 'Z',  step: 'PE13', dir: 'PC2',  enable: 'PC0',  uart: 'PE1',  cs: 'PB9',  diag: 'PG8'  },
            { id: 'E0', step: 'PE14', dir: 'PA0',  enable: 'PC3',  uart: 'PD4',  cs: 'PB3',  diag: 'PE15' },
            { id: 'E1', step: 'PD15', dir: 'PE7',  enable: 'PA3',  uart: 'PD1',  cs: 'PG15', diag: 'PE10' },
            { id: 'E2', step: 'PD13', dir: 'PG9',  enable: 'PF0',  uart: 'PD6',  cs: 'PG12', diag: 'PG5'  }
        ],
        signaturePins: ['PE9','PE11','PE13','PE14','PD15','PD13'],
        requiredCombos: [{step:'PE9',dir:'PF1'},{step:'PE11',dir:'PE8'},{step:'PE13',dir:'PC2'}],
        uniqueIdentifiers: ['PE9','PE11','PE13'],
    },
    'skr_2': {
        name: 'BTT SKR 2', mcu: 'STM32F407/F429', driverCount: 5,
        drivers: [
            { id: 'X',  step: 'PE2',  dir: 'PE1',  enable: 'PE3',  uart: 'PE0',  cs: 'PE0',  diag: 'PC1' },
            { id: 'Y',  step: 'PD5',  dir: 'PD4',  enable: 'PD6',  uart: 'PD3',  cs: 'PD3',  diag: 'PC3' },
            { id: 'Z',  step: 'PA15', dir: 'PA8',  enable: 'PD1',  uart: 'PD0',  cs: 'PD0',  diag: 'PC0' },
            { id: 'E0', step: 'PD15', dir: 'PD14', enable: 'PC7',  uart: 'PC6',  cs: 'PC6',  diag: 'PC2' },
            { id: 'E1', step: 'PD11', dir: 'PD10', enable: 'PD13', uart: 'PD12', cs: 'PD12', diag: 'PA0' }
        ],
        signaturePins: ['PE2','PD5','PA15','PD15','PD11'],
        requiredCombos: [{step:'PE2',dir:'PE1'},{step:'PD5',dir:'PD4'},{step:'PA15',dir:'PA8'}],
        uniqueIdentifiers: ['PA15','PD5'],
    },
    'skr_3': {
        name: 'BTT SKR 3 / SKR 3 EZ', mcu: 'STM32H743/H723', driverCount: 5,
        drivers: [
            { id: 'X',  step: 'PD4',  dir: 'PD3',  enable: 'PD6',  uart: 'PD5',  cs: 'PD5',  diag: 'PC1' },
            { id: 'Y',  step: 'PA15', dir: 'PA8',  enable: 'PD1',  uart: 'PD0',  cs: 'PD0',  diag: 'PC3' },
            { id: 'Z',  step: 'PE2',  dir: 'PE3',  enable: 'PE0',  uart: 'PE1',  cs: 'PE1',  diag: 'PC0' },
            { id: 'E0', step: 'PD15', dir: 'PD14', enable: 'PC7',  uart: 'PC6',  cs: 'PC6',  diag: 'PC2' },
            { id: 'E1', step: 'PD11', dir: 'PD10', enable: 'PD13', uart: 'PD12', cs: 'PD12', diag: 'PA0' }
        ],
        signaturePins: ['PD4','PA15','PE2','PD15','PD11'],
        requiredCombos: [{step:'PD4',dir:'PD3'},{step:'PA15',dir:'PA8'},{step:'PE2',dir:'PE3'}],
        uniqueIdentifiers: ['PD4','PE2'],
        excludePins: ['PE9','PE11','PE13'],
    },
    'skr_mini_e3_v3': {
        name: 'BTT SKR Mini E3 v3.0', mcu: 'STM32G0B1', driverCount: 4,
        drivers: [
            { id: 'X', step: 'PB13', dir: 'PB12', enable: 'PB14', uart: 'PC11', diag: 'PC0' },
            { id: 'Y', step: 'PB10', dir: 'PB2',  enable: 'PB11', uart: 'PC11', diag: 'PC1' },
            { id: 'Z', step: 'PB0',  dir: 'PC5',  enable: 'PB1',  uart: 'PC11', diag: 'PC2' },
            { id: 'E', step: 'PB3',  dir: 'PB4',  enable: 'PD1',  uart: 'PC11', diag: 'PC2' }
        ],
        signaturePins: ['PB13','PB10','PB0','PB3'],
        requiredCombos: [{step:'PB13',dir:'PB12'},{step:'PB10',dir:'PB2'},{step:'PB0',dir:'PC5'}],
        uniqueIdentifiers: ['PB13','PB10','PB0','PB3'],
    },
    'manta_m5p': {
        name: 'BTT Manta M5P', mcu: 'STM32G0B1', driverCount: 5,
        drivers: [
            { id: 'X',  step: 'PC8',  dir: 'PC9',  enable: 'PA15', uart: 'PD9',  cs: 'PD9',  diag: 'PD3' },
            { id: 'Y',  step: 'PA10', dir: 'PA14', enable: 'PA13', uart: 'PD8',  cs: 'PD8',  diag: 'PD2' },
            { id: 'Z',  step: 'PC6',  dir: 'PC7',  enable: 'PA9',  uart: 'PB10', cs: 'PB10', diag: 'PC3' },
            { id: 'E0', step: 'PB12', dir: 'PB11', enable: 'PA8',  uart: 'PB2',  cs: 'PB2',  diag: 'PC2' },
            { id: 'E1', step: 'PB0',  dir: 'PB1',  enable: 'PC4',  uart: 'PA6',  cs: 'PA6'               }
        ],
        signaturePins: ['PC8','PA10','PC6','PB12','PB0'],
        requiredCombos: [{step:'PC8',dir:'PC9'},{step:'PA10',dir:'PA14'},{step:'PC6',dir:'PC7'}],
        uniqueIdentifiers: ['PC8','PA10','PB12'],
    },
    'octopus_max_ez': {
        name: 'BTT Octopus Max EZ', mcu: 'STM32H723', driverCount: 10,
        drivers: [
            { id: 'Motor-1',  step: 'PC13', dir: 'PC14', enable: 'PE6',  uart: 'PG14', cs: 'PG14', diag: 'PF0' },
            { id: 'Motor-2',  step: 'PE4',  dir: 'PE5',  enable: 'PE3',  uart: 'PG13', cs: 'PG13', diag: 'PF2' },
            { id: 'Motor-3',  step: 'PE1',  dir: 'PE0',  enable: 'PE2',  uart: 'PG12', cs: 'PG12', diag: 'PF4' },
            { id: 'Motor-4',  step: 'PB8',  dir: 'PB9',  enable: 'PB7',  uart: 'PG11', cs: 'PG11', diag: 'PF3' },
            { id: 'Motor-5',  step: 'PB5',  dir: 'PB4',  enable: 'PB6',  uart: 'PG10', cs: 'PG10'             },
            { id: 'Motor-6',  step: 'PG15', dir: 'PB3',  enable: 'PD5',  uart: 'PG9',  cs: 'PG9'              },
            { id: 'Motor-7',  step: 'PD3',  dir: 'PD2',  enable: 'PD4',  uart: 'PD7',  cs: 'PD7'              },
            { id: 'Motor-8',  step: 'PA10', dir: 'PA9',  enable: 'PA15', uart: 'PD6',  cs: 'PD6'              },
            { id: 'Motor-9',  step: 'PA8',  dir: 'PC7',  enable: 'PC9',  uart: 'PG8',  cs: 'PG8'              },
            { id: 'Motor-10', step: 'PG6',  dir: 'PC6',  enable: 'PC8',  uart: 'PG7',  cs: 'PG7'              }
        ],
        signaturePins: ['PC13','PE4','PE1','PB5','PG15','PD3','PA8','PG6'],
        requiredCombos: [{step:'PC13',dir:'PC14'},{step:'PE4',dir:'PE5'},{step:'PE1',dir:'PE0'}],
        uniqueIdentifiers: ['PC13','PG15','PG6'],
        excludePins: ['PF13','PG0','PF11'],
    },
    'fysetc_spider': {
        name: 'Fysetc Spider v1.x/v2.2', mcu: 'STM32F446', driverCount: 8,
        drivers: [
            { id: 'X-MOT',  step: 'PE11', dir: 'PE10', enable: 'PE9',  uart: 'PE7',  cs: 'PE7',  diag: 'PB14' },
            { id: 'Y-MOT',  step: 'PD8',  dir: 'PB12', enable: 'PD9',  uart: 'PE15', cs: 'PE15', diag: 'PB13' },
            { id: 'Z-MOT',  step: 'PD14', dir: 'PD13', enable: 'PD15', uart: 'PD10', cs: 'PD10', diag: 'PA0'  },
            { id: 'E0-MOT', step: 'PD5',  dir: 'PD6',  enable: 'PD4',  uart: 'PD7',  cs: 'PD7',  diag: 'PA3'  },
            { id: 'E1-MOT', step: 'PE6',  dir: 'PC13', enable: 'PE5',  uart: 'PC14', cs: 'PC14', diag: 'PA2'  },
            { id: 'E2-MOT', step: 'PE2',  dir: 'PE4',  enable: 'PE3',  uart: 'PC15', cs: 'PC15', diag: 'PA1'  },
            { id: 'E3-MOT', step: 'PD12', dir: 'PC4',  enable: 'PE8',  uart: 'PA15', cs: 'PA15'              },
            { id: 'E4-MOT', step: 'PE1',  dir: 'PE0',  enable: 'PC5',  uart: 'PD11', cs: 'PD11'              }
        ],
        signaturePins: ['PE11','PD8','PD14','PD5','PE6','PE2','PD12','PE1'],
        requiredCombos: [{step:'PE11',dir:'PE10'},{step:'PD8',dir:'PB12'},{step:'PD14',dir:'PD13'}],
        uniqueIdentifiers: ['PE11','PD8','PD14'],
    },
    'leviathan_v1.2': {
        name: 'LDO Leviathan v1.2', mcu: 'STM32F446', driverCount: 7,
        drivers: [
            { id: 'HV-0',   step: 'PB10', dir: 'PB11', enable: 'PG0',  cs: 'PE15', diag: 'PG1'  },
            { id: 'HV-1',   step: 'PF15', dir: 'PF14', enable: 'PE9',  cs: 'PE11', diag: 'PE10' },
            { id: 'STEP-0', step: 'PD4',  dir: 'PD3',  enable: 'PD7',  uart: 'PD5',  diag: 'PD6'  },
            { id: 'STEP-1', step: 'PC12', dir: 'PC11', enable: 'PD2',  uart: 'PD5',  diag: 'PD6'  },
            { id: 'STEP-2', step: 'PC9',  dir: 'PC8',  enable: 'PC10', uart: 'PA8',  diag: 'PA15' },
            { id: 'STEP-3', step: 'PG7',  dir: 'PG6',  enable: 'PC7',  uart: 'PG8',  diag: 'PC6'  },
            { id: 'STEP-4', step: 'PD10', dir: 'PD9',  enable: 'PD13', uart: 'PD11', diag: 'PD12' }
        ],
        signaturePins: ['PB10','PF15','PD4','PC12','PC9','PG7','PD10'],
        requiredCombos: [{step:'PB10',dir:'PB11'},{step:'PF15',dir:'PF14'},{step:'PD4',dir:'PD3'}],
        uniqueIdentifiers: ['PB10','PF15','PG7'],
    },
    'sv08_mainboard': {
        name: 'Sovol SV08 Mainboard', mcu: 'STM32H723', driverCount: 6,
        drivers: [
            { id: 'X',  step: 'PE2',  dir: 'PE0',  enable: 'PE3',  uart: 'PE1'  },
            { id: 'Y',  step: 'PB8',  dir: 'PB6',  enable: 'PB9',  uart: 'PB7'  },
            { id: 'Z1', step: 'PD3',  dir: 'PD1',  enable: 'PD4',  uart: 'PD2'  },
            { id: 'Z2', step: 'PD7',  dir: 'PD5',  enable: 'PB5',  uart: 'PD6'  },
            { id: 'Z3', step: 'PC0',  dir: 'PE5',  enable: 'PC1',  uart: 'PE6'  },
            { id: 'Z4', step: 'PD11', dir: 'PD9',  enable: 'PD12', uart: 'PD10' }
        ],
        signaturePins: ['PE2','PB8','PD3','PD7','PC0','PD11'],
        requiredCombos: [
            {step:'PE2', dir:'PE0'},
            {step:'PB8', dir:'PB6'},
            {step:'PD3', dir:'PD1'},
            {step:'PD11',dir:'PD9'}
        ],
        uniqueIdentifiers: ['PC0','PD11'],
    }
};
