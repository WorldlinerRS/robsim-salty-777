var B777_LowerEICAS_ECL;
(function (B777_LowerEICAS_ECL) {
    class Display extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this._registered = false;
            this.isInitialised = false;
        }
        get templateID() { return "B777LowerEICASECLTemplate" }
        get isInteractive() { return true; }
        connectedCallback() {
            super.connectedCallback();
            RegisterViewListener("JS_LISTENER_KEYEVENT", () => {
                console.log("JS_LISTENER_KEYEVENT registered.");
                RegisterViewListener("JS_LISTENER_FACILITY", () => {
                    console.log("JS_LISTENER_FACILITY registered.");
                    this._registered = true;
                }, true);
            });
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.menuMode = false;
            this.menuOpen = -1;
            this.checklistItems = [];
            this.nextChecklistIsPending = false;
            this.normalChecklistSequence = 0;
            this.checklistOverriden = false;
            this.cursor = document.querySelector("#maincursor");
            this.nextItemPosition = 3;
            this.nextItemBox = document.querySelector("#currentBox");
            this.completeGroup = document.querySelector("#checklist-complete");
            this.ovrdGroup = document.querySelector("#overrideGroup");
            this.normalButton = document.querySelector("#normal");
            this.itemOvrdButton = document.querySelector("#item-ovrd");
            this.notesButton = document.querySelector("#notes");
            this.chklOvrdButton = document.querySelector("#chkl-ovrd");
            this.chklResetButton = document.querySelector("#chkl-reset");
            this.nonNormalButton = document.querySelector("#non-normal");
            this.maxCursorIndex = 0;
            this.eventTimeout = 0;
            this.buildChecklist();
            this.addEventListener("mousedown", this.OnMouseDown.bind(this));
            this.addEventListener("mousemove", this.OnMouseMove.bind(this));
            this.addEventListener("mouseup", this.OnMouseUp.bind(this));
            this.addEventListener("mouseleave", (e) => {
                this.bMouseOver = false;
                this.OnMouseUp(e);
            });
            this.addEventListener("mouseenter", () => {
                this.bMouseOver = true;
            });
            this.addEventListener("mousewheel", this.OnMouseWheel.bind(this));
            document.body.style.overflow = "hidden";
            document.body.style.clip = "auto";
            document.body.style.position = "absolute";
            this.isInitialised = true;
        }
        //Event Handler for Cursor Control - 50ms timeout to limit cursor scroll rate caused by duplicate events - 2nd 100ms timer prevents update loop running before triggered H Event has been processed by sim.
        onEvent(_event) {
            super.onEvent(_event);
            setTimeout(() => {
                this.eventTimeout = 0;
            }, 100);
            if (this.eventTimeout == 0) {
                if (_event === "EICAS_CHANGE_PAGE_chkl" && this.nextChecklistIsPending === true) {
                    this.nextChecklistIsPending = false;
                    if (this.normalChecklistSequence < 9) {
                        SimVar.SetSimVarValue("H:B777_EICAS_2_EICAS_CHANGE_PAGE_chkl", "bool", 1);
                        setTimeout(() => {
                            this.normalChecklistSequence ++;
                            this.refreshChecklist();
                        }, 100);
                    }
                }
                else if (_event === "UPDATE_ECL") {
                    setTimeout(() => {
                        if (!this.menuMode) {
                            this.refreshChecklist();
                        }
                    }, 300);
                }
                else if (_event === "mouseenter") {
                    if (this.menuOpen == 0) {
                        this.refreshChecklist();
                    }
                }
                this.eventTimeout = 1;
            }
        }
        //Main update loop controls UI elements based on checklist item completion state.
        update(_deltaTime) {
            if (this.menuMode === true) {
                return;
            }
            this.updateNextLineItem();
            this.updateClosedLoopItems();
            this.updateChecklistStatus();
            for (let i = 0; i < normalChecklists[this.normalChecklistSequence].items.length; i++) {
                let text = document.querySelector("#item" + i + "-text");
                let tick = document.querySelector("#tick" + i);
                let boxTop = this.querySelector("#boxTop" + i);
                let boxBottom = this.querySelector("#boxBottom" + i);
                if (this.checklistItems[i].status == "checked") {
                    text.style.fill = "lime";
                    tick.style.visibility = "visible";
                    if (this.checklistItems[i].conditionType == "open") {
                        boxTop.style.fill = "#333333";
                        boxBottom.style.fill = "#808080";
                    }
                }
                else if (this.checklistItems[i].status == "overridden") {
                    text.style.fill = "cyan";
                    tick.style.visibility = "visible";
                    if (this.checklistItems[i].conditionType == "open") {
                        boxTop.style.fill = "#333333";
                        boxBottom.style.fill = "#808080";
                    }
                }
                else {
                    text.style.fill = "white";
                    tick.style.visibility = "hidden";
                    boxTop.style.fill = "#808080";
                    boxBottom.style.fill = "#333333";
                }
            }
        }
        //Iterates through current closed loop checklist items and updates state to match if Simvar conditions met or not.
        updateClosedLoopItems() {
            let conditionsSatCounter = [];
            let conditionsTargetNum = [];
            for (let i = 0; i < this.checklistItems.length; i++) {
                conditionsSatCounter[i] = 0;
                if (this.checklistItems[i].conditionType === "closed") {
                    for (let j = 0; j < this.checklistItems[i].conditions.length; j++) {
                        conditionsTargetNum[i] = this.checklistItems[i].conditions.length;
                        if (normalChecklists[this.normalChecklistSequence].items[i].special != undefined) {
                            if (Math.round(SimVar.GetSimVarValue(this.checklistItems[i].conditions[j].simvar, this.checklistItems[i].conditions[j].simvarType)) === SimVar.GetSimVarValue(this.checklistItems[i].conditions[j].specialCondition, this.checklistItems[i].conditions[j].specialSimvarType)) {
                                conditionsSatCounter[i] ++;
                            }
                        }
                        else if (SimVar.GetSimVarValue(this.checklistItems[i].conditions[j].simvar, this.checklistItems[i].conditions[j].simvarType) === this.checklistItems[i].conditions[j].simvarTrueCondition) {
                            conditionsSatCounter[i] ++;
                        }
                        if (this.checklistItems[i].status === "overridden") {

                        }
                        else if (conditionsSatCounter[i] === conditionsTargetNum[i]) {
                            this.checklistItems[i].status = "checked";
                        }
                        else {
                            this.checklistItems[i].status = "pending";
                        }
                    }
                }
            }
        }
        //Updates some UI elements when checklist complete and jumps cursor to NORMAL button.
        updateChecklistStatus() {
            let completeItemsCounter = 0;
            for (let i = 0; i < normalChecklists[this.normalChecklistSequence].items.length; i++) {
                if (this.checklistItems[i].status === "checked" || this.checklistItems[i].status === "overridden") {
                    completeItemsCounter ++;
                }
            }
            if (completeItemsCounter === normalChecklists[this.normalChecklistSequence].itemCount && !this.menuMode) {
                if (this.checklistOverriden === true) {
                    this.ovrdGroup.style.visibility = "visible";
                }
                else {
                    this.completeGroup.style.visibility = "visible";
                }
                this.nextChecklistIsPending = true;
            }
            else {
                this.completeGroup.style.visibility = "hidden";
                this.ovrdGroup.style.visibility = "hidden";
                this.nextChecklistIsPending = false;
            }
        }
        //Updates position and size of Next Line Item box UI elements.
        updateNextLineItem() {
            for (let i = 0; i < normalChecklists[this.normalChecklistSequence].items.length; i++) {
                if (this.checklistItems[i].status === "pending" && !this.menuMode) {
                    this.nextItemPosition = i + 3;
                    this.nextItemBox.style.visibility = "visible";
                    break;
                }
                else {
                    this.nextItemPosition = -1;
                    this.nextItemBox.style.visibility = "hidden";
                }
            }
            if (this.nextItemPosition !== -1) {
                this.nextItemBox.setAttribute("y", cursorMap[(this.nextItemPosition * 2) + 1] + 4);
            }
        }
        //Refresh and redraw checklist.
        refreshChecklist() {
            this.buildChecklist();
            this.update();
        }
        //Clears display elements and main logic array.
        clearChecklist() {
            for (let i = 0; i < 8; i++) {
                let text = this.querySelector("#item" + i + "-text");
                let box = this.querySelector("#box" + i);
                let tick = this.querySelector("#tick" + i);
                let boxTop = this.querySelector("#boxTop" + i);
                let boxBottom = this.querySelector("#boxBottom" + i);
                text.style.visibility = "hidden";
                box.style.visibility = "hidden";
                boxTop.style.visibility = "hidden";
                boxBottom.style.visibility = "hidden";
                tick.style.visibility = "hidden";
            }
            this.completeGroup.style.visibility = "hidden";
            this.ovrdGroup.style.visibility = "hidden";
            this.checklistItems = [];
            this.completeItemsCounter = 0;
        }
        //Main checklist build function.
        buildChecklist() {
            this.checklistOverriden = false;
            this.menuOpen = -1;
            this.menuMode = false;
            this.clearMenu();
            this.clearChecklist();
            this.buildTitle();
            this.buildBody();
            this.updateBottomMenus();
            this.updateNextLineItem();
        }
        //Builds Checklist Title.
        buildTitle() {
            let title = this.querySelector("#title-text");
            if (this.menuMode === true) {
                title.textContent = menus[this.menuOpen].menuTitle;
            }
            else {
                title.textContent = "\u00BB" + normalChecklists[this.normalChecklistSequence].checklistTitle + "\u00AB";
            }
        }
        //Iterates through each item on checklist and calls the build for each.
        buildBody() {
            for (let i = 0; i < normalChecklists[this.normalChecklistSequence].items.length; i++) {
                this.buildItem(normalChecklists[this.normalChecklistSequence].items[i], i);
            }
        }
        //Builds initial state and UI elements for individual checklist items.
        buildItem(item, i) {
            //Set Item state Properties and push to main logic array checklistItems.
            let lineItem = {};
            lineItem.status = "pending";
            lineItem.conditionType = item.conditionType;
            lineItem.conditions = [];
            if (lineItem.conditionType === "closed") {
                for (let j = 0; j < item.conditions.length; j++) {
                    lineItem.conditions[j] = item.conditions[j];
                }
            }
            else {
                lineItem.conditions[0] = "";
            }
            this.checklistItems.push(lineItem);

            //Create Item text.
            let text = this.querySelector("#item" + i + "-text");
            text.setAttribute("x", "9%");
            text.setAttribute("y", item.y);

            //Handles special variable conditions for Flaps position
            if (item.special != undefined) {
                if (SimVar.GetSimVarValue(item.conditions[0].specialCondition, item.conditions[0].specialSimvarType) === 0) {
                    text.textContent = item.name;
                }
                else {
                    text.textContent = item.name.slice(0, -2) + SimVar.GetSimVarValue(item.conditions[0].specialCondition, item.conditions[0].specialSimvarType).toFixed(0);
                }
            }
            else {
                text.textContent = item.name;
            }
            text.style.visibility = "visible";

            //Create Item grey box if closed loop.
            let box = this.querySelector("#box" + i);
            let boxTop = this.querySelector("#boxTop" + i);
            let boxBottom = this.querySelector("#boxBottom" + i);
            if (item.conditionType === "open") {
                box.setAttribute("x", "2%");
                box.setAttribute("y", item.y - 23);
                box.style.visibility = "visible";
                boxTop.setAttribute("d", "M 12," + (item.y - 23) + "l 30 0 l -5 5 l -20 0 l 0 20 l -5 5 Z");
                boxTop.style.visibility = "visible";
                boxBottom.setAttribute("d", "M 12," + ((item.y * 1) + 7) + "l 5 -5 l 20 0 l 0 -20 l 5 -5 l 0 30 Z");
                boxBottom.style.visibility = "visible";
                boxTop.style.fill = "#808080";
                boxBottom.style.fill = "#333333";
            }
            else {
                box.style.visibility = "hidden";
                boxTop.style.visibility = "hidden";
                boxBottom.style.visibility = "hidden";
            }
            //Create Item tick.
            let tick = this.querySelector("#tick" + i);
            tick.setAttribute("d", "M 18," + (item.y - 8) + "l 6.4 8 l 12.8 -16 l -1.6 -1.6 l -11.2 14.4 l -4.8 -6.4 Z");
        }
        //Toggles open loop items between pending and checked states and pushes cursor to next unchecked item.
        toggleItem(cPos) {
            if (this.checklistItems[cPos].conditionType === "open") {
                if (this.checklistItems[cPos].status == "pending") {
                    this.checklistItems[cPos].status = "checked";
                    if (this.nextItemPosition !== -1) {
                        this.updateNextLineItem();
                    }
                    this.updateChecklistStatus();
                }
                else {
                    this.checklistItems[cPos].status = "pending";
                }
            }
        }
        //Overrides an individual checklist item.
        itemOverride() {
            if (this.nextItemPosition === -1) {
                return;
            }
            if (this.checklistItems[this.nextItemPosition - 3].status == "pending") {
                this.checklistItems[this.nextItemPosition - 3].status = "overridden";
            }
            else if (this.checklistItems[this.nextItemPosition - 3].status == "overridden") {
                this.checklistItems[this.nextItemPosition - 3].status = "pending";
            }
        }
        //Overrides an entire checklist.
        chklOverride() {
            for (let i = 0; i < normalChecklists[this.normalChecklistSequence].items.length; i++) {
                this.checklistItems[i].status = "overridden";
                this.checklistOverriden = true;
            }
        }
        //Start of MENU functions.
        buildMenu(menu) {
            this.menuMode = true;
            this.menuOpen = menu;
            this.clearChecklist();
            this.buildTitle();
            this.displayMenu();
            this.updateBottomMenus();
        }
        clearMenu() {
            for (let i = 0; i < 10; i++) {
                let item = this.querySelector("#menu-item" + i);
                item.style.visibility = "hidden";
            }
            let bg = this.querySelector("#normalBG");
            bg.style.fill = "#53536c";
        }
        displayMenu() {
            this.nextItemBox.style.visibility = "hidden";
            for (let i = 0; i < menus[this.menuOpen].items.length; i++) {
                let item = this.querySelector("#menu-item" + i);
                item.style.visibility = "visible";
            }
            let bg = this.querySelector("#normalBG");
            bg.style.fill = "lime";
        }
        updateBottomMenus() {
            if (this.menuOpen === 0) {
                this.normalButton.style.visibility = "hidden";
                this.itemOvrdButton.style.visibility = "hidden";
                this.chklOvrdButton.style.visibility = "hidden";
                this.chklResetButton.style.visibility = "hidden";
                this.nonNormalButton.style.visibility = "visible";
            }
            else {
                this.normalButton.style.visibility = "visible";
                this.itemOvrdButton.style.visibility = "visible";
                this.chklOvrdButton.style.visibility = "visible";
                this.chklResetButton.style.visibility = "visible";
                this.nonNormalButton.style.visibility = "hidden";
            }
        }
    }B777_LowerEICAS_ECL.Display = Display;
})(B777_LowerEICAS_ECL || (B777_LowerEICAS_ECL = {}));
customElements.define("b777-lower-eicas-ecl", B777_LowerEICAS_ECL.Display);
//# sourceMappingURL=B747_8_LowerEICAS_ECL.js.map 