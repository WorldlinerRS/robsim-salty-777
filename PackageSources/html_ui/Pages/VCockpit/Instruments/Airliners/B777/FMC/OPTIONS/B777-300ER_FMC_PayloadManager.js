class B777_FMC_PayloadManagerPage {
    
    constructor(fmc) {
        this.fmc = fmc;
        this.tankPriorityValues = [];
        this.payloadValues = [];
        this.init();
    }

    static get tankCapacity() {
        return {
            'CENTER': 27290,
            'LEFT': 10300,
            'RIGHT': 10300
        };
    }

    static get tankPriority() {
        return [['LEFT_MAIN', 'RIGHT_MAIN'], ['CENTER']];
    }

    static get tankVariables() {
        return {
            'CENTER': 'FUEL TANK CENTER QUANTITY',
            'LEFT_MAIN': 'FUEL TANK LEFT MAIN QUANTITY',
            'RIGHT_MAIN': 'FUEL TANK RIGHT MAIN QUANTITY'
        };
    }

    static get payloadIndex() {
        return {
            'PILOT': 1,
            'COPILOT': 2,
            'CREW': 3,
            'FIRST_CLASS': 4,
            'BUSINESS_CLASS': 5,
            'PREMIUM_ECONOMY': 6,
            'FORWARD_ECONOMY': 7,
            'REAR_ECONOMY': 8,
            'FORWARD_BAGGAGE': 9,
            'REAR_BAGGAGE': 10
        };
    }

    static get getMaxFuel() {
        return 47890;
    }
    static get getMinFuel() {
        return 0;
    }
    static get getMaxPayload() {
        return 405001;
    }
    static get getMinPayload() {
        return 0;
    }
    static get getMaxCenterOfGravity() {
        return 100;
    }
    static get getMinCenterOfGravity() {
        return 0;
    }

    init() {
        this.tankPriorityValues = [
            {
                'LEFT_MAIN': this.getTankValue(B777_FMC_PayloadManagerPage.tankVariables.LEFT_MAIN),
                'RIGHT_MAIN': this.getTankValue(B777_FMC_PayloadManagerPage.tankVariables.RIGHT_MAIN)
            },
            { 'CENTER': this.getTankValue(B777_FMC_PayloadManagerPage.tankVariables.CENTER) }
        ];
        this._internalPayloadValuesCache = [];
        this.payloadValues = this.getPayloadValues();
        B777_FMC_PayloadManagerPage.centerOfGravity = this.getCenterOfGravity();
    }

    getPayloadValues() {
        return [
            {
                'PILOT': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.PILOT),
                'COPILOT': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.COPILOT),
                'CREW': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.CREW),
            },
            {
                'FIRST_CLASS': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.FIRST_CLASS),
                'BUSINESS_CLASS': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.BUSINESS_CLASS),
                'PREMIUM_ECONOMY': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.PREMIUM_ECONOMY),
                'FORWARD_BAGGAGE': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.FORWARD_BAGGAGE)
            },
            {
                'FORWARD_ECONOMY': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.FORWARD_ECONOMY),
                'REAR_ECONOMY': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.REAR_ECONOMY),
                'REAR_BAGGAGE': this.getPayloadValue(B777_FMC_PayloadManagerPage.payloadIndex.REAR_BAGGAGE)
            }
        ];
    }

    getPayloadValue(index) {
        return SimVar.GetSimVarValue('PAYLOAD STATION WEIGHT:' + index, 'Pounds');
    }
    getPayloadValueFromCache(index) {
        return this._internalPayloadValuesCache[index];
    }
    async setPayloadValue(index, value) {
        this._internalPayloadValuesCache[index] = value;
        return SimVar.SetSimVarValue('PAYLOAD STATION WEIGHT:' + index, 'Pounds', value);
    }
    getTankValue(variable) {
        return SimVar.GetSimVarValue(variable, 'Gallons');
    }
    getCenterOfGravity() {
        return SimVar.GetSimVarValue('CG PERCENT', 'Percent');
    }
    getTotalPayload(useLbs = false) {
        let payload = 0;
        this.payloadValues.forEach((group) => {
            Object.values(group).forEach((sectionValue) => {
                payload = payload + Number(sectionValue);
            });
        });
        return (useLbs ? payload : payload * 0.45359237);
    }
    getTotalFuel(useLbs = false) {
        let fuel = 0;
        this.tankPriorityValues.forEach((group) => {
            Object.values(group).forEach((sectionValue) => {
                fuel = fuel + Number(sectionValue);
            });
        });
        return (useLbs ? fuel * SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'Pounds') : fuel);
    }
    async flushFuelAndPayload() {
        return new Promise(resolve => {
            this.flushFuel().then(() => {
                return this.resetPayload();
            }).then(() => {
                return this.fmc.getCurrentWeight(true);
            }).then(weight => {
                return this.fmc.setZeroFuelWeight((298700 + B777_FMC_PayloadManagerPage.requestedPayload) / 1000, EmptyCallback.Void, true);
            }).then(() => {
                return this.resetPayload();
            }).then(() => {
                resolve();
            });
        });
    }
    async flushFuel() {
        return new Promise(resolve => {
            let setTankFuel = async (variable, gallons) => {
                SimVar.SetSimVarValue(variable, 'Gallons', gallons);
            };
            B777_FMC_PayloadManagerPage.tankPriority.forEach((tanks, index) => {
                tanks.forEach((tank) => {
                    setTankFuel(B777_FMC_PayloadManagerPage.tankVariables[tank], 0).then(() => {
                        console.log(B777_FMC_PayloadManagerPage.tankVariables[tank] + ' flushed');
                    });
                });
            });
            this.fmc.trySetBlockFuel(0, true);
            resolve();
        });
    }
    calculateTanks(fuel) {
        this.tankPriorityValues[0].LEFT_MAIN = 0;
        this.tankPriorityValues[1].CENTER = 0;
        this.tankPriorityValues[0].RIGHT_MAIN = 0;
        fuel = this.calculateMainTanks(fuel);
        fuel = this.calculateCenterTank(fuel);
        let fuelBlock = 0;
        let setTankFuel = async (variable, gallons) => {
            fuelBlock += gallons;
            SimVar.SetSimVarValue(variable, 'Gallons', gallons);
        };
        B777_FMC_PayloadManagerPage.tankPriority.forEach((tanks, index) => {
            tanks.forEach((tank) => {
                setTankFuel(B777_FMC_PayloadManagerPage.tankVariables[tank], this.tankPriorityValues[index][tank]).then(() => {
                    console.log(B777_FMC_PayloadManagerPage.tankVariables[tank] + ' set to ' + this.tankPriorityValues[index][tank]);
                });
            });
        });
        this.fmc.trySetBlockFuel(fuelBlock * SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'Pounds') / 1000, true);
    }
    calculateMainTanks(fuel) {
        let remainingFuel = 0;
        let tanksCapacity = (B777_FMC_PayloadManagerPage.tankCapacity.LEFT_MAIN * 2);
        if (fuel > tanksCapacity) {
            remainingFuel = fuel - tanksCapacity;
            fuel = tanksCapacity;
        }
        let reminder = fuel % 2;
        let quotient = (fuel - reminder) / 2;
        this.tankPriorityValues[0].LEFT_MAIN = quotient;
        this.tankPriorityValues[0].RIGHT_MAIN = quotient;
        if (reminder) {
            this.tankPriorityValues[0].LEFT_MAIN++;
            reminder--;
        }
        if (reminder) {
            this.tankPriorityValues[0].RIGHT_MAIN++;
            reminder--;
        }
        return remainingFuel;
    }
    calculateCenterTank(fuel) {
        let remainingFuel = 0;
        let tankCapacity = B777_FMC_PayloadManagerPage.tankCapacity.CENTER;
        if (fuel > tankCapacity) {
            remainingFuel = fuel - tankCapacity;
            fuel = tankCapacity;
        }
        this.tankPriorityValues[1].CENTER = fuel;
        return remainingFuel;
    }

    static ShowPage1(fmc) {
        fmc.clearDisplay();
        this.payloadValues = this.getPayloadValues();
        if (!B777_FMC_PayloadManagerPage.requestedPayload) {
            B777_FMC_PayloadManagerPage.requestedPayload = this.getTotalPayload(true);
        }
        if (!B777_FMC_PayloadManagerPage.requestedCenterOfGravity) {
            B777_FMC_PayloadManagerPage.requestedCenterOfGravity = this.getCenterOfGravity();
        }
        if (!B777_FMC_PayloadManagerPage.requestedFuel) {
            B777_FMC_PayloadManagerPage.requestedFuel = this.getTotalFuel();
        }
        if (B777_FMC_PayloadManagerPage.isPayloadManagerExecuted) {
            this.fmc.pageUpdate = () => {
                this.showPage();
            };
        }
        let weightPerGallon;
        let units;
        let payloadModifier;
        let useImperial = !SaltyDataStore.get("OPTIONS_UNITS", "KG");
        if (useImperial) {
            weightPerGallon = SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'pounds');
            units = 'Pounds';
            payloadModifier = 1.0;
        }
        else {
            weightPerGallon = SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'kilograms');
            units = 'Kg';
            payloadModifier = 0.45359237;
        }
        const totalFuel = this.getTotalFuel() * weightPerGallon;
        const fobToRender = totalFuel.toFixed(2);
        const fobReqToRender = (B777_FMC_PayloadManagerPage.requestedFuel ? (B777_FMC_PayloadManagerPage.requestedFuel * weightPerGallon).toFixed(2) : fobToRender);
        const totalPayload = this.getTotalPayload(useImperial);
        const payloadToRender = totalPayload.toFixed(0);
        const payloadReqToRender = (B777_FMC_PayloadManagerPage.requestedPayload ? (B777_FMC_PayloadManagerPage.requestedPayload * payloadModifier).toFixed(0) : payloadToRender);
        (B777_FMC_PayloadManagerPage.requestedFuel ? B777_FMC_PayloadManagerPage.requestedFuel.toFixed(2) : this.getTotalFuel().toFixed(2));
        
        fmc.setTemplate([
            ["PAYLOAD MANAGER"],
            ["", ""],
            ["", ""],
            ["CG", "CG"],
            [(B777_FMC_PayloadManagerPage.requestedCenterOfGravity ? B777_FMC_PayloadManagerPage.requestedCenterOfGravity.toFixed(2) + '%' : B777_FMC_PayloadManagerPage.centerOfGravity.toFixed(2) + '%'), this.getCenterOfGravity().toFixed(2) + '%'],
            ["FOB (" + units + ")", "FOB (" + units + ")"],
            [fobReqToRender, fobToRender],
            ["PAYLOAD (" + units + ")", "PAYLOAD (" + units + ")"],
            [payloadReqToRender, payloadToRender],
            ["", ""],
            [(B777_FMC_PayloadManagerPage.remainingPayload ? 'REMAINING PAYLOAD' : ''), (B777_FMC_PayloadManagerPage.remainingPayload ? B777_FMC_PayloadManagerPage.remainingPayload + ' lb' : '')],
            ["\xa0RETURN TO", ""],
            ["<INDEX", "EXECUTE>"]
        ]);

        /* LSK2 */
        fmc.onLeftInput[1] = () => {
            let value = fmc.inOut;
            if (isFinite(parseFloat(value))) {
                if (parseFloat(value) > B777_FMC_PayloadManagerPage.getMinCenterOfGravity && parseFloat(value) < B777_FMC_PayloadManagerPage.getMaxCenterOfGravity) {
                    B777_FMC_PayloadManagerPage.requestedCenterOfGravity = parseFloat(value);
                    fmc.clearUserInput();
                    B777_FMC_PayloadManagerPage.showPage(fmc);
                }
                else {
                    this.fmc.showErrorMessage('OUT OF RANGE');
                    return false;
                }
            }
            else {
                this.fmc.showErrorMessage(this.fmc.defaultInputErrorMessage);
                return false;
            }
        };

        /* LSK3 */
        fmc.onLeftInput[2] = () => {
            let value = fmc.inOut;
            if (isFinite(parseFloat(value))) {
            let useImperial = !SaltyDataStore.get("OPTIONS_UNITS", "KG");
            let requestedInPounds;
            let payloadModifier;
                if (useImperial) {
                    payloadModifier = 1.0;
                } else {
                    payloadModifier = 2.20462262;
                }
                requestedInPounds = parseFloat(value) * payloadModifier;
                if (parseFloat(requestedInPounds) > B777_FMC_PayloadManagerPage.getMinPayload && parseFloat(requestedInPounds) < B777_FMC_PayloadManagerPage.getMaxPayload) {
                    B777_FMC_PayloadManagerPage.requestedPayload = parseFloat(requestedInPounds);
                    this.fmc.clearUserInput();
                    B777_FMC_PayloadManagerPage.showPage(fmc);
                } else {
                    this.fmc.showErrorMessage('OUT OF RANGE');
                    return false;
                }
            } else {
            this.fmc.showErrorMessage(this.fmc.defaultInputErrorMessage);
            return false;
            }
            B777_FMC_PayloadManagerPage.showPage(fmc);
        };
       
        /* LSK4 */
        fmc.onLeftInput[3] = () => {
            let value = fmc.inOut;
            if (isFinite(parseFloat(value))) {
                let useImperial = HeavyDivision.Configuration.useImperial();
                let requestedInPounds;
                let payloadModifier;
                if (useImperial) {
                    payloadModifier = 1.0;
                } else {
                    payloadModifier = 2.20462262;
                }
                requestedInPounds = parseFloat(value) * payloadModifier;
                if (parseFloat(requestedInPounds) > B777_FMC_PayloadManagerPage.getMinPayload && parseFloat(requestedInPounds) < B777_FMC_PayloadManagerPage.getMaxPayload) {
                    B777_FMC_PayloadManagerPage.requestedPayload = parseFloat(requestedInPounds);
                    this.fmc.clearUserInput();
                    B777_FMC_PayloadManagerPage.showPage(fmc);
                } else {
                    this.fmc.showErrorMessage('OUT OF RANGE');
                    return false;
                }
            } else {
                this.fmc.showErrorMessage(this.fmc.defaultInputErrorMessage);
                return false;
            }
       };
        /* LSK6 */
        fmc.onLeftInput[5] = () => {
            FMC_Menu.ShowPage(fmc);
        }

        
        /* RSK6 */
        fmc.onRightInput[5] = () => {
            B777_FMC_PayloadManagerPage.isPayloadManagerExecuted = true;
            this.flushFuelAndPayload().then(() => {
                if (B777_FMC_PayloadManagerPage.requestedFuel) {
                this.calculateTanks(B777_FMC_PayloadManagerPage.requestedFuel);
                } else {
                    this.calculateTanks(this.getTotalFuel());
                }
                if (B777_FMC_PayloadManagerPage.requestedPayload) {
                    this.calculatePayload(B777_FMC_PayloadManagerPage.requestedPayload).then(() => {
                    B777_FMC_PayloadManagerPage.isPayloadManagerExecuted = false;
                    });
                } else {
                    this.calculatePayload(this.getTotalPayload(true)).then(() => {
                    B777_FMC_PayloadManagerPage.isPayloadManagerExecuted = false;
                    });
                }
                B777_FMC_PayloadManagerPage.ShowPage(fmc);
            })
        };
    }
};
      