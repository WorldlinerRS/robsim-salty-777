class SaltyIRS {
    constructor() {
        console.log("SaltyIRS loaded");
    }
    init() {
        this.irsTimer = -1;
    }
    update(electricityIsAvail) {
        // Calculate deltatime
        var timeNow = Date.now();
        if (this.lastTime == null) this.lastTime = timeNow;
        var deltaTime = timeNow - this.lastTime;
        this.lastTime = timeNow;

        if (!electricityIsAvail) return;

        var IRSState = SimVar.GetSimVarValue("L:SALTY_IRS_STATE", "Enum");
        SimVar.SetSimVarValue("L:SALTY_IRS_TIME_LEFT", "Enum", this.irsTimer);

        if (IRSState != 0) {
            SimVar.SetSimVarValue("L:SALTY_IRS_STATE", "Enum", 2);
            IRSState = 0;
        }

        if (IRSState == 0) {
            SimVar.SetSimVarValue("L:SALTY_IRS_STATE", "Enum", 2);
            IRSState = 1;
        }

        if (IRSState == 1) {
            SimVar.SetSimVarValue("L:SALTY_IRS_STATE", "Enum", 2);
        }
    }
}
