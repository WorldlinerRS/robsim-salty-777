class B747_8_HDG extends Boeing_FCU.HDG {

    constructor() {
        super();
        this.isInitialized = false;
    }
    get templateID() { return "B747_8_HDG"; }
    
    init() {
        this.isInitialized = true;
    }

    update(_deltaTime) {
        if (!this.isInitialized) {
            return;
        } 
    }
}
registerInstrument("b747-8-hdg-element", B747_8_HDG);
//# sourceMappingURL=B747_8_HDG.js.map