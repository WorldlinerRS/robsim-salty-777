class B777_ATC extends Airliners.BaseATC {
    get templateID() { return "B777_ATC"; }
    Init() {
        super.Init();
        this.emptySlot = "";
    }
    refreshValue() {
        super.refreshValue();
        if (this.valueText != null && this.valueText.textContent == "") {
            diffAndSetText(this.valueText, "0000");
        }
    }
}
registerInstrument("b777-atc", B777_ATC);
//# sourceMappingURL=B747_8_ATC.js.map