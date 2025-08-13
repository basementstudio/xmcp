import { type XmcpMiddleware } from "xmcp";
import jwt from "jsonwebtoken";

const middleware: XmcpMiddleware = (req, res, next) => {
  const EXAMPLE_SECRET = "a-string-secret-at-least-256-bits-long";

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "No authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, EXAMPLE_SECRET);
    console.log(decoded);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  next();
};

export default middleware;
