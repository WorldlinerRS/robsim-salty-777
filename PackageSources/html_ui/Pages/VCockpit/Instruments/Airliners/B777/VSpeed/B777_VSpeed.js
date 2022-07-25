class B777_VSpeed extends Boeing_FCU.VSpeed {
    get templateID() { return "B777_VSpeed"; }
    
    shouldBeVisible() {
        return SimVar.GetSimVarValue("L:AP_VS_ACTIVE", "number") === 1;
    }
}
registerInstrument("b777-vspeed-element", B777_VSpeed);
//# sourceMappingURL=B747_8_VSpeed.js.map