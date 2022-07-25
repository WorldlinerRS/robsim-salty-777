class B777_RUDDER extends BaseAirliners {
    constructor() {
        super();
        this.currentValue = 0;
        this.valueToArrowXPos = 0;
    }
    get templateID() { return "B777_RUDDER"; }
    connectedCallback() {
        super.connectedCallback();
        this.rootSVG = this.querySelector("svg");
        this.arrow = this.querySelector("#Arrow");
        var x = B777_RUDDER.MARKERS_OFFSET_FROM_EDGE;
        var offset = (100 - (B777_RUDDER.MARKERS_OFFSET_FROM_EDGE * 2)) / 4;
        this.createMarkerGroup(x, offset, "10");
        x += offset;
        this.createMarkerGroup(x, offset, "5");
        x += offset;
        this.createMarkerGroup(x, offset, "0");
        x += offset;
        this.createMarkerGroup(x, offset, "5");
        this.createMarker(100 - B777_RUDDER.MARKERS_OFFSET_FROM_EDGE, B777_RUDDER.MARKER_LINE_HEIGHT_MAIN, "10");
    }
    createMarker(_x, _lineHeight, _displayValue = "") {
        if (this.rootSVG != null) {
            var xStr = _x + "%";
            var line = document.createElementNS(Avionics.SVG.NS, "line");
            diffAndSetAttribute(line, "x1", xStr);
            diffAndSetAttribute(line, "x2", xStr);
            diffAndSetAttribute(line, "y1", B777_RUDDER.MARKER_LINE_POS_Y_STRING);
            diffAndSetAttribute(line, "y2", (B777_RUDDER.MARKER_LINE_POS_Y - _lineHeight) + "%");
            this.rootSVG.appendChild(line);
            if (_displayValue.length > 0) {
                var text = document.createElementNS(Avionics.SVG.NS, "text");
                diffAndSetAttribute(text, "x", xStr);
                diffAndSetAttribute(text, "y", B777_RUDDER.MARKER_TEXT_POS_Y_STRING);
                diffAndSetAttribute(text, "class", B777_RUDDER.MARKER_TEXT_STYLE_CLASS);
                diffAndSetText(text, _displayValue);
                this.rootSVG.appendChild(text);
            }
        }
    }
    createMarkerGroup(_xStart, _xLength, _displayValue) {
        this.createMarker(_xStart, B777_RUDDER.MARKER_LINE_HEIGHT_MAIN, _displayValue);
        var spacing = _xLength / (B777_RUDDER.TOTAL_SUB_MARKERS + 1);
        for (var i = 1; i <= B777_RUDDER.TOTAL_SUB_MARKERS; ++i) {
            this.createMarker(_xStart + (spacing * i), B777_RUDDER.MARKER_LINE_HEIGHT_SUB);
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this.arrow != null) {
            var value = SimVar.GetSimVarValue("RUDDER TRIM", "degrees");
            if (this.currentValue != value) {
                this.currentValue = Utils.Clamp(value, -10, 10);
                if ((this.valueToArrowXPos == 0) && (this.rootSVG != null)) {
                    var minToMaxMarkerLength = this.rootSVG.clientWidth - (this.rootSVG.clientWidth * (B777_RUDDER.MARKERS_OFFSET_FROM_EDGE * 0.02));
                    this.valueToArrowXPos = (minToMaxMarkerLength * 0.5) * 0.1;
                }
                var x = this.currentValue * this.valueToArrowXPos;
                diffAndSetAttribute(this.arrow, "transform", "translate(" + x + ", 0)");
            }
        }
    }
    onEvent(_event) {
    }
}
B777_RUDDER.MARKERS_OFFSET_FROM_EDGE = 5;
B777_RUDDER.TOTAL_SUB_MARKERS = 4;
B777_RUDDER.MARKER_LINE_POS_Y = 50;
B777_RUDDER.MARKER_LINE_POS_Y_STRING = (B777_RUDDER.MARKER_LINE_POS_Y + "%");
B777_RUDDER.MARKER_LINE_HEIGHT_MAIN = 15;
B777_RUDDER.MARKER_LINE_HEIGHT_SUB = 10;
B777_RUDDER.MARKER_TEXT_POS_Y_STRING = "25%";
B777_RUDDER.MARKER_TEXT_STYLE_CLASS = "marker";
registerInstrument("b777-rudder", B777_RUDDER);
//# sourceMappingURL=B747_8_RUDDER.js.map