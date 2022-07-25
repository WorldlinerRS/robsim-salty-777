var B777_LowerEICAS_Engine;
(function (B777_LowerEICAS_Engine) {
    class Display extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
            this.allEngineInfos = new Array();
            this.allGaugeDuals = new Array();
        }
        get templateID() { return "B777LowerEICASEngineTemplate"; }
        connectedCallback() {
            super.connectedCallback();
        }
        init(_eicas) {
            this.eicas = _eicas;
            var stateParent = this.querySelector("#EngineStates");
            var n2Parent = this.querySelector("#N2Gauges");
            var ffParent = this.querySelector("#FFGauges");
            this.allEngineInfos.push(new EngineInfo(this.eicas, 1, stateParent, n2Parent, ffParent));
            this.allEngineInfos.push(new EngineInfo(this.eicas, 2, stateParent, n2Parent, ffParent));
            this.createOilPGauges();
            this.createOilTGauges();
            this.createOilQGauges();
            this.createVIBGauges();
            this.isInitialised = true;
        }
        createOilPGauges() {
            var definition = new B777_EICAS_Common.GaugeDualDefinition();
            definition.maxValue = 500;
            definition.barTop = 6;
            definition.barHeight = 88;
            var parent = this.querySelector("#OilPGauges");
            definition.getValueLeft = this.allEngineInfos[0].getOilPValue.bind(this.allEngineInfos[0]);
            definition.getValueRight = this.allEngineInfos[1].getOilPValue.bind(this.allEngineInfos[1]);
            this.createGaugeDual(parent, definition);
        }
        createOilTGauges() {
            var definition = new B777_EICAS_Common.GaugeDualDefinition();
            definition.maxValue = 200;
            definition.barTop = 6;
            definition.barHeight = 88;
            var parent = this.querySelector("#OilTGauges");
            definition.getValueLeft = this.allEngineInfos[0].getOilTValue.bind(this.allEngineInfos[0]);
            definition.getValueRight = this.allEngineInfos[1].getOilTValue.bind(this.allEngineInfos[1]);
            this.createGaugeDual(parent, definition);
        }
        createOilQGauges() {
            var definition = new B777_EICAS_Common.GaugeDualDefinition();
            definition.barHeight = 0;
            var parent = this.querySelector("#OilQGauges");
            definition.getValueLeft = this.allEngineInfos[0].getOilQValue.bind(this.allEngineInfos[0]);
            definition.getValueRight = this.allEngineInfos[1].getOilQValue.bind(this.allEngineInfos[1]);
            this.createGaugeDual(parent, definition);
        }
        createVIBGauges() {
            var definition = new B777_EICAS_Common.GaugeDualDefinition();
            definition.useDoubleDisplay = true;
            definition.valueTextPrecision = 1;
            definition.maxValue = 4;
            definition.barTop = 6;
            definition.barHeight = 88;
            var parent = this.querySelector("#VIBGauges");
            definition.getValueLeft = this.allEngineInfos[0].getVIBValue.bind(this.allEngineInfos[0]);
            definition.getValueRight = this.allEngineInfos[1].getVIBValue.bind(this.allEngineInfos[1]);
            this.createGaugeDual(parent, definition);
        }
        createGaugeDual(_parent, _definition) {
            var gauge = window.document.createElement("b777-eicas-gauge-dual");
            gauge.init(_definition);
            _parent.appendChild(gauge);
            this.allGaugeDuals.push(gauge);
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            if (this.allEngineInfos != null) {
                for (var i = 0; i < this.allEngineInfos.length; ++i) {
                    this.allEngineInfos[i].refresh(_deltaTime);
                }
            }
            if (this.allGaugeDuals != null) {
                for (var i = 0; i < this.allGaugeDuals.length; ++i) {
                    this.allGaugeDuals[i].refresh();
                }
            }
        }
    }
    B777_LowerEICAS_Engine.Display = Display;
    class EngineInfo {
        constructor(_eicas, _engineId, _engineStateParent, _n2Parent, _ffParent) {
            this.eicas = _eicas;
            this.engineId = _engineId;
            if (_engineStateParent != null) {
                this.stateText = _engineStateParent.querySelector("#Engine" + this.engineId + "_State");
            }
            this.n2Gauge = window.document.createElement("b777-eicas-gauge");
            this.n2Gauge.init(this.createN2GaugeDefinition());
            this.ffGauge = window.document.createElement("b777-eicas-gauge");
            this.ffGauge.init(this.createFFGaugeDefinition());
            if (_n2Parent != null) {
                _n2Parent.appendChild(this.n2Gauge);
            }
            if (_ffParent != null) {
                _ffParent.appendChild(this.ffGauge);
            }
        }
        createN2GaugeDefinition() {
            var definition = new B777_EICAS_Common.GaugeDefinition();
            definition.getValue = this.eicas.getN2Value.bind(this, this.engineId);
            definition.maxValue = 1100;
            definition.valueBoxWidth = 70;
            definition.valueTextPrecision = 0;
            definition.barHeight = 40;
            definition.type = 2;
            definition.addLineDefinition(1100, 32, "gaugeMarkerDanger");
            definition.addLineDefinition(0, 40, "gaugeMarkerNormal", this.eicas.getN2IdleValue.bind(this));
            return definition;
        }
        createFFGaugeDefinition() {
            var definition = new B777_EICAS_Common.GaugeDefinition();
            definition.getValue = this.getFFValue.bind(this);
            definition.maxValue = 1000;
            definition.valueBoxWidth = 55;
            definition.valueTextPrecision = 0;
            definition.type = 3;
            return definition;
        }
        getFFValue() {
            if (SimVar.GetSimVarValue("L:SALTY_UNIT_IS_METRIC", "bool")) {
                return (SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + this.engineId, "gallons per hour") * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilogram") / 100);
            }
            return (SimVar.GetSimVarValue("ENG FUEL FLOW GPH:" + this.engineId, "gallons per hour") * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "pounds") / 100);
        }
        getOilPValue() {
            return SimVar.GetSimVarValue("ENG OIL PRESSURE:" + this.engineId, "psi");
        }
        getOilTValue() {
            return SimVar.GetSimVarValue("ENG OIL TEMPERATURE:" + this.engineId, "celsius");
        }
        getOilQValue() {
            return (SimVar.GetSimVarValue("ENG OIL QUANTITY:" + this.engineId, "percent scaler 16k") * 0.001);
        }
        getVIBValue() {
            return Math.abs(SimVar.GetSimVarValue("ENG VIBRATION:" + this.engineId, "Number"));
        }
        refresh(_deltaTime) {
            let state = this.eicas.getEngineState(this.engineId);
            switch (state) {
                case B777_EngineState.AUTOSTART:
                    this.stateText.textContent = "AUTOSTART";
                    this.stateText.setAttribute("class", "white");
                    break;
                case B777_EngineState.RUNNING:
                    this.stateText.textContent = "RUNNING";
                    this.stateText.setAttribute("class", "");
                    break;
                default:
                    this.stateText.textContent = "";
                    break;
            }
            if (this.n2Gauge != null) {
                let n2IdleLine = this.n2Gauge.getDynamicLine(0);
                if (n2IdleLine) {
                    let currentN2 = this.eicas.getN2Value(this.engineId);
                    let idleN2 = n2IdleLine.currentValue;
                    if (Math.round(currentN2) >= idleN2)
                        n2IdleLine.line.setAttribute("display", "none");
                    else
                        n2IdleLine.line.setAttribute("display", "block");
                }
                this.n2Gauge.refresh();
            }
            if (this.ffGauge != null) {
                this.ffGauge.refresh(false);
            }
        }
    }
