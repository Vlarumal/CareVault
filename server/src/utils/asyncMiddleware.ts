import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler<T = void> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;

export const asyncHandler = <T = void>(
  fn: AsyncRequestHandler<T>
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
