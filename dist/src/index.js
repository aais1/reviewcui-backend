"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = __importDefault(require("./routes/auth"));
const data_1 = __importDefault(require("./routes/data"));
const dbConnect_1 = require("../lib/dbConnect");
const Faculty_1 = require("./models/Faculty");
const app = (0, express_1.default)();
const PORT = 3069;
// ✅ Configure CORS properly
app.use((0, cors_1.default)({
    origin: ["https://reviewcui.vercel.app", "http://localhost:5173"],
    credentials: true, // ✅ Allow cookies and authentication headers
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)()); // ✅ Enable cookies in Express
// Routes
app.use("/auth", auth_1.default);
app.use("/data", data_1.default);
app.get("/", (req, res) => {
    res.send("🚀 Express Server is Running!");
});
// Start Server
app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    (0, dbConnect_1.dbConnect)();
    const faculty = yield Faculty_1.Faculty.find();
    // Using a regular for loop
    // for (const f of faculty) {
    //   f.set("reviews", []);
    //   await f.save();
    //   console.log(`Faculty with ID ${f._id} reviews have been cleared.`);
    // }
    console.log(`✅ Server running on http://localhost:${PORT}`);
}));
