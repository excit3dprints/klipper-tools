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
    }
};
