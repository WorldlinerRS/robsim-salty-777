class SaltyStates {
    constructor() {
        console.log("SaltyStates loaded");
        this.flightHasLoaded = false;

        this.mainLeftstored = SaltyDataStore.get("777_LEFT_LAST_QUANTITY", '') ? parseFloat(SaltyDataStore.get("777_LEFT_LAST_QUANTITY", '')) : "";
        console.log(this.main1stored + " main1 on construct")
        this.mainRightstored = SaltyDataStore.get("777_RIGHT_LAST_QUANTITY", '') ? parseFloat(SaltyDataStore.get("777_RIGHT_LAST_QUANTITY", '')) : "";
        this.centerstored = SaltyDataStore.get("777_CENTER_LAST_QUANTITY", '') ? parseFloat(SaltyDataStore.get("777_CENTER_LAST_QUANTITY", '')) : "";
    }// ends constructor

    onFlightStart() {
        console.log("mainLeft stored on flight start " + this.mainLeftstored);
        
        // Load last fuel quantity
        SimVar.SetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons", this.mainLeftstored);
        SimVar.SetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons", this.mainRightstored);
        SimVar.SetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons", this.centerstored);
        this.flightHasLoaded = true;
        
        var timerMilSecs = 10000;
        if (this.flightHasLoaded) {
            var timer = window.setInterval(saveAcftState, timerMilSecs);

            function saveAcftState() {
                // Stores last fuel quantity
        
                const mainLeftCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK LEFT MAIN QUANTITY", "Gallons");
                const mainRightCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK RIGHT MAIN QUANTITY", "Gallons");
                const centerCurrentSimVar = SimVar.GetSimVarValue("FUEL TANK CENTER QUANTITY", "Gallons");

                SaltyDataStore.set("777_LEFT_LAST_QUANTITY", mainLeftCurrentSimVar.toString());
                SaltyDataStore.set("777_RIGHT_LAST_QUANTITY", mainRightCurrentSimVar.toString());
                SaltyDataStore.set("777_CENTER_LAST_QUANTITY", centerCurrentSimVar.toString());
                console.log(SaltyDataStore.get("777_LEFT_LAST_QUANTITY") + " mainLeft");
            }
        }// ends if flighthasstarted
    }// ends onflightstart
}