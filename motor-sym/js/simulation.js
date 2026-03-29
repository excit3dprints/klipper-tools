// Js/simulation.js

import { showToast } from './utils.js'; // If you need to show toasts from here


export class Simulation {
    constructor(chartElementId = 'torque-speed-chart') {
        this.chartElementId = chartElementId;
        this.torqueSpeedChart = null; // Will be initialized in Initchart

        this.initializeChart();
    }

    initializeChart() {
        const chartDom = document.getElementById(this.chartElementId);
        if (!chartDom) {
            console.error(`Chart element with ID "${this.chartElementId}" not found.`);
            return;
        }

        if (this.torqueSpeedChart) {
            this.torqueSpeedChart.dispose();
        }

        this.torqueSpeedChart = echarts.init(chartDom, 'dark');
        
        const option = {
            backgroundColor: 'transparent',
            title: {
                show: false,
                text: 'Torque vs Speed Simulation',
                subtext: 'Configure parameters and select motors to begin',
                left: 'center',
                top: 10,
                textStyle: { color: '#f0eaf8', fontSize: 16, fontWeight: 'bold', fontFamily: 'Rajdhani' },
                subtextStyle: { color: '#8a7aa0', fontSize: 11, fontFamily: 'DM Sans' }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1a1228',
                borderColor: '#2a1d42',
                textStyle: { color: '#f0eaf8', fontSize: 12 },
                formatter: (params) => {
                    let res = `<div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #2a1d42; padding-bottom:3px;">Speed: ${params[0].axisValue} mm/s</div>`;
                    params.forEach(item => {
                        const motor = item.data.motorContext;
                        res += `<div style="display:flex; justify-content:space-between; gap:20px; margin-bottom:3px;">
                                    <span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background-color:${item.color};margin-right:5px;"></span>${item.seriesName.split(' (')[0]}</span>
                                    <span style="font-weight:bold;">${item.data.value[1].toFixed(2)} N-cm</span>
                                </div>`;
                        if (motor) {
                            res += `<div style="font-size:10px; color:#8a7aa0; margin-left:15px; margin-bottom:2px;">
                                        <span style="color:#c9b8e0">Specs:</span> ${motor.inductanceMH}mH | ${motor.resistanceOhms}Ω | ${motor.ratedCurrentA}A
                                    </div>
                                    <div style="font-size:10px; color:#8a7aa0; margin-left:15px; margin-bottom:8px;">
                                        <span style="color:#c9b8e0">Config:</span> ${motor.v}V | ${motor.i}A | ${motor.p}T Pulley
                                    </div>`;
                        }
                    });
                    return res;
                }
            },
            legend: { textStyle: { color: '#c9b8e0', fontSize: 11 }, bottom: 10, left: 'center', type: 'scroll' },
            grid: { top: 85, left: '3%', right: '4%', bottom: 100, containLabel: true },
            xAxis: {
                type: 'value',
                name: 'Speed (mm/s)',
                nameLocation: 'middle',
                nameGap: 30,
                splitLine: { lineStyle: { color: '#2a1d42' } },
                axisLabel: { color: '#8a7aa0' }
            },
            yAxis: {
                type: 'value',
                name: 'Torque (N-cm)',
                splitLine: { lineStyle: { color: '#2a1d42' } },
                axisLabel: { color: '#8a7aa0' }
            },
            series: []
        };

        this.torqueSpeedChart.setOption(option);
        
        window.addEventListener('resize', () => this.torqueSpeedChart.resize());
    }
    /**
     * Update the graph with the engines and given parameters.
     * @param {Array<object>} selectedMotors -Motors to simulate.
     * @param {object} params -Simulation parameters (Voltage, Current, etc.).
     */
    updateSimulationChart(selectedMotors, params) {
        if (!this.torqueSpeedChart) {
            console.error("Chart not initialized yet.");
            return;
        }

        if (selectedMotors.length === 0) {
            showToast("Please add at least one motor to the simulation table.");
            this.torqueSpeedChart.setOption({ xAxis: {}, yAxis: {}, series: [] }, { replaceMerge: ['series'] });
            return;
        }

        const { inputVoltage, maxCurrent, pulleySize, acceleration, toolheadMass } = params;
        const maxSpeedMmS = 50;
        const speedStep = 0.5;
        const steps = Math.ceil(maxSpeedMmS / speedStep) + 1;

        const datasets = selectedMotors.map((motor, index) => {
            if (isNaN(motor.stepAngleDeg) || isNaN(motor.ratedCurrentA) || isNaN(motor.torqueNCm) || isNaN(motor.inductanceMH) || isNaN(motor.resistanceOhms)) {
                console.warn(`Motor "${motor.brandModel}" has invalid data, skipping.`);
                return null;
            }

            const hue = (index * (360 / selectedMotors.length)) % 360;
            const color = `hsl(${hue}, 70%, 60%)`;

            const seriesData = [];
            const gearRatio = (pulleySize * 2);

            for (let i = 0; i < steps; i++) {
                const rps = i * speedStep;
                const speedMmS = rps * gearRatio;

                const availableTorque = this.calculateSingleCoilTorque(
                    motor.stepAngleDeg, motor.ratedCurrentA, motor.torqueNCm,
                    motor.inductanceMH, motor.resistanceOhms, motor.rotorInertiaGCm2,
                    motor.inputVoltageV ?? inputVoltage, motor.maxDriveCurrentA ?? maxCurrent, rps
                );

                const motorInertiaTorque = this.calculateRequiredTorqueForMotor(acceleration, motor.pulleySizeMM ?? pulleySize, motor.rotorInertiaGCm2);
                const netTorque = Math.max(0, (availableTorque || 0) - (motorInertiaTorque || 0));

                seriesData.push({
                    value: [Number(speedMmS.toFixed(1)), netTorque],
                    motorContext: {
                        inductanceMH: motor.inductanceMH,
                        resistanceOhms: motor.resistanceOhms,
                        ratedCurrentA: motor.ratedCurrentA,
                        v: motor.inputVoltageV ?? inputVoltage,
                        i: motor.maxDriveCurrentA ?? maxCurrent,
                        p: motor.pulleySizeMM ?? pulleySize
                    }
                });
            }

            const v = motor.inputVoltageV ?? inputVoltage;
            const iCurrent = motor.maxDriveCurrentA ?? maxCurrent;
            const p = motor.pulleySizeMM ?? pulleySize;

            return {
                name: `${motor.brandModel || `Motor ${index + 1}`} (${v}V, ${iCurrent}A, ${p}T)`,
                type: 'line',
                smooth: true,
                showSymbol: false,
                data: seriesData,
                lineStyle: { width: 3, color: color },
                itemStyle: { color: color }
            };
        }).filter(ds => ds !== null);

        const requiredTorqueMass = this.calculateRequiredTorqueForMass(toolheadMass, acceleration, pulleySize) || 0;
        const requiredLineData = [[0, requiredTorqueMass], [Number((maxSpeedMmS * (pulleySize * 2)).toFixed(1)), requiredTorqueMass]];

        datasets.push({
            name: `Required (${toolheadMass}g, ${acceleration}mm/s²)`,
            type: 'line',
            data: requiredLineData,
            lineStyle: { color: "#F38BA8", width: 2, type: 'dashed' },
            itemStyle: { color: "#F38BA8" },
            symbol: 'none',
            z: 10
        });

        const paramSummary = `System Config: ${inputVoltage}V | ${maxCurrent}A | ${pulleySize}T Pulley | ${acceleration}mm/s² Accel | ${toolheadMass}g Mass`;
        this.lastParamSummary = paramSummary;

        this.torqueSpeedChart.setOption({ 
            xAxis: {}, 
            yAxis: {}, 
            series: datasets 
        }, { replaceMerge: ['series'] });
    }

