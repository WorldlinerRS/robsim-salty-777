"use strict";

import ts from "rollup-plugin-typescript2";
import resolve from "@rollup/plugin-node-resolve";
import scss from "rollup-plugin-scss";

const { join } = require("path");

export default {
    input: join(__dirname, "instrument.tsx"),
    output: {
        dir: join(__dirname, "../../../../PackageSources/html_ui/Pages/VCockpit/Instruments/77rs/PFD"),
        format: "es",
    },
    plugins: [
        scss({ output: join(__dirname, "../../../../PackageSources7/html_ui/Pages/VCockpit/Instruments/77rs/PFD/pfd.css") }),
        resolve(),
        ts({ tsconfig: join(__dirname, "tsconfig.json") }),
    ],
};