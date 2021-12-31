class B747_8_VSpeed extends Boeing_FCU.VSpeed {
    
    constructor() {
        super();
        this.isInitialized = false;
    }
    get templateID() { return "B747_8_VSpeed"; }
    
    shouldBeVisible() {
        return SimVar.GetSimVarValue("L:AP_VS_ACTIVE", "number") === 1;
    }

    init() {
        this.isInitialized = true;
    }

    update(_deltaTime) {
        if (!this.isInitialized) {
            return;
        }

    }
}
registerInstrument("b747-8-vspeed-element", B747_8_VSpeed);
//# sourceMappingURL=B747_8_VSpeed.js.map