var B777_UpperEICAS;
(function (B777_UpperEICAS) {
    class Display extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
            this.tmaDisplay = null;
            this.allValueComponents = new Array();
            this.allEngineInfos = new Array();
            this.gearDisplay = null;
            this.flapsDisplay = null;
            this.stabDisplay = null;
            this.allAntiIceStatus = new Array();
            this.gallonToMegagrams = 0;
            this.gallonToMegapounds = 0;
            this.units;
        }
        get templateID() { return "B777UpperEICASTemplate"; }
        connectedCallback() {
            super.connectedCallback();
        }
        init(_eicas) {
            this.eicas = _eicas;
            this.refThrust = [];
            this.refThrustDecimal = [];
            this.engRevStatus = [];
            this.refThrust[1] = this.querySelector("#THROTTLE1_Value");
            this.refThrust[2] = this.querySelector("#THROTTLE2_Value");
            this.refThrustDecimal[1] = this.querySelector("#THROTTLE1_Decimal");
            this.refThrustDecimal[2] = this.querySelector("#THROTTLE2_Decimal");
            this.unitTextSVG = this.querySelector("#TOTAL_FUEL_Units");
            this.tmaDisplay = new Boeing.ThrustModeDisplay(this.querySelector("#TMA_Value"));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#TAT_Value"), Simplane.getTotalAirTemperature, 0, Airliners.DynamicValueComponent.formatValueToPosNegTemperature));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#SAT_Value"), Simplane.getAmbientTemperature, 0, Airliners.DynamicValueComponent.formatValueToPosNegTemperature));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#THROTTLE1_Value"), Simplane.getEngineThrottleMaxThrust.bind(this, 0), 1, Airliners.DynamicValueComponent.formatValueToThrottleDisplay));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#THROTTLE2_Value"), Simplane.getEngineThrottleMaxThrust.bind(this, 1), 1, Airliners.DynamicValueComponent.formatValueToThrottleDisplay));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#CAB_ALT_Value"), Simplane.getPressurisationCabinAltitude));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#RATE_Value"), Simplane.getPressurisationCabinAltitudeRate));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#DELTAP_Value"), Simplane.getPressurisationDifferential, 1, Airliners.DynamicValueComponent.formatValueToString));
            this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#TOTAL_FUEL_Value"), this.getTotalFuelInMegagrams.bind(this), 1));
            var gaugeTemplate = this.querySelector("#GaugeTemplate1");
            if (gaugeTemplate != null) {
                this.allEngineInfos.push(new B777_EICAS_Gauge_N1(1, this.querySelector("#N1_1_GAUGE"), gaugeTemplate, true));
                this.allEngineInfos.push(new B777_EICAS_Gauge_N1(2, this.querySelector("#N1_2_GAUGE"), gaugeTemplate, true));
                
                gaugeTemplate.remove();
            }        
            gaugeTemplate = this.querySelector("#GaugeTemplate2");
            if (gaugeTemplate != null) {
                this.allEngineInfos.push(new B777_EICAS_Gauge_EGT(1, this.querySelector("#EGT_1_GAUGE"), gaugeTemplate, true));
                this.allEngineInfos.push(new B777_EICAS_Gauge_EGT(2, this.querySelector("#EGT_2_GAUGE"), gaugeTemplate, true));
                
                gaugeTemplate.remove();
            }
            
            this.infoPanel = new Boeing.InfoPanel(this, "InfoPanel");
            this.infoPanel.init();
            this.infoPanelsManager = new Boeing.InfoPanelsManager();
            this.infoPanelsManager.init(this.infoPanel);
            this.gearDisplay = new Boeing.GearDisplay(this.querySelector("#GearInfo"));
            this.flapsDisplay = new Boeing.FlapsDisplay(this.querySelector("#FlapsInfo"), this.querySelector("#FlapsLine"), this.querySelector("#FlapsValue"), this.querySelector("#FlapsBar"), this.querySelector("#FlapsGauge"));
            this.stabDisplay = new Boeing.StabDisplay(this.querySelector("#StabInfo"), 15, 1);
            this.allAntiIceStatus.push(new WingAntiIceStatus(this.querySelector("#WAI1_Value"), 1));
            this.allAntiIceStatus.push(new WingAntiIceStatus(this.querySelector("#WAI2_Value"), 2));
            this.gallonToMegagrams = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilogram") * 0.001;
            this.gallonToMegapounds = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "lbs") * 0.001;
            this.isInitialised = true;
        }
        update(_deltaTime) {
            const storedUnits = SaltyDataStore.get("OPTIONS_UNITS", "KG");
            switch (storedUnits) {
                case "KG":
                    this.units = true;
                    break;
                case "LBS":
                    this.units = false;
                    break;
                default:
                    this.units = true;
            }
            if (!this.isInitialised) {
                return;
            }
            this.updateReferenceThrust();
            if (this.tmaDisplay) {
                this.tmaDisplay.update();
            }
            if (this.allValueComponents != null) {
                for (var i = 0; i < this.allValueComponents.length; ++i) {
                    this.allValueComponents[i].refresh();
                }
            }
            if (this.allEngineInfos != null) {
                for (var i = 0; i < this.allEngineInfos.length; ++i) {
                    if (this.allEngineInfos[i] != null){
                        this.allEngineInfos[i].update(_deltaTime);
                    }
                }
            }
            if (this.gearDisplay != null) {
                this.gearDisplay.update(_deltaTime);
            }
            if (this.flapsDisplay != null) {
                this.flapsDisplay.update(_deltaTime);
            }
            if (this.stabDisplay != null) {
                this.stabDisplay.update(_deltaTime);
            }
            if (this.allAntiIceStatus != null) {
                for (var i = 0; i < this.allAntiIceStatus.length; ++i) {
                    if (this.allAntiIceStatus[i] != null) {
                        this.allAntiIceStatus[i].refresh();
                    }
                }
            }
            if (this.infoPanel) {
                this.infoPanel.update(_deltaTime);
            }
            if (this.unitTextSVG) {
                if (this.units)
                    this.unitTextSVG.textContent = "KGS X";
                else
                    this.unitTextSVG.textContent = "LBS X";
            }
        }
        updateReferenceThrust() {
            const MAX_POSSIBLE_THRUST_DISP = 1060;
            for (var i = 1; i < 3; ++i) {
                this.engRevStatus[i] = SimVar.GetSimVarValue("TURB ENG REVERSE NOZZLE PERCENT:" + i, "percent");
                if (this.engRevStatus[i] > 1) {
                    this.refThrust[i].textContent = "REV";
                    this.refThrustDecimal[i].style.visibility = "hidden";
                }
                else {
                    this.refThrust[i].textContent = Math.min((Simplane.getEngineThrottleMaxThrust(i - 1) * 10), MAX_POSSIBLE_THRUST_DISP).toFixed(0);
                    this.refThrustDecimal[i].style.visibility = "visible";
                }
            }
            return;
        }
        updatePressurisationValues() {
            if (SimVar.GetSimVarValue("L:XMLVAR_EICAS_CURRENT_PAGE", "Enum") !== 3) {
                this.pressureInfo.style.visibility = "hidden";
                return;
            }
            else {
                this.pressureInfo.style.visibility = "visible";
            }
            this.cabinAlt.textContent = this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#CAB_ALT_Value"), Simplane.getPressurisationCabinAltitude));
            this.cabinRate.textContent = this.allValueComponents.push(new Airliners.DynamicValueComponent(this.querySelector("#RATE_Value"), Simplane.getPressurisationCabinAltitudeRate));
            let deltaPValue = Math.abs(Simplane.getPressurisationDifferential() * 10);
            if (Math.round(deltaPValue) < 10) {
                this.deltaP.textContent = "0" + deltaPValue.toFixed(0);
            }
            else {
                this.deltaP.textContent = deltaPValue.toFixed(0);
            }
            return;
        }
        updateWeights() {
            this.grossWeight.textContent = (this.getGrossWeightInMegagrams() * 10).toFixed(0);
            this.totalFuel.textContent = (this.getTotalFuelInMegagrams() * 10).toFixed(0);
            return;
        }
        getGrossWeightInMegagrams() {
            if (this.units) {
                return SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") * 0.001;
            }
            return SimVar.GetSimVarValue("TOTAL WEIGHT", "lbs") * 0.001;
        }
        getTotalFuelInMegagrams() {
            let factor = this.gallonToMegapounds;
            if (this.units)
                factor = this.gallonToMegagrams;
            return (SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons") * factor);
        }
        getInfoPanelManager() {
            return this.infoPanelsManager;
        }
    }
    
    B777_UpperEICAS.Display = Display;
    
    class B777_EICAS_Gauge {
    }
    
    class B777_EICAS_CircleGauge extends B777_EICAS_Gauge {
        constructor(_engineIndex, _root, _template, _hideIfN1IsZero) {
            super();
            this.engineIndex = 0;
            this.currentValue = 0;
            this.valueText = null;
            this.fill = null;
            this.predArc = null;
            this.predArcRadius = 0;
            this.fillPathD = "";
            this.fillCenter = new Vec2();
            this.fillRadius = 0;
            this.defaultMarkerTransform = "";
            this.whiteMarker = null;
            this.redMarker = null;
            this.throttleMarker = null;
            this.orangeMarker = null;
            this.greenMarker = null;
            this.hideIfN1IsZero = false;
            this.engineIndex = _engineIndex;
            this.root = _root;
            this.hideIfN1IsZero = _hideIfN1IsZero;
            if ((this.root != null) && (_template != null)) {
                this.root.appendChild(_template.cloneNode(true));
                this.valueText = this.root.querySelector(".valueText");
                this.fill = this.root.querySelector(".fill");
                this.predArc = this.root.querySelector(".predArc");
                this.whiteMarker = this.root.querySelector(".normalMarker");
                this.throttleMarker = this.root.querySelector(".throttleMarker");
                this.redMarker = this.root.querySelector(".dangerMarker");
                this.orangeMarker = this.root.querySelector(".warningMarker");
                this.greenMarker = this.root.querySelector(".greenMarker");
                if (this.fill != null) {
                    var fillPathDSplit = this.fill.getAttribute("d").split(" ");
                    for (var i = 0; i < fillPathDSplit.length; i++) {
                        if (this.fillRadius > 0) {
                            if (fillPathDSplit[i].charAt(0) == 'L') {
                                this.fillCenter.x = parseInt(fillPathDSplit[i].replace("L", ""));
                                this.fillCenter.y = parseInt(fillPathDSplit[i + 1]);
                            }
                            this.fillPathD += " " + fillPathDSplit[i];
                        }
                        else if (fillPathDSplit[i].charAt(0) == 'A') {
                            this.fillRadius = parseInt(fillPathDSplit[i].replace("A", ""));
                            this.fillPathD = fillPathDSplit[i];
                        }
                    }
                }
                if (this.predArc != null) {
                    var predArcPathDSplit = this.predArc.getAttribute("d").split(" ");
                    for (var i = 0; i < predArcPathDSplit.length; i++) {
                        if (predArcPathDSplit[i].charAt(0) == 'A') {
                            this.predArcRadius = parseInt(predArcPathDSplit[i].replace("A", ""));
                        }
                    }
                }
                if (this.whiteMarker != null) {
                    this.defaultMarkerTransform = this.whiteMarker.getAttribute("transform");
                }
                if (this.redMarker != null) {
                    this.redMarker.setAttribute("transform", this.defaultMarkerTransform + " rotate(" + B777_EICAS_CircleGauge.MAX_ANGLE + ")");
                }
                // if (this.orangeMarker != null) {
                //     diffAndSetStyle(this.orangeMarker, StyleProperty.display, 'none');
                // }
                // if (this.greenMarker != null) {
                //     diffAndSetStyle(this.greenMarker, StyleProperty.display, 'none');
                // }
            }
            this.refresh(0, true);
        }
        update(_deltaTime) {
            this.refresh(this.getCurrentValue());
        }
        refresh(_value, _force = false) {
            if ((_value != this.currentValue) || _force) {
                this.currentValue = _value;
                let hide = false;
                if (this.hideIfN1IsZero && SimVar.GetSimVarValue("ENG N1 RPM:" + this.engineIndex, "percent") < 0.1) {
                    this.currentValue = -1;
                    hide = true;
                }
                if (this.valueText != null) {
                    if (hide) {
                        this.valueText.textContent = "";
                    }
                    else {
                        this.valueText.textContent = this.currentValue.toFixed(1);
                    }
                }
                var angle = Math.max((this.valueToPercentage(this.currentValue) * 0.01) * B777_EICAS_CircleGauge.MAX_ANGLE, 0.001);
                var angleo = Math.max((this.getN1LimitValue() * 0.01) * B777_EICAS_CircleGauge.MAX_ANGLE, 0.001);
                var anglet = Math.max((this.getN1CommandedValue() * 0.01) * B777_EICAS_CircleGauge.MAX_ANGLE, 0.001);
                
                if (this.whiteMarker != null) {
                    this.whiteMarker.setAttribute("transform", this.defaultMarkerTransform + " rotate(" + angle + ")");
                }
                if (this.greenMarker != null) {
                    this.greenMarker.setAttribute("transform", this.defaultMarkerTransform + " rotate(" + angleo + ")");
                }
                if (this.orangeMarker != null) {
                    this.orangeMarker.setAttribute("transform", this.defaultMarkerTransform + " rotate(" + B777_EICAS_CircleGauge.WARNING_ANGLE + ")");
                }
                if (this.throttleMarker != null) {
                    this.throttleMarker.setAttribute("transform", this.defaultMarkerTransform + " rotate(" + anglet + ")");
                }
                if (this.fill != null) {
                    var rad = angle * B777_EICAS_CircleGauge.DEG_TO_RAD;
                    var x = (Math.cos(rad) * this.fillRadius) + this.fillCenter.x;
                    var y = (Math.sin(rad) * this.fillRadius) + this.fillCenter.y;
                    this.fill.setAttribute("d", "M" + x + " " + y + " " + this.fillPathD.replace("0 0 0", (angle <= 180) ? "0 0 0" : "0 1 0"));
                }
                if (this.predArc != null) {
                    var rad = angle * B777_EICAS_CircleGauge.DEG_TO_RAD;
                    var radt = anglet * B777_EICAS_CircleGauge.DEG_TO_RAD;
                    var x1 = (Math.cos(rad) * this.predArcRadius) + this.fillCenter.x;
                    var y1 = (Math.sin(rad) * this.predArcRadius) + this.fillCenter.y;
                    var x2 = (Math.cos(radt) * this.predArcRadius) + this.fillCenter.x;
                    var y2 = (Math.sin(radt) * this.predArcRadius) + this.fillCenter.y;
                    this.predArc.setAttribute("d", "M" + x1 + " " + y1 + " A" + this.predArcRadius + " " + this.predArcRadius + " " +  ((angle <= anglet) ? "0 0 1" : "0 0 0") + " " + x2 + " " + y2);
                }
            }
        }
    }
    
    B777_EICAS_CircleGauge.MAX_ANGLE = 210;
    B777_EICAS_CircleGauge.WARNING_ANGLE = 202;
    B777_EICAS_CircleGauge.DEG_TO_RAD = (Math.PI / 180);
    class B777_EICAS_Gauge_TPR extends B777_EICAS_CircleGauge {
        getCurrentValue() {
            return Utils.Clamp(SimVar.GetSimVarValue("ENG PRESSURE RATIO:" + this.engineIndex, "ratio") * (100 / 1.7), 0, 100);
        }
        valueToPercentage(_value) {
            return _value;
        }
    }
    class B777_EICAS_Gauge_N1 extends B777_EICAS_CircleGauge {
        getCurrentValue() {
            return SimVar.GetSimVarValue("ENG N1 RPM:" + this.engineIndex, "percent");
        }
        valueToPercentage(_value) {
            return Utils.Clamp(_value, 0, 100);
        }
        getN1LimitValue() {
            return Math.abs(Simplane.getEngineThrottleMaxThrust(this.engineIndex - 1));
        }
        getN1CommandedValue() {
            return Math.abs(Simplane.getEngineThrottleCommandedN1(this.engineIndex - 1));
        }
    }
    class B777_EICAS_Gauge_EGT extends B777_EICAS_CircleGauge {
        getCurrentValue() {
            return SimVar.GetSimVarValue("ENG EXHAUST GAS TEMPERATURE:" + this.engineIndex, "celsius");
        }
        valueToPercentage(_value) {
            return (Utils.Clamp(_value, 0, 1000) * 0.1);
        }
        getN1LimitValue() {
            return 0;
        }
        getN1CommandedValue() {
            return 0;
        }
    }
    class B777_EICAS_Gauge_N2 extends B777_EICAS_CircleGauge {
        getCurrentValue() {
            return SimVar.GetSimVarValue("ENG N2 RPM:" + this.engineIndex, "percent");
        }
        valueToPercentage(_value) {
            return Utils.Clamp(_value, 0, 100);
        }
    }
    
    class AntiIceStatus {
        constructor(_element, _index) {
            this.element = null;
            this.index = -1;
            this.isActive = false;
            this.element = _element;
            this.index = _index;
            this.setState(false);
        }
        refresh() {
            var active = this.getCurrentActiveState();
            if (active != this.isActive) {
                this.setState(active);
            }
        }
        setState(_active) {
            if (this.element != null) {
                this.element.style.display = _active ? "block" : "none";
            }
            this.isActive = _active;
        }
    }
    class EngineAntiIceStatus extends AntiIceStatus {
        getCurrentActiveState() {
            return SimVar.GetSimVarValue("ENG ANTI ICE:" + this.index, "bool");
        }
    }
    class WingAntiIceStatus extends AntiIceStatus {
        getCurrentActiveState() {
            return SimVar.GetSimVarValue("STRUCTURAL DEICE SWITCH", "bool");
        }
    }
})(B777_UpperEICAS || (B777_UpperEICAS = {}));
customElements.define("b777-upper-eicas", B777_UpperEICAS.Display);
//# sourceMappingURL=B747_8_UpperEICAS.js.map