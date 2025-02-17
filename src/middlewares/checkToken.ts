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
  } else {
    return res.status(401).json({ message: "Unauthorized. Token missing." });
  }
}
