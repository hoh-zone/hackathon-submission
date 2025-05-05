import path from "path";
import fs from "fs";

export const runtime = {
  runTime: new Map<string, any>(),

  init() {
    try {
      const runTimeContent = fs.readFileSync(
        path.join(".", "runtime.json"),
        "utf-8"
      );
      const runTime = JSON.parse(runTimeContent);
      // Convert plain object to Map
      this.runTime = new Map(Object.entries(runTime));
    } catch (error) {
      this.runTime = new Map<string, any>();
    }
  },

  getData(key: string) {
    return this.runTime.get(key);
  },

  setData(key: string, value: any) {
    this.runTime.set(key, value);
    this.save();
  },

  save() {
    // Convert Map to plain object for JSON serialization
    const plainObject = Object.fromEntries(this.runTime);
    fs.writeFileSync(
      path.join(".", "runtime.json"),
      JSON.stringify(plainObject)
    );
  },
};
