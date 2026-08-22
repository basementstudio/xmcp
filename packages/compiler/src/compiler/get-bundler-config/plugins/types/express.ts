export const expressTypeDefinition = `
import type { Request, Response } from "express";
export const xmcpHandler: (req: Request, res: Response) => Promise<void>;
`;
