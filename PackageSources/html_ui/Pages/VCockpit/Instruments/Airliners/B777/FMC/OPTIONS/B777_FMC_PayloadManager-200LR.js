class B777_FMC_PayloadManager {
    
    constructor(fmc) {
        this.fmc = fmc;
        this.tankPriorityValues = [];
		this.payloadValues = [];
		this.init();
    }
    // amount of fuel on 200LR
    static get tankCapacity() {
        return {
            "CENTER": 27290,
            "LEFT_MAIN": 10300,
            "RIGHT_MAIN": 10300
        };
    }

    static get tankPriority() {
        return [["LEFT_MAIN", "RIGHT_MAIN"], ["CENTER"]];
    }

    static get tankVariables() {
        return {
            "CENTER": "FUEL TANK CENTER QUANTITY",
            "LEFT_MAIN": "FUEL TANK LEFT MAIN QUANTITY",
            "RIGHT_MAIN": "FUEL TANK RIGHT MAIN QUANTITY"
        };
    }

    static get payloadIndex() {
        return {
            "PILOT": 1,
            "COPILOT": 2,
            "CREW": 3,
            "BUSINESS_CLASS": 4,
            "PREMIUM_ECONOMY": 5,
            "FORWARD_ECONOMY": 6,
            "REAR_ECONOMY": 7,
            "FORWARD_BAGGAGE": 8,
            "REAR_BAGGAGE": 9
        };
    }

    static get isPayloadManagerExecuted() {
		return this._isPayloadManagerExecuted;
	}

	static set isPayloadManagerExecuted(value) {
		this._isPayloadManagerExecuted = value;
	}

	static get centerOfGravity() {
		return this._centerOfGravity;
	}

	static set centerOfGravity(value) {
		this._centerOfGravity = value;
	}

	static get requestedCenterOfGravity() {
		return this._requestedCenterOfGravity || null;
	}

	static set requestedCenterOfGravity(value) {
		this._requestedCenterOfGravity = value;
	}

	static get requestedFuel() {
		return this._requestedFuel || null;
	}

	static set requestedFuel(value) {
		this._requestedFuel = value;
	}

	static get requestedPayload() {
		return this._requestedPayload || null;
	}

	static set requestedPayload(value) {
		this._requestedPayload = value;
	}

	static get remainingPayload() {
		return this._remainingPayload || null;
	}

	static set remainingPayload(value) {
		this._remainingPayload = value;
	}

	static get zeroFuelCenterOfGravity() {
		return this.fmc.zeroFuelWeightMassCenter;
	}

	static set zeroFuelCenterOfGravity(value) {
		this.fmc.zeroFuelWeightMassCenter = value;
	}

	static get zeroFuelWeight() {
		return this.fmc.zeroFuelWeight;
	}

	static set zeroFuelWeight(value) {
		this.fmc.zeroFuelWeight = value;
	}

	static get getMaxFuel(){
		return 47890;
	}

	static get getMinFuel(){
		return 0;
	}

	static get getMaxPayload(){
		return 766800;
	}

	static get getMinPayload(){
		return 0;
	}

	static get getMaxCenterOfGravity(){
		return 44.0;
	}

	static get getMinCenterOfGravity(){
		return 14.0;
	}

    init() {
        this.tankPriorityValues = [
            {
                "LEFT_MAIN": this.getTankValue(B777_FMC_PayloadManager.tankVariables.LEFT_MAIN),
                "RIGHT_MAIN": this.getTankValue(B777_FMC_PayloadManager.tankVariables.RIGHT_MAIN)
            },
            { "CENTER": this.getTankValue(B777_FMC_PayloadManager.tankVariables.CENTER) }
        ];
		this._internalPayloadValuesCache = [];
        this.payloadValues = this.getPayloadValues();

		B777_FMC_PayloadManager.centerOfGravity = this.getCenterOfGravity();
    }

    getPayloadValues() {
		return [
            {
                "PILOT": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.PILOT),
                "COPILOT": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.COPILOT),
                "CREW": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.CREW),
            },
            {
                "BUSINESS_CLASS": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.BUSINESS_CLASS),
                "PREMIUM_ECONOMY": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.PREMIUM_ECONOMY),
                "FORWARD_BAGGAGE": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.FORWARD_BAGGAGE)
            },
            {
                "FORWARD_ECONOMY": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.FORWARD_ECONOMY),
                "REAR_ECONOMY": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.REAR_ECONOMY),
                "REAR_BAGGAGE": this.getPayloadValue(B777_FMC_PayloadManager.payloadIndex.REAR_BAGGAGE)
            }
        ];
	}

    getPayloadValue(index) {
		return SimVar.GetSimVarValue("PAYLOAD STATION WEIGHT:" + index, "Pounds");
	}

	getPayloadValueFromCache(index) {
		return this._internalPayloadValuesCache[index];
	}

	async setPayloadValue(index, value) {
		this._internalPayloadValuesCache[index] = value;
        return SimVar.SetSimVarValue("PAYLOAD STATION WEIGHT:"+ index, "Pounds", value);
	}

	getTankValue(variable) {
		return SimVar.GetSimVarValue(variable, "Gallons");
	}

	getCenterOfGravity() {
		return SimVar.GetSimVarValue("CG PERCENT", "Percent");
	}

	getTotalPayload(useLbs = false) {
		let payload = 0;
		this.payloadValues.forEach((group) => {
			Object.values(group).forEach((sectionValue) => {
				payload = payload + sectionValue;
			});
		});
		return (useLbs ? payload : payload * 0.45359237);
	}

	getTotalFuel(useLbs = false) {
		let fuel = 0;
		this.tankPriorityValues.forEach((group) => {
			Object.values(group).forEach((sectionValue) => {
				fuel = fuel + sectionValue;
			});
		});
		return (useLbs ? fuel * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "Pounds") : fuel);
	}

	async flushFuelAndPayload() {
		return new Promise(resolve => {
			this.flushFuel().then(() => {
				return this.resetPayload();
			}).then(() => {
				return this.fmc.getCurrentWeight(true);
			}).then(weight => {
				return this.fmc.setZeroFuelWeight((320000 + B777_FMC_PayloadManager.requestedPayload) / 1000, EmptyCallback.Void, true);
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
			B777_FMC_PayloadManager.tankPriority.forEach((tanks, index) => {
				tanks.forEach((tank) => {
					setTankFuel(B777_FMC_PayloadManager.tankVariables[tank], 0).then(() => {
						console.log(B777_FMC_PayloadManager.tankVariables[tank] + ' flushed');
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
		B777_FMC_PayloadManager.tankPriority.forEach((tanks, index) => {
			tanks.forEach((tank) => {
				setTankFuel(B777_FMC_PayloadManager.tankVariables[tank], this.tankPriorityValues[index][tank]).then(() => {
					console.log(B777_FMC_PayloadManager.tankVariables[tank] + ' set to ' + this.tankPriorityValues[index][tank]);
				});
			});
		});
		this.fmc.trySetBlockFuel(fuelBlock * SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'Pounds') / 1000, true);
    }

    calculateMainTanks(fuel) {
        let remainingFuel = 0;
        let tanksCapacity = (B777_FMC_PayloadManager.tankCapacity.LEFT_MAIN * 2);
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
        let tankCapacity = B777_FMC_PayloadManager.tankCapacity.CENTER;
        if (fuel > tankCapacity) {
            remainingFuel = fuel - tankCapacity;
            fuel = tankCapacity;
        }
        this.tankPriorityValues[1].CENTER = fuel;
        return remainingFuel;
    }

    showPage() {
        this.fmc.clearDisplay();

        this.payloadValues = this.getPayloadValues();

		if (!B777_FMC_PayloadManager.requestedPayload) {
			B777_FMC_PayloadManager.requestedPayload = this.getTotalPayload(true);
		}
		if (!B777_FMC_PayloadManager.requestedCenterOfGravity) {
			B777_FMC_PayloadManager.requestedCenterOfGravity = 23.2;
		}
		if (!B777_FMC_PayloadManager.requestedFuel) {
			B777_FMC_PayloadManager.requestedFuel = this.getTotalFuel();
		}

		if (B777_FMC_PayloadManager.isPayloadManagerExecuted) {
			this.fmc.refreshPageCallback = () => {
				this.showPage();
			};
		}

		let weightPerGallon;
        let units;
        let payloadModifier;
		let useImperial;
		const storedUnits = SaltyDataStore.get("OPTIONS_UNITS", "KG");
        switch (storedUnits) {
            case "KG":
                useImperial = false;
                break;
            case "LBS":
                useImperial = true;
                break;
            default:
                useImperial = false;
        }
        if (useImperial) {
            weightPerGallon = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds");
            units = "Lbs";
            payloadModifier = 1.0;
        }
        else {
            weightPerGallon = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms");
            units = "Kg";
            payloadModifier = 0.45359237;
        }
        const totalFuel = this.getTotalFuel() * weightPerGallon;
		const cgToRender = this.getCenterOfGravity().toFixed(2);
		const cgReqToRender = (B777_FMC_PayloadManager.requestedCenterOfGravity ? B777_FMC_PayloadManager.requestedCenterOfGravity.toFixed(2) : cgToRender);
        const fobToRender = totalFuel.toFixed(2);
        const fobReqToRender = (B777_FMC_PayloadManager.requestedFuel ? (B777_FMC_PayloadManager.requestedFuel * weightPerGallon).toFixed(2) : fobToRender);
        const totalPayload = this.getTotalPayload(useImperial);
        const payloadToRender = totalPayload.toFixed(0);
        const payloadReqToRender = (B777_FMC_PayloadManager.requestedPayload ? (B777_FMC_PayloadManager.requestedPayload * payloadModifier).toFixed(0) : payloadToRender);
        (B777_FMC_PayloadManager.requestedFuel ? B777_FMC_PayloadManager.requestedFuel.toFixed(2) : this.getTotalFuel().toFixed(2));
		
		var rows = [
            ["PAYLOAD MANAGER"],
            ["REQ INPUT", "ACT VALUES"],
            ["", ""],
            ["CG", "CG"],
            [cgReqToRender + " %", cgToRender + " %"],
            ["FOB (" + units + ")", "FOB (" + units + ")"],
            [fobReqToRender, fobToRender],
            ["PAYLOAD (" + units + ")", "PAYLOAD (" + units + ")"],
            [payloadReqToRender, payloadToRender],
			[(B777_FMC_PayloadManager.remainingPayload ? "REMAINING PAYLOAD" : ""), ""],
            [(B777_FMC_PayloadManager.remainingPayload ? B777_FMC_PayloadManager.remainingPayload + " lb" : "") , ""],
            ["\xa0RETURN TO", ""],
            ["<INDEX", "EXECUTE>"]
        ];

        /* LSK2 */
        this.fmc.onLeftInput[1] = () => {
            if (isFinite(parseFloat(this.fmc.inOut))) {
				let cgToSet = parseFloat(this.fmc.inOut);
                if (cgToSet > B777_FMC_PayloadManager.getMinCenterOfGravity && cgToSet < B777_FMC_PayloadManager.getMaxCenterOfGravity) {
                    B777_FMC_PayloadManager.requestedCenterOfGravity = cgToSet;
					this.fmc.clearUserInput();
                    this.showPage();
                }
                else {
                    this.fmc.showErrorMessage("OUT OF RANGE");
                    return false;
                }
            }
            else {
                this.fmc.showErrorMessage(this.fmc.defaultInputErrorMessage);
                return false;
            }
        };

        /* LSK3 */
        this.fmc.onLeftInput[2] = () => {
            if(isFinite(parseFloat(this.fmc.inOut))){
				let useImperial;
				const storedUnits = SaltyDataStore.get("OPTIONS_UNITS", "KG");
        		switch (storedUnits) {
					case "KG":
						useImperial = false;
						break;
					case "LBS":
						useImperial = true;
						break;
					default:
						useImperial = false;
				}
				let requestedInGallons;
                let weightPerGallon;
                if (useImperial) {
                    weightPerGallon = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds");
                }
                else {
                    weightPerGallon = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms");
                }
				requestedInGallons = parseFloat(this.fmc.inOut) / weightPerGallon;
				if (parseFloat(requestedInGallons) > B777_FMC_PayloadManager.getMinFuel && parseFloat(requestedInGallons) < B777_FMC_PayloadManager.getMaxFuel) {
					B777_FMC_PayloadManager.requestedFuel = parseFloat(requestedInGallons);
					this.fmc.clearUserInput();
					this.showPage();
				}
				else {
					this.fmc.showErrorMessage("OUT OF RANGE");
					return false;
				}
			}
			else {
				this.fmc.showErrorMessage(this.fmc.defaultInputErrorMessage);
				return false;
			}
        };
       
        /* LSK4 */
        this.fmc.onLeftInput[3] = () => {
			if (isFinite(parseFloat(this.fmc.inOut))) {
				let useImperial;
				const storedUnits = SaltyDataStore.get("OPTIONS_UNITS", "KG");
        		switch (storedUnits) {
					case "KG":
						useImperial = false;
						break;
					case "LBS":
						useImperial = true;
						break;
					default:
						useImperial = false;
				}
            	let requestedInPounds;
            	let payloadModifier;
            	if (useImperial) {
                	payloadModifier = 1.0;
            	}
            	else {
                	payloadModifier = 2.20462262;
            	}
            	requestedInPounds = parseFloat(this.fmc.inOut) * payloadModifier;
            	if (parseFloat(requestedInPounds) > B777_FMC_PayloadManager.getMinPayload && parseFloat(requestedInPounds) < B777_FMC_PayloadManager.getMaxPayload) {
                	B777_FMC_PayloadManager.requestedPayload = parseFloat(requestedInPounds);
                	this.fmc.clearUserInput();
                	this.showPage();
            	}
            	else {
                	this.fmc.showErrorMessage("OUT OF RANGE");
                	return false;
                }
            }
			else {
                    this.fmc.showErrorMessage(this.fmc.defaultInputErrorMessage);
                    return false;
            }
       };
        /* LSK6 */
        this.fmc.onLeftInput[5] = () => {
            FMC_Menu.ShowPage(this.fmc);
        }

        /* RSK6 */
        if (B777_FMC_PayloadManager.isPayloadManagerExecuted){
			rows[12][1] = "RUNNING...";
		} else {
			rows[12][1] = "EXECUTE>";
			this.fmc.onRightInput[5] = () => {
				B777_FMC_PayloadManager.isPayloadManagerExecuted = true;
				this.flushFuelAndPayload().then(() => {
					if (B777_FMC_PayloadManager.requestedFuel) {
						this.calculateTanks(B777_FMC_PayloadManager.requestedFuel);
					}
					else {
						this.calculateTanks(this.getTotalFuel());
					}
					if (B777_FMC_PayloadManager.requestedPayload) {
						this.calculatePayload(B777_FMC_PayloadManager.requestedPayload);
						B777_FMC_PayloadManager.isPayloadManagerExecuted = false;
					}
					else {
						this.calculatePayload(this.getTotalPayload(true));
						B777_FMC_PayloadManager.isPayloadManagerExecuted = false;
					}
					this.showPage();
				});
			};
		}

        this.fmc.setTemplate(rows);
    }

    async resetPayload() {
		await this.setPayloadValue(1, 0);
		await this.setPayloadValue(2, 0);
		await this.setPayloadValue(3, 0);
		await this.setPayloadValue(4, 0);
		await this.setPayloadValue(5, 0);
		await this.setPayloadValue(6, 0);
		await this.setPayloadValue(7, 0);
		await this.setPayloadValue(8, 0);
		await this.setPayloadValue(9, 0);
	}

    async calculatePayload(requestedPayload) {
		await this.resetPayload();
		B777_FMC_PayloadManager.remainingPayload = requestedPayload;
		let amount = 0;
		let requestedCenterOfGravity = (B777_FMC_PayloadManager.requestedCenterOfGravity ? B777_FMC_PayloadManager.requestedCenterOfGravity : 23.2);
		while (B777_FMC_PayloadManager.remainingPayload > 0) {
			B777_FMC_PayloadManager.centerOfGravity = this.getCenterOfGravity();
			if (B777_FMC_PayloadManager.remainingPayload > 30000) {
				amount = 1000;
			} else if (B777_FMC_PayloadManager.remainingPayload > 10000) {
				amount = 200;
			} else if (B777_FMC_PayloadManager.remainingPayload > 5000) {
				amount = 100;
			} else if (B777_FMC_PayloadManager.remainingPayload > 50) {
				amount = 50;
			} else {
				amount = B777_FMC_PayloadManager.remainingPayload;
			}

			if (B777_FMC_PayloadManager.centerOfGravity > requestedCenterOfGravity) {
				await this.increaseFrontPayload(amount, requestedCenterOfGravity);
				B777_FMC_PayloadManager.remainingPayload = B777_FMC_PayloadManager.remainingPayload - amount;
			} else {
				await this.increaseRearPayload(amount, requestedCenterOfGravity);
				B777_FMC_PayloadManager.remainingPayload = B777_FMC_PayloadManager.remainingPayload - amount;
			}
			this.showPage();
		}
	}

	async increaseFrontPayload(amount, requestedCenterOfGravity) {
		let keys = Object.keys(this.payloadValues[1]);
		let randomFront;
		let actualValue;
		if (B777_FMC_PayloadManager.centerOfGravity > (requestedCenterOfGravity + 0.05)) {
			actualValue = this.getPayloadValueFromCache(B777_FMC_PayloadManager.payloadIndex.BUSINESS_CLASS);
			await this.setPayloadValue(B777_FMC_PayloadManager.payloadIndex.BUSINESS_CLASS, amount + actualValue);
		} else if (B777_FMC_PayloadManager.centerOfGravity > (requestedCenterOfGravity + 0.01)) {
			randomFront = keys[Math.floor(Math.random() * keys.length)];
			actualValue = this.getPayloadValueFromCache(B777_FMC_PayloadManager.payloadIndex[randomFront]);
			await this.setPayloadValue(B777_FMC_PayloadManager.payloadIndex[randomFront], amount + actualValue);
		} else {
			actualValue = this.getPayloadValueFromCache(B777_FMC_PayloadManager.payloadIndex.PREMIUM_ECONOMY);
			await this.setPayloadValue(B777_FMC_PayloadManager.payloadIndex.PREMIUM_ECONOMY, amount + actualValue);
		}
	}

	async increaseRearPayload(amount, requestedCenterOfGravity) {
		let keys = Object.keys(this.payloadValues[2]);
		let randomRear;
		let actualValue;
		if (B777_FMC_PayloadManager.centerOfGravity < (requestedCenterOfGravity - 0.05)) {
			actualValue = this.getPayloadValueFromCache(B777_FMC_PayloadManager.payloadIndex.REAR_ECONOMY);
			await this.setPayloadValue(B777_FMC_PayloadManager.payloadIndex.REAR_ECONOMY, amount + actualValue);
		} else if (B777_FMC_PayloadManager.centerOfGravity < (requestedCenterOfGravity - 0.01)) {
			randomRear = keys[Math.floor(Math.random() * keys.length)];
			actualValue = this.getPayloadValueFromCache(B777_FMC_PayloadManager.payloadIndex[randomRear]);
			await this.setPayloadValue(B777_FMC_PayloadManager.payloadIndex[randomRear], amount + actualValue);
		} else {
			actualValue = this.getPayloadValueFromCache(B777_FMC_PayloadManager.payloadIndex.FORWARD_ECONOMY);
			await this.setPayloadValue(B777_FMC_PayloadManager.payloadIndex.FORWARD_ECONOMY, amount + actualValue);
		}
	}
}
B777_FMC_PayloadManager.isPayloadManagerExecuted = undefined;
B777_FMC_PayloadManager.centerOfGravity = undefined;
B777_FMC_PayloadManager.requestedCenterOfGravity = null;
B777_FMC_PayloadManager.requestedFuel = null;
B777_FMC_PayloadManager.requestedPayload = null;
B777_FMC_PayloadManager.remainingPayload = null;