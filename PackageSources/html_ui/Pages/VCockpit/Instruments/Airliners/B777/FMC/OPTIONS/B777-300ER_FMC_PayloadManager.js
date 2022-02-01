class B777_FMC_PayloadManager {

    static ShowPage(fmc) {
        fmc.clearDisplay();

        fmc.refreshPageCallback = () => {
            B777_FMC_PayloadManager.ShowPage(fmc);
        };

        let isPayloadManagerExecuted = undefined;
        let requestedCenterOfGravity = null;
        let requestedFuel = null;
        let requestedPayload = null;
        let remainingPayload = null;
        let _internalPayloadValuesCache = [];

        const tankCapacity = {
                'CENTER': 27290,
                'LEFT_MAIN': 10300,
                'RIGHT_MAIN': 10300
            };
        const tankPriority = [['LEFT_MAIN', 'RIGHT_MAIN'], ['CENTER']];
    
        const tankVariables = {
                'CENTER': 'FUEL TANK CENTER QUANTITY',
                'LEFT_MAIN': 'FUEL TANK LEFT MAIN QUANTITY',
                'RIGHT_MAIN': 'FUEL TANK RIGHT MAIN QUANTITY'
            };
    
        const payloadIndex = {
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
    
        function  getMaxFuel() {
            return 47890;
        }
        function getMinFuel() {
            return 0;
        }
        function getMaxPayload() {
            return 405001;
        }
        function getMinPayload() {
            return 0;
        }
        function getMaxCenterOfGravity() {
            return 100;
        }
        function getMinCenterOfGravity() {
            return 0;
        }

        function getPayloadValues() {
            return [
                {
                    'PILOT': getPayloadValue(payloadIndex.PILOT),
                    'COPILOT': getPayloadValue(payloadIndex.COPILOT),
                    'CREW': getPayloadValue(payloadIndex.CREW),
                },
                {
                    'FIRST_CLASS': getPayloadValue(payloadIndex.FIRST_CLASS),
                    'BUSINESS_CLASS': getPayloadValue(payloadIndex.BUSINESS_CLASS),
                    'PREMIUM_ECONOMY': getPayloadValue(payloadIndex.PREMIUM_ECONOMY),
                    'FORWARD_BAGGAGE': getPayloadValue(payloadIndex.FORWARD_BAGGAGE)
                },
                {
                    'FORWARD_ECONOMY': getPayloadValue(payloadIndex.FORWARD_ECONOMY),
                    'REAR_ECONOMY': getPayloadValue(payloadIndex.REAR_ECONOMY),
                    'REAR_BAGGAGE': getPayloadValue(payloadIndex.REAR_BAGGAGE)
                }
            ];
        }
        function getPayloadValue(index) {
            return SimVar.GetSimVarValue('PAYLOAD STATION WEIGHT:' + index, 'Pounds');
        }
        function getPayloadValueFromCache(index) {
            return _internalPayloadValuesCache[index];
        }
        async function setPayloadValue(index, value) {
            _internalPayloadValuesCache[index] = value;
            return SimVar.SetSimVarValue('PAYLOAD STATION WEIGHT:' + index, 'Pounds', value);
        }
        function getTankValue(variable) {
            return SimVar.GetSimVarValue(variable, 'Gallons');
        }
        function getCenterOfGravity() {
            return SimVar.GetSimVarValue('CG PERCENT', 'Percent');
        }
        function getTotalPayload(useLbs = false) {
            let payload = 0;
            payloadValues.forEach((group) => {
                Object.values(group).forEach((sectionValue) => {
                    payload = payload + Number(sectionValue);
                });
            });
            return (useLbs ? payload : payload * 0.45359237);
        }
        function getTotalFuel(useLbs = false) {
            let fuel = 0;
            tankPriorityValues.forEach((group) => {
                Object.values(group).forEach((sectionValue) => {
                    fuel = fuel + Number(sectionValue);
                });
            });
            return (useLbs ? fuel * SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'Pounds') : fuel);
        }
        async function flushFuelAndPayload() {
            return new Promise(resolve => {
                flushFuel().then(() => {
                    return resetPayload();
                }).then(() => {
                    return fmc.getCurrentWeight(true);
                }).then(weight => {
                    return fmc.setZeroFuelWeight((298700 + requestedPayload) / 1000, EmptyCallback.Void, true);
                }).then(() => {
                    return resetPayload();
                }).then(() => {
                    resolve();
                });
            });
        }
        async function flushFuel() {
            return new Promise(resolve => {
                let setTankFuel = async (variable, gallons) => {
                    SimVar.SetSimVarValue(variable, 'Gallons', gallons);
                };
                tankPriority.forEach((tanks, index) => {
                    tanks.forEach((tank) => {
                        setTankFuel(tankVariables[tank], 0).then(() => {
                            console.log(tankVariables[tank] + ' flushed');
                        });
                    });
                });
                fmc.trySetBlockFuel(0, true);
                resolve();
            });
        }
        function calculateTanks(fuel) {
            tankPriorityValues[0].LEFT_MAIN = 0;
            tankPriorityValues[1].CENTER = 0;
            tankPriorityValues[0].RIGHT_MAIN = 0;
            fuel = calculateMainTanks(fuel);
            fuel = calculateCenterTank(fuel);
            let fuelBlock = 0;
            let setTankFuel = async (variable, gallons) => {
                fuelBlock += gallons;
                SimVar.SetSimVarValue(variable, 'Gallons', gallons);
            };
            tankPriority.forEach((tanks, index) => {
                tanks.forEach((tank) => {
                    setTankFuel(tankVariables[tank], tankPriorityValues[index][tank]).then(() => {
                        console.log(tankVariables[tank] + ' set to ' + tankPriorityValues[index][tank]);
                    });
                });
            });
            fmc.trySetBlockFuel(fuelBlock * SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'Pounds') / 1000, true);
        }
        function calculateMainTanks(fuel) {
            let remainingFuel = 0;
            let tanksCapacity = (tankCapacity.LEFT_MAIN * 2);
            if (fuel > tanksCapacity) {
                remainingFuel = fuel - tanksCapacity;
                fuel = tanksCapacity;
            }
            let reminder = fuel % 2;
            let quotient = (fuel - reminder) / 2;
            tankPriorityValues[0].LEFT_MAIN = quotient;
            tankPriorityValues[0].RIGHT_MAIN = quotient;
            if (reminder) {
                tankPriorityValues[0].LEFT_MAIN++;
                reminder--;
            }
            if (reminder) {
                tankPriorityValues[0].RIGHT_MAIN++;
                reminder--;
            }
            return remainingFuel;
        }
        function calculateCenterTank(fuel) {
            let remainingFuel = 0;
            let tankCapacity = tankCapacity.CENTER;
            if (fuel > tankCapacity) {
                remainingFuel = fuel - tankCapacity;
                fuel = tankCapacity;
            }
            tankPriorityValues[1].CENTER = fuel;
            return remainingFuel;
        }
        async function resetPayload() {
            await setPayloadValue(1, 0);
            await setPayloadValue(2, 0);
            await setPayloadValue(3, 0);
            await setPayloadValue(4, 0);
            await setPayloadValue(5, 0);
            await setPayloadValue(6, 0);
            await setPayloadValue(7, 0);
            await setPayloadValue(8, 0);
            await setPayloadValue(9, 0);
            await setPayloadValue(10, 0);
        }
        async function calculatePayload(requestedPayload) {
            await this.resetPayload();
            remainingPayload = requestedPayload;
            let amount = 0;
            let requestedCenterOfGravity = (requestedCenterOfGravity ? requestedCenterOfGravity : getCenterOfGravity());
            while (remainingPayload > 0) {
                centerOfGravity = getCenterOfGravity();
                if (remainingPayload > 30000) {
                    amount = 1000;
                }
                else if (remainingPayload > 10000) {
                    amount = 200;
                }
                else if (remainingPayload > 5000) {
                    amount = 100;
                }
                else if (remainingPayload > 50) {
                    amount = 50;
                }
                else {
                    amount = remainingPayload;
                }
                if (centerOfGravity > requestedCenterOfGravity) {
                    await increaseFrontPayload(amount, requestedCenterOfGravity);
                    remainingPayload = remainingPayload - amount;
                }
                else {
                    await increaseRearPayload(amount, requestedCenterOfGravity);
                    remainingPayload = remainingPayload - amount;
                }
            }
        }
        async function increaseFrontPayload(amount, requestedCenterOfGravity) {
            let keys = Object.keys(payloadValues[1]);
            let randomFront;
            let actualValue;
            if (centerOfGravity > (requestedCenterOfGravity + 0.05)) {
                actualValue = getPayloadValueFromCache(payloadIndex.BUSINESS_CLASS);
                await setPayloadValue(payloadIndex.BUSINESS_CLASS, amount + actualValue);
            }
            else if (centerOfGravity > (requestedCenterOfGravity + 0.01)) {
                randomFront = keys[Math.floor(Math.random() * keys.length)];
                actualValue = getPayloadValueFromCache(payloadIndex[randomFront]);
                await setPayloadValue(payloadIndex[randomFront], amount + actualValue);
            }
            else {
                actualValue = getPayloadValueFromCache(payloadIndex.PREMIUM_ECONOMY);
                await setPayloadValue(payloadIndex.PREMIUM_ECONOMY, amount + actualValue);
            }
        }
        async function increaseRearPayload(amount, requestedCenterOfGravity) {
            let keys = Object.keys(payloadValues[2]);
            let randomRear;
            let actualValue;
            if (centerOfGravity < (requestedCenterOfGravity - 0.05)) {
                actualValue = getPayloadValueFromCache(payloadIndex.REAR_BAGGAGE);
                await setPayloadValue(payloadIndex.REAR_BAGGAGE, amount + actualValue);
            }
            else if (centerOfGravity < (requestedCenterOfGravity - 0.01)) {
                randomRear = keys[Math.floor(Math.random() * keys.length)];
                actualValue = getPayloadValueFromCache(payloadIndex[randomRear]);
                await setPayloadValue(payloadIndex[randomRear], amount + actualValue);
            }
            else {
                actualValue = this.getPayloadValueFromCache(payloadIndex.ECONOMY_CLASS);
                await setPayloadValue(payloadIndex.ECONOMY_CLASS, amount + actualValue);
            }
        }
        
        const tankPriorityValues = [
            {
                'LEFT_MAIN': getTankValue(tankVariables.LEFT_MAIN),
                'RIGHT_MAIN': getTankValue(tankVariables.RIGHT_MAIN)
            },
            { 'CENTER': getTankValue(tankVariables.CENTER) }
        ];
        _internalPayloadValuesCache = [];
        let payloadValues = getPayloadValues();
        let centerOfGravity = getCenterOfGravity();

        if (!requestedPayload) {
            requestedPayload = getTotalPayload(true);
        }
        if (!requestedCenterOfGravity) {
            requestedCenterOfGravity = getCenterOfGravity();
        }
        if (!requestedFuel) {
            requestedFuel = getTotalFuel();
        }
        if (isPayloadManagerExecuted) {
            B777_FMC_PayloadManager.ShowPage(fmc);
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
        let totalFuel = getTotalFuel() * weightPerGallon;
        let fobToRender = totalFuel.toFixed(2);
        let fobReqToRender = (requestedFuel ? (requestedFuel * weightPerGallon).toFixed(2) : fobToRender);
        let totalPayload = getTotalPayload(useImperial);
        let payloadToRender = totalPayload.toFixed(0);
        let payloadReqToRender = (requestedPayload ? (requestedPayload * payloadModifier).toFixed(0) : payloadToRender);
        (requestedFuel ? requestedFuel.toFixed(2) : getTotalFuel().toFixed(2));
        
        fmc.setTemplate([
            ["PAYLOAD MANAGER"],
            ["INPUT", "OUTPUT"],
            ["", ""],
            ["CG", "CG"],
            [(requestedCenterOfGravity ? requestedCenterOfGravity.toFixed(2) + '%' : centerOfGravity.toFixed(2) + '%'), getCenterOfGravity().toFixed(2) + '%'],
            ["FOB (" + units + ")", "FOB (" + units + ")"],
            [fobReqToRender, fobToRender],
            ["PAYLOAD (" + units + ")", "PAYLOAD (" + units + ")"],
            [payloadReqToRender, payloadToRender],
            ["", ""],
            [(remainingPayload ? 'REMAINING PAYLOAD' : ''), (remainingPayload ? remainingPayload + ' lb' : '')],
            ["\xa0RETURN TO", ""],
            ["<INDEX", "EXECUTE>"]
        ]);

        /* LSK2 */
        fmc.onLeftInput[1] = () => {
            let value = fmc.inOut;
            if (isFinite(parseFloat(value))) {
                if (parseFloat(value) > getMinCenterOfGravity() && parseFloat(value) < getMaxCenterOfGravity()) {
                    fmc.requestedCenterOfGravity = parseFloat(value);
                    fmc.clearUserInput();
                    B777_FMC_PayloadManager.ShowPage(fmc);
                }
                else {
                    fmc.showErrorMessage('OUT OF RANGE');
                    return false;
                }
            }
            else {
                tfmc.showErrorMessage(fmc.defaultInputErrorMessage);
                return false;
            }
        };

        /* LSK3 */
        fmc.onLeftInput[2] = () => {
            let value = fmc.inOut;
            if (isFinite(parseFloat(value))) {
                let useImperial = !SaltyDataStore.get("OPTIONS_UNITS", "KG");
                let requestedInGallons;
                let weightPerGallon;
                if (useImperial) {
                    weightPerGallon = SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'pounds');
                }
                else {
                    weightPerGallon = SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'kilograms');
                }
                requestedInGallons = parseFloat(this.fmc.inOut) / weightPerGallon;
                if (parseFloat(requestedInGallons) > B787_10_FMC_PayloadManagerPage.getMinFuel && parseFloat(requestedInGallons) < B787_10_FMC_PayloadManagerPage.getMaxFuel) {
                    fmc.requestedFuel = parseFloat(requestedInGallons);
                    fmc.clearUserInput();
                    B777_FMC_PayloadManager.ShowPage(fmc);
                }
                else {
                    fmc.showErrorMessage('OUT OF RANGE');
                    return false;
                }
            }
            else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
                return false;
            }
        };
       
        /* LSK4 */
        fmc.onLeftInput[3] = () => {
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
                if (parseFloat(requestedInPounds) > getMinPayload() && parseFloat(requestedInPounds) < getMaxPayload()) {
                    fmc.requestedPayload = parseFloat(requestedInPounds);
                    fmc.clearUserInput();
                    B777_FMC_PayloadManager.ShowPage(fmc);
                } else {
                    fmc.showErrorMessage('OUT OF RANGE');
                    return false;
                }
            } else {
                fmc.showErrorMessage(fmc.defaultInputErrorMessage);
                return false;
            }
       };
        /* LSK6 */
        fmc.onLeftInput[5] = () => {
            FMC_Menu.ShowPage(fmc);
        }

        
        /* RSK6 */
        fmc.onRightInput[5] = () => {
            isPayloadManagerExecuted = true;
            flushFuelAndPayload().then(() => {
                if (requestedFuel) {
                 calculateTanks(requestedFuel);
                } else {
                    calculateTanks(getTotalFuel());
                }
                if (requestedPayload) {
                    calculatePayload(requestedPayload).then(() => {
                    isPayloadManagerExecuted = false;
                    });
                } else {
                    calculatePayload(getTotalPayload(true)).then(() => {
                    isPayloadManagerExecuted = false;
                    });
                }
                B777_FMC_PayloadManager.ShowPage(fmc);
            })
        };
    };
};
      