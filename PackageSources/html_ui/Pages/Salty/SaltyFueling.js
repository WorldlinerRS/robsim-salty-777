function airplaneCanFuel() {
    const gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots");
    const isOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
    const eng1Running = SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool");
    const eng2Running = SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool");

    return !(gs > 0.1 || eng1Running || eng2Running || !isOnGround);
}
const REFUEL_FACTOR = 2;
const CENTER_MODIFIER = 3;

class SaltyFueling {
    constructor() {
    }
    
    init() {
        const totalFuelGallons = 59700;
        const fuelWeight = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms");
        const usingMetrics = SimVar.GetSimVarValue("L:SALTY_UNIT_IS_METRIC", "Number");


    
        const mainLeftCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
        const mainRightCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
        const centerCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");
        const total = Math.round(
                (mainLeftCurrentSimVar) + (mainRightCurrentSimVar) + (centerCurrentSimVar)
            );
        const totalConverted = Math.round(total * fuelWeight * usingMetrics);
        SimVar.SetSimVarValue("L:777_FUEL_TOTAL_DESIRED", "Number", total);
        SimVar.SetSimVarValue("L:777_FUEL_DESIRED", "Number", totalConverted);
        SimVar.SetSimVarValue("L:777_FUEL_DESIRED_PERCENT", "Number", Math.round((total / totalFuelGallons) * 100));
    }

    defuelTank(multiplier) {
        return -REFUEL_FACTOR * multiplier;
    }

    refuelTank(multiplier) {
        return REFUEL_FACTOR * multiplier;
    }
    
    update(_deltaTime) {
        /* Fuel current sim vars */
        const mainLeftCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
        const mainRightCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
        const centerCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");

        const refuelStartedByUser = SimVar.GetSimVarValue("L:777_FUELING_STARTED_BY_USR", "Bool");
        const isOnGround = SimVar.GetSimVarValue("SIM ON GROUND", "Bool");
        const refuelingRate = SaltyDataStore.get("777_REFUEL_RATE_SETTING", "REAL");
        if (!refuelStartedByUser) {
            return;
        }
        if ((!airplaneCanFuel() && refuelingRate == 'REAL') || (!airplaneCanFuel() && refuelingRate == 'FAST') || (refuelingRate == 'INSTANT' && !isOnGround)) {
            return;
        }
        
        /* Fuel target sim vars */
        const mainLeftTargetSimVar = SimVar.GetSimVarValue(`L:777_FUEL_TANK_LEFT_MAIN_QUANTITY_DESIRED`, "Gallons");
        const mainRightTargetSimVar = SimVar.GetSimVarValue(`L:777_FUEL_TANK_RIGHT_MAIN_QUANTITY_DESIRED`, "Gallons");
        const centerTargetSimVar = SimVar.GetSimVarValue(`L:777_FUEL_TANK_CENTER_QUANTITY_DESIRED`, "Gallons");
        let mainLeftCurrent = mainLeftCurrentSimVar;
        let mainRightCurrent = mainRightCurrentSimVar;
        let centerCurrent = centerCurrentSimVar;
        let mainLeftTarget = mainLeftTargetSimVar;
        let mainRightTarget = mainRightTargetSimVar;
        let centerTarget = centerTargetSimVar;

        if (refuelingRate == "INSTANT") {
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", mainLeftTarget);
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", mainRightTarget);
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerTarget);
            return;
        }
        let multiplier = 1;
        if (refuelingRate == "FAST") {
            multiplier = 3;
        }
        //DEFUELING (order is CENTER, MAIN)
        /* Center */
        if (centerCurrent > centerTarget) {
            centerCurrent += this.defuelTank(multiplier);
            if (centerCurrent < centerTarget) {
                centerCurrent = centerTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }
        /* Main Left and Right */
        if (mainLeftCurrent > mainLeftTarget || mainRightCurrent > mainRightTarget) {
            mainLeftCurrent += this.defuelTank(multiplier) / 2;
            mainRightCurrent += this.defuelTank(multiplier) / 2;
            if (mainLeftCurrent < mainLeftTarget) {
                mainLeftCurrent = mainLeftTarget;
            }
            if (mainRightCurrent < mainRightTarget) {
                mainRightCurrent = mainRightTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", mainLeftCurrent);
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", mainRightCurrent);
            if (mainLeftCurrent != mainLeftTarget || mainRightCurrent != mainRightTarget) {
                return;
            }
        }

        // REFUELING (order is MAIN, CENTER)
        /* Main Left and Right */
        if (mainLeftCurrent < mainLeftTarget || mainRightCurrent < mainRightTarget) {
            mainLeftCurrent += this.refuelTank(multiplier) / 2;
            mainRightCurrent += this.refuelTank(multiplier) / 2;
            if (mainLeftCurrent > mainLeftTarget) {
                mainLeftCurrent = mainLeftTarget;
            }
            if (mainRightCurrent > mainRightTarget) {
                mainRightCurrent = mainRightTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", mainLeftCurrent);
            SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", mainRightCurrent);
            if (mainLeftCurrent != mainLeftTarget || mainRightCurrent != mainRightTarget) {
                return;
            }
        }
        /* Center */
        if (centerCurrent < centerTarget) {
            centerCurrent += this.refuelTank(multiplier);
            if (centerCurrent > centerTarget) {
                centerCurrent = centerTarget;
            }
            SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", centerCurrent);
            if (centerCurrent != centerTarget) {
                return;
            }
        }

        // Done fueling
        SimVar.SetSimVarValue("L:777_FUELING_STARTED_BY_USR", "Bool", false);
    }
}