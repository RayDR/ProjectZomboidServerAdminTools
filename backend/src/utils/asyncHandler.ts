// utils/asyncHandler.ts
export const asyncHandler = (fn: (...args: any[]) => Promise<any>) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);
