"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToken = checkToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function checkToken(req, res, next) {
    var _a, _b;
    console.log(req.cookies);
    if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.token) {
        jsonwebtoken_1.default.verify(req.cookies.token, "your_secret_key", (err, decoded) => {
            if (err) {
                return res
                    .status(401)
                    .json({ message: "Unauthorized. Invalid token." });
            }
            req.body.userId = decoded.userId;
            return next();
        });
    }
    //this if for ios/Safari not accepting cross origin cookies
    else if ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.split(" ")[1]) {
        console.log("debug " + req.headers.authorization.split(" ")[1]);
        jsonwebtoken_1.default.verify(req.headers.authorization.split(" ")[1], "your_secret_key", (err, decoded) => {
            if (err) {
                return res
                    .status(401)
                    .json({ message: "Unauthorized. Invalid token." });
            }
            req.body.userId = decoded.userId;
            return next();
        });
    }
    else {
        return res.status(401).json({ message: "Unauthorized. Token missing." });
    }
}
