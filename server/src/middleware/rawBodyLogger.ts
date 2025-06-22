import { Request, Response, NextFunction } from "express";
import { Readable } from "stream";

const rawBodyLogger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`[RAW BODY LOGGER] Request received at ${new Date().toISOString()}`);
  console.log(`[RAW HEADERS] ${JSON.stringify(req.headers)}`);
  
  const chunks: Buffer[] = [];
  req.on("data", (chunk) => {
    chunks.push(chunk);
  });
  
  req.on("end", () => {
    const rawBody = Buffer.concat(chunks);
    console.log(`[RAW BODY] Length: ${rawBody.length} bytes`);
    console.log(rawBody.length > 0 ? rawBody.toString('utf8') : '<EMPTY BODY>');
    
    // Store raw body for potential diagnostics
    (req as any).rawBody = rawBody;
    
    // Create new readable stream from buffered data
    const newStream = new Readable();
    newStream.push(rawBody);
    newStream.push(null);
    
    // Replace request stream with a reconstructed stream
    Object.assign(req, newStream);
    req.body = rawBody.length > 0 ? rawBody.toString('utf8') : undefined;
    
    next();
  });
  
  req.on("error", (err) => {
    console.error('[RAW BODY ERROR]', err);
    next(err);
  });
};

export default rawBodyLogger;
