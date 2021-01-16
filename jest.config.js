module.exports = {
  rootDir: ".",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  setupFiles: ["<rootDir>/spec/setup.ts"],
  testRegex: "src/.*\\.spec\\.tsx?$",
  moduleFileExtensions: ["ts", "tsx", "js"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
      diagnostics: {
        ignoreCodes: [/* ignore unused vars */ 6133],
      },
    },
  },
  testURL: "http://localhost/",
};
