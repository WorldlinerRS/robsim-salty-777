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
            ["777-200.1", "GE90-90B"],
            ["\xa0NAV DATA", "ACTIVE"],
            ["AIRAC", date.toString()],
            ["", ""],
            ["", date.toString()],
            ["\xa0OP PROGRAM", "CO DATA"],
            ["1.9.7-b5fd72d", "VS1001"],
            ["\xa0", "DRAG/FF"],
            ["", "+0.0/+0.0"],
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
