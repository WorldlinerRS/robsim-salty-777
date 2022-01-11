class B747_8_VSpeed extends Boeing_FCU.VSpeed {
    
    constructor() {
        super();
        this.m_isVisible = false;
        this.modeElement = null;
        this.isFPAMode = false;
        this.isInitialized = false;
    }

    get templateID() { return "B747_8_VSpeed"; }
    
    shouldBeVisible() {
        return SimVar.GetSimVarValue("L:AP_VS_ACTIVE", "number") === 1;
    }
    init() {
        this.isInitialized = true;
    }
    connectedCallback() {
        super.connectedCallback();
        this.modeElement = this.querySelector("#mode");
        if (this.modeElement != null) {
            diffAndSetText(this.modeElement, "V/S");
        }
        if (this.valueElement != null) {
            this.valueElement.isVisible = false;
        }
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (!this.isInitialized) {
            return;
        }
        var visible = this.shouldBeVisible();
        var fpaMode = Simplane.getAutoPilotFPAModeActive();
        if ((visible != this.m_isVisible) || (fpaMode != this.isFPAMode)) {
            this.m_isVisible = visible;
            this.isFPAMode = fpaMode;
            if (this.modeElement != null) {
                diffAndSetText(this.modeElement, this.isFPAMode ? "FPA" : "V/S");
            }
            if (this.valueElement != null) {
                this.valueElement.isVisible = this.m_isVisible;
            }
        }
    }
    createValueElement() {
        return new Airliners.DynamicValueComponent(this.querySelector("#value"), this.getCurrentValue.bind(this), 0, this.formatValueToString.bind(this));
    }
    getCurrentValue() {
        if (this.isFPAMode) {
            return -Simplane.getAutoPilotFlightPathAngle();
        }
        else {
            return Simplane.getAutoPilotVerticalSpeedHoldValue();
        }
    }
    formatValueToString(_value, _dp = 0) {
        if (this.isFPAMode) {
            return ((_value > 0) ? "+" : "") + fastToFixed(_value, 1);
        }
        else {
            return ((_value > 0) ? "+" : "") + fastToFixed(_value, 0);
        }
    }
}
registerInstrument("b747-8-vspeed-element", B747_8_VSpeed);
//# sourceMappingURL=B747_8_VSpeed.js.map