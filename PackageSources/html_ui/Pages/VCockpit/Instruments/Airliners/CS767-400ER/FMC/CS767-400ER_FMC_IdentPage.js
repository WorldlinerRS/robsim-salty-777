class FMCIdentPage {
    static ShowPage1(fmc) {
        fmc.clearDisplay();
        fmc.activeSystem = "FMC";
        let model = SimVar.GetSimVarValue("ATC MODEL", "string", "FMC");
        if (!model) {
            model = "unkn.";
        }
        let date = fmc.getNavDataDateRange();
        fmc.setTemplate([
            ["IDENT"],
            ["\xa0MODEL", "ENG RATING"],
            ["767.4", "CF6-80C2B7F"],
            ["\xa0NAV DATA", "ACTIVE"],
            ["AIRAC", date.toString()],
            ["", ""],
            ["", date.toString()],
            ["\xa0OP PROGRAM", "CO DATA"],
            ["3411HNP02C10", "BGC01902"],
            ["\xa0OPC", "DRAG/FF"],
            ["3461BCG016A0", "+0.0/+0.0"],
            ["__FMCSEPARATOR"],
            ["<INDEX", "POS INIT>"]
        ]);

        fmc.onLeftInput[5] = () => {
            B777_FMC_InitRefIndexPage.ShowPage1(fmc);
        };

        fmc.onRightInput[5] = () => {
            FMCPosInitPage.ShowPage1(fmc);
        };
    }
}
//# sourceMappingURL=B747_8_FMC_IdentPage.js.map