    /**
     * Calculate the torque required to accelerate a dough linearly.
     * @param {number} massKg -Mass in kg.
     * @param {number} accelerationMmS2 -Acceleration in mm/s^2.
     * @param {number} pulleyDiameterMm -Pulley diameter in mm.
     * @returns {number} -Torque required in N-CM.
     */
    calculateRequiredTorqueForMass(toolheadMass, acceleration, pulleySize) {
        const accelReq = acceleration / 1000;
        const torqueReq = toolheadMass / 1000;
        const gearRatio = (pulleySize * 2) / 1;
        const piCalc = 2 * Math.PI * 10; 
        return accelReq * torqueReq * gearRatio / piCalc;
    }

    /**
     * Calculate the torque required to accelerate the inertia of the motor rotor.
     * @param {number} linearAccelerationMmS2 -Desired linear acceleration in mm/s^2.
     * @param {number} pulleyDiameterMm -Pulley diameter in mm.
     * @param {number|null} rotorInertiaGCm2 -Rotor inertia in g-cm^2.
     * @returns {number} -Torque required in N-CM.
     */
    calculateRequiredTorqueForMotor(acceleration, pulleySize, inertia) {
        if (!inertia || !pulleySize) return 0;
        const gearRatio = pulleySize * 2;
        const inertiaKgM2 = inertia / (1000 * Math.pow(100, 2));
        return (acceleration / gearRatio) * 2 * Math.PI * inertiaKgM2 * 100;
    }


    /**
     * Calculate the approximate torque of an engine coil at a given speed.
     * (This is a simplification and you may need adjustments according to the real engine model)
     * @param {number} stepAngleDeg
     * @param {number} ratedCurrentA
     * @param {number} holdingTorqueNCm
     * @param {number} inductanceMH
     * @param {number} resistanceOhms
     * @param {number} inputVoltageV
     * @param {number} driveCurrentA -Maximum current delivered by the driver.
     * @param {number} rps -Revolutions per second.
     * @returns {number} -Approximate available torque in N-CM.
     */
    calculateSingleCoilTorque(stepAngle, ratedCurrent, torque, inductance, resistance, rotorInertia, inputVoltage, driveCurrent, rps) {
        const pi = Math.PI;
        const sqrt2 = Math.sqrt(2); // Square root of 2 (1,414)
        const fCoil = rps * (360 / stepAngle) / 4;
        const xCoil = 2 * pi * fCoil * (inductance / 1000);
    
        const zCoil = xCoil + resistance;
        const vGen = 2 * pi * rps * (torque / (100 * sqrt2) / ratedCurrent);
    
        const vAvail = inputVoltage > vGen ? inputVoltage - vGen : 0;
    
        const iAvail = vAvail / zCoil;
        const iActual = iAvail > driveCurrent ? driveCurrent : iAvail;
    
        const torquePercent = iActual / ratedCurrent;
    
        const t1Coil = torquePercent * torque / (100 * sqrt2);
        const t2Coil = t1Coil * sqrt2;
    
        const vCoil = iActual * resistance;
    
        const power = (vCoil + vGen) * iActual;
    
        return t1Coil * 100;
    }

    /**
     * Copies the current chart as an image to the clipboard.
     * @returns {Promise<boolean>} - Success status.
     */
    async copyToClipboard() {
        if (!this.torqueSpeedChart) return false;
// Create a virtual canvas for a clean, high-resolution export
        const canvas = document.createElement('canvas');
        const dpr = 2; // Export in high-DPI for sharp text and lines
        canvas.width = 1200 * dpr;
        canvas.height = 500 * dpr;

        // Initialize a hidden ECharts instance on the canvas
        const virtualChart = echarts.init(canvas, 'dark', { devicePixelRatio: dpr });

        // Get current options and configure layout for a static image
        const options = this.torqueSpeedChart.getOption();
        options.animation = false; // Disable animation for immediate canvas capture
        options.backgroundColor = '#0d0a12'; // Bake the theme background into the PNG
        
        options.title = {
            show: true,
            text: 'Stepper Motor Torque vs Speed Simulation',
            subtext: this.lastParamSummary || '',
            left: 'center',
            top: 20,
            textStyle: { color: '#f0eaf8', fontSize: 22, fontWeight: 'bold', fontFamily: 'Rajdhani' },
            subtextStyle: { color: '#8a7aa0', fontSize: 14, fontFamily: 'DM Sans' }
        };

        options.legend = {
            show: true,
            bottom: 30,
            left: 'center',
            type: 'plain', // Ensure all items are visible in the export
            textStyle: { color: '#c9b8e0', fontSize: 13, fontFamily: 'DM Sans' }
        };

        options.grid = {
            top: 120,
            bottom: 140, // Provide ample space for the legend
            left: '5%',
            right: '5%',
            containLabel: true
        };

        // Remove interactive graphics and render to the virtual canvas
        options.graphic = [];
        virtualChart.setOption(options);

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const item = new ClipboardItem({ "image/png": blob });
            await navigator.clipboard.write([item]);
        
            virtualChart.dispose();
            showToast("Detailed graph image copied to clipboard!", 'success');
            return true;
            return true;
        } catch (err) {
            console.error("Copy failed:", err);
            showToast("Failed to copy image. Ensure you are on HTTPS.", 'error');
            return false;
        }
    }
}
