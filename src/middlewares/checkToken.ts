import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function checkToken(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  console.log(req.cookies);

  if (req.cookies?.token) {
    jwt.verify(
      req.cookies.token,
      "your_secret_key",
      (err: any, decoded: any) => {
        if (err) {
          return res
            .status(401)
            .json({ message: "Unauthorized. Invalid token." });
        }
        req.body.userId = decoded.userId;
        return next();
      }
    );
  }
  //this if for ios/Safari not accepting cross origin cookies
  else if (req.headers.authorization?.split(" ")[1]) {
    console.log("debug " + req.headers.authorization.split(" ")[1]);
    jwt.verify(
      req.headers.authorization.split(" ")[1],
      "your_secret_key",
      (err: any, decoded: any) => {
        if (err) {
          return res
            .status(401)
            .json({ message: "Unauthorized. Invalid token." });
        }
        req.body.userId = decoded.userId;
        return next();
      }
    );
  } else {
    return res.status(401).json({ message: "Unauthorized. Token missing." });
  }
}