/* 
    class B777_EICAS_Gauge_EGT extends B777_EICAS_CircleGauge {
        constructor(_engineIndex, _root, _template, _hideIfN1IsZero) {
            super(_engineIndex, _root, _template, _hideIfN1IsZero);
            this._fraction = 0;
        }
    
        getCurrentValue() {
            return SimVar.GetSimVarValue('ENG EXHAUST GAS TEMPERATURE:' + this.engineIndex, 'celsius');
        }
    
        valueToPercentage(_value) {
            return (Utils.Clamp(_value, 0, 1000) * 0.1);
        }
    }
    
    class B777_EICAS_Gauge_N2 extends B777_EICAS_CircleGauge {
        getCurrentValue() {
            return SimVar.GetSimVarValue('ENG N2 RPM:' + this.engineIndex, 'percent');
        }
    
        valueToPercentage(_value) {
            return Utils.Clamp(_value, 0, 100);
        }
    }
    
    class B777_EICAS_LineGauge extends B777_EICAS_Gauge {
        constructor(_root, _engineIndex, _hideIfN1IsZero) {
            super();
            this.root = null;
            this.engineIndex = 0;
            this.currentValue = 0;
            this.box = null;
            this.valueText = null;
            this.mainBar = null;
            this.barHeight = 0;
            this.cursor = null;
            this.warningBar = null;
            this.dangerMinBar = null;
            this.dangerMaxBar = null;
            this.hideIfN1IsZero = false;
            this.root = _root;
            this.engineIndex = _engineIndex;
            this.hideIfN1IsZero = _hideIfN1IsZero;
            if (this.root != null) {
                this.box = this.root.querySelector('rect');
                this.valueText = this.root.querySelector('text');
                this.mainBar = this.root.querySelector('line');
                if (this.mainBar != null) {
                    var mainX = this.mainBar.x1.baseVal.value;
                    var mainY1 = this.mainBar.y1.baseVal.value;
                    var mainY2 = this.mainBar.y2.baseVal.value;
                    this.barHeight = mainY2 - mainY1;
                    var leftGauge = (this.engineIndex == 1);
                    var warningValue = this.getWarningValue();
                    if ((warningValue > 0) || this.needDangerMinDisplay() || this.needDangerMaxDisplay()) {
                        if (warningValue > 0) {
                            var warningY1 = (mainY2 - (this.valueToPercent(warningValue) * this.barHeight));
                            this.warningBar = document.createElementNS(Avionics.SVG.NS, 'polyline');
                            var pointsStr = [
                                mainX, this.mainBar.y2.baseVal.value,
                                mainX, warningY1,
                                (leftGauge ? (mainX + B777_EICAS_LineGauge.MARKER_WARNING_LENGTH) : (mainX - B777_EICAS_LineGauge.MARKER_WARNING_LENGTH)), warningY1
                            ].join(' ');
                            diffAndSetAttribute(this.warningBar, 'points', pointsStr);
                            diffAndSetAttribute(this.warningBar, 'class', 'warningMarker');
                            this.root.appendChild(this.warningBar);
                        }
                        if (this.needDangerMinDisplay()) {
                            this.dangerMinBar = document.createElementNS(Avionics.SVG.NS, 'line');
                            diffAndSetAttribute(this.dangerMinBar, 'x1', (leftGauge ? (mainX + B777_EICAS_LineGauge.MARKER_DANGER_START_OFFSET) : (mainX - B777_EICAS_LineGauge.MARKER_DANGER_START_OFFSET)) + '');
                            diffAndSetAttribute(this.dangerMinBar, 'x2', (leftGauge ? (mainX + B777_EICAS_LineGauge.MARKER_DANGER_END_OFFSET) : (mainX - B777_EICAS_LineGauge.MARKER_DANGER_END_OFFSET)) + '');
                            diffAndSetAttribute(this.dangerMinBar, 'y1', mainY2 + '');
                            diffAndSetAttribute(this.dangerMinBar, 'y2', mainY2 + '');
                            diffAndSetAttribute(this.dangerMinBar, 'class', 'dangerMarker');
                            this.root.appendChild(this.dangerMinBar);
                        }
                        if (this.needDangerMaxDisplay()) {
                            this.dangerMaxBar = document.createElementNS(Avionics.SVG.NS, 'line');
                            diffAndSetAttribute(this.dangerMaxBar, 'x1', (leftGauge ? (mainX + B777_EICAS_LineGauge.MARKER_DANGER_START_OFFSET) : (mainX - B777_EICAS_LineGauge.MARKER_DANGER_START_OFFSET)) + '');
                            diffAndSetAttribute(this.dangerMaxBar, 'x2', (leftGauge ? (mainX + B777_EICAS_LineGauge.MARKER_DANGER_END_OFFSET) : (mainX - B777_EICAS_LineGauge.MARKER_DANGER_END_OFFSET)) + '');
                            diffAndSetAttribute(this.dangerMaxBar, 'y1', mainY1 + '');
                            diffAndSetAttribute(this.dangerMaxBar, 'y2', mainY1 + '');
                            diffAndSetAttribute(this.dangerMaxBar, 'class', 'dangerMarker');
                            this.root.appendChild(this.dangerMaxBar);
                        }
                    }
                    this.cursor = document.createElementNS(Avionics.SVG.NS, 'path');
                    var dStr = [
                        'M', (leftGauge ? (mainX + B777_EICAS_LineGauge.CURSOR_START_OFFSET) : (mainX - B777_EICAS_LineGauge.CURSOR_START_OFFSET)), 0,
                        'l', (leftGauge ? B777_EICAS_LineGauge.CURSOR_LENGTH : -B777_EICAS_LineGauge.CURSOR_LENGTH), -(B777_EICAS_LineGauge.CURSOR_HEIGHT * 0.5),
                        'l', 0, B777_EICAS_LineGauge.CURSOR_HEIGHT,
                        'Z'
                    ].join(' ');
                    diffAndSetAttribute(this.cursor, 'd', dStr);
                    diffAndSetAttribute(this.cursor, 'class', 'cursor');
                    this.root.appendChild(this.cursor);
                }
                this.initChild();
            }
            this.refresh(0, true);
        }
    
        update(_deltaTime) {
            this.refresh(this.getValue());
        }
    
        refresh(_value, _force = false) {
            if ((_value != this.currentValue) || _force) {
                this.currentValue = _value;
                let hide = false;
                if (this.hideIfN1IsZero && SimVar.GetSimVarValue('ENG N1 RPM:' + this.engineIndex, 'percent') < 0.1) {
                    this.currentValue = -1;
                    hide = true;
                    this.isStartUp = true;
                }
                if (SimVar.GetSimVarValue('ENG N1 RPM:' + this.engineIndex, 'percent') < 20 && this.isStartUp) {
                    this.isStartUp = true;
                } else {
                    this.isStartUp = false;
                }
                var isInDangerState = (this.needDangerMinDisplay() && (this.currentValue <= 0)) || (this.needDangerMaxDisplay() && (this.currentValue >= this.getMax()));
                var isInWarningState = !isInDangerState && (this.getWarningValue() > 0) && (this.currentValue <= this.getWarningValue()) && !this.isStartUp;
                var stateStyle = isInDangerState ? ' danger' : (isInWarningState ? ' warning' : '');
                if (this.valueText != null) {
                    if (hide) {
                        diffAndSetText(this.valueText, '');
                    } else {
                        diffAndSetText(this.valueText, fastToFixed(this.currentValue, this.getValuePrecision()));
                    }
                    diffAndSetAttribute(this.valueText, 'class', stateStyle);
                }
                if ((this.cursor != null) && (this.barHeight > 0)) {
                    var valueAsPercent = Utils.Clamp(this.valueToPercent(this.currentValue), 0, 1);
                    var cursorY = (1 - valueAsPercent) * this.barHeight;
                    diffAndSetAttribute(this.cursor, 'transform', 'translate(0, ' + cursorY + ')');
                    diffAndSetAttribute(this.cursor, 'class', 'cursor' + stateStyle);
                }
                this.refreshChild();
            }
        }
    
        valueToPercent(_value) {
            return (_value / this.getMax());
        }
    
        initChild() {
        }
    
        refreshChild() {
        }
    
        getWarningValue() {
            return 0;
        }
    
        needDangerMinDisplay() {
            return false;
        }
    
        needDangerMaxDisplay() {
            return false;
        }
    
        getValuePrecision() {
            return 0;
        }
    }
    
    B777_EICAS_LineGauge.CURSOR_START_OFFSET = 6;
    B777_EICAS_LineGauge.CURSOR_LENGTH = 30;
    B777_EICAS_LineGauge.CURSOR_HEIGHT = 20;
    B777_EICAS_LineGauge.MARKER_WARNING_LENGTH = 10;
    B777_EICAS_LineGauge.MARKER_DANGER_START_OFFSET = -10;
    B777_EICAS_LineGauge.MARKER_DANGER_END_OFFSET = 20;
    
    class B777_EICAS_Gauge_OIL_P extends B777_EICAS_LineGauge {
        getMax() {
            return 100;
        }
    
        getWarningValue() {
            return 20;
        }
    
        needDangerMinDisplay() {
            return true;
        }
    
        getValue() {
            return SimVar.GetSimVarValue('ENG OIL PRESSURE:' + this.engineIndex, 'psi');
        }
    }
    
    class B777_EICAS_Gauge_OIL_T extends B777_EICAS_LineGauge {
        getMax() {
            return 200;
        }
    
        getWarningValue() {
            return 35;
        }
    
        needDangerMinDisplay() {
            return true;
        }
    
        needDangerMaxDisplay() {
            return true;
        }
    
        getValue() {
            return SimVar.GetSimVarValue('ENG OIL TEMPERATURE:' + this.engineIndex, 'celsius');
        }
    }
    
    class B777_EICAS_Gauge_VIB extends B777_EICAS_LineGauge {
        constructor() {
            super(...arguments);
            this.tooHighBar = null;
        }
    
        initChild() {
            if ((this.root != null) && (this.mainBar != null)) {
                var x1 = this.mainBar.x1.baseVal.value;
                var x2 = ((this.engineIndex == 1) ? (x1 + B777_EICAS_Gauge_VIB.MARKER_TOO_HIGH_LENGTH) : (x1 - B777_EICAS_Gauge_VIB.MARKER_TOO_HIGH_LENGTH));
                var y = (this.mainBar.y2.baseVal.value - (this.valueToPercent(B777_EICAS_Gauge_VIB.TOO_HIGH_VALUE) * (this.mainBar.y2.baseVal.value - this.mainBar.y1.baseVal.value)));
                this.tooHighBar = document.createElementNS(Avionics.SVG.NS, 'line');
                diffAndSetAttribute(this.tooHighBar, 'x1', x1 + '');
                diffAndSetAttribute(this.tooHighBar, 'x2', x2 + '');
                diffAndSetAttribute(this.tooHighBar, 'y1', y + '');
                diffAndSetAttribute(this.tooHighBar, 'y2', y + '');
                this.root.appendChild(this.tooHighBar);
            }
        }
    
        refreshChild() {
            var tooHigh = (this.currentValue >= B777_EICAS_Gauge_VIB.TOO_HIGH_VALUE);
            if (this.box != null) {
                diffAndSetAttribute(this.box, 'class', tooHigh ? 'invert' : '');
            }
            if (this.valueText != null) {
                diffAndSetAttribute(this.valueText, 'class', tooHigh ? 'invert' : '');
            }
        }
    
        getMax() {
            return 5;
        }
    
        getValue() {
            return SimVar.GetSimVarValue('ENG VIBRATION:' + this.engineIndex, 'Number');
        }
    
        getValuePrecision() {
            return 1;
        }
    }
    
    B777_EICAS_Gauge_VIB.TOO_HIGH_VALUE = 4;
    B777_EICAS_Gauge_VIB.MARKER_TOO_HIGH_LENGTH = 10; */

})(B777_LowerEICAS_Engine || (B777_LowerEICAS_Engine = {}));
customElements.define("b777-lower-eicas-engine", B777_LowerEICAS_Engine.Display);
//# sourceMappingURL=B747_8_LowerEICAS_Engine.js.map