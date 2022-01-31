class B747_8_HDG extends Boeing_FCU.HDG {
    constructor() {
        super();
        this.m_isVisible = false;
        this.modeElement = null;
        this.isTRKMode = false;
        this.isInitialized = false;
    }

    get templateID() { return "B747_8_HDG"; }
    
    init() {
        this.isInitialized = true;
    }

    connectedCallback() {
        super.connectedCallback();
        this.modeElement = this.querySelector("#mode");
        if (this.modeElement != null) {
            diffAndSetText(this.modeElement, "");
        }
        if (this.valueElement != null) {
            this.valueElement.isVisible = false;
        }
    }
    onFlightStart() {
        super.onFlightStart();
        var simHeading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        Coherent.call("HEADING_BUG_SET", 1, Math.round(simHeading));
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (!this.isInitialized) {
            return;
        }
        var visible = this.shouldBeVisible();
        var trkMode = Simplane.getAutoPilotTRKModeActive();
        if ((visible != this.m_isVisible) || (trkMode != this.isTRKMode)) {
            this.m_isVisible = visible;
            this.isTRKMode = trkMode;
            if (this.modeElement != null) {
                diffAndSetText(this.modeElement, this.m_isVisible ? (this.isTRKMode ? "TRK" : "HDG") : "");
            }
            if (this.valueElement != null) {
                this.valueElement.isVisible = this.m_isVisible;
            }
        }
    }
    shouldBeVisible() {
        return true;
    }
    createValueElement() {
        return new Airliners.DynamicValueComponent(this.querySelector("#value"), this.getCurrentValue.bind(this), 0, this.formatValueToString.bind(this));
    }
    getCurrentValue() {
        if (this.isTRKMode) {
            return Simplane.getAutoPilotTrackAngle();
        }
        else {
            return Simplane.getAutoPilotSelectedHeadingLockValueDegrees();
        }
    }
    formatValueToString(_value, _dp = 0) {
        return Utils.leadingZeros(_value % 360, 3, _dp);
    }
}
registerInstrument("b747-8-hdg-element", B747_8_HDG);
//# sourceMappingURL=B747_8_HDG.js.map