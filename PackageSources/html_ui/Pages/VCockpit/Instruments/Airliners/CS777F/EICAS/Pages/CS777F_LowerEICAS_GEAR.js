var B777_LowerEICAS_GEAR;
(function (B777_LowerEICAS_GEAR) {
    class Display extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "B777LowerEICASGEARTemplate" }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.isInitialised = true;
            this.gearDoorOpenLines = document.querySelector("#open-labels");
            this.gearDoorClosedText = document.querySelector("#closed-labels");
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            var GearDoorsOpen = SimVar.GetSimVarValue("GEAR POSITION", "enum");
            var GearAnimClosed = SimVar.GetSimVarValue("GEAR ANIMATION POSITION", "percent");
        		
            if ((GearDoorsOpen == 1) || (GearAnimClosed == 0)) {
            	this.gearDoorOpenLines.style.visibility = "hidden";
            	this.gearDoorClosedText.style.visibility = "visible";
            } else {
            	this.gearDoorOpenLines.style.visibility = "visible";   
            	this.gearDoorClosedText.style.visibility = "hidden";
            }
        }
    }
    B777_LowerEICAS_GEAR.Display = Display;
})(B777_LowerEICAS_GEAR || (B777_LowerEICAS_GEAR = {}));
customElements.define("b777-lower-eicas-gear", B777_LowerEICAS_GEAR.Display);
//# sourceMappingURL=B747_8_LowerEICAS_GEAR.js.map