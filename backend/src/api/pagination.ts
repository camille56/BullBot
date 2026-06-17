export interface PaginationParams {
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function parsePagination(query: Record<string, unknown>): PaginationParams | null {
  const page = query.page !== undefined ? Number(query.page) : DEFAULT_PAGE;
  const pageSize = query.pageSize !== undefined ? Number(query.pageSize) : DEFAULT_PAGE_SIZE;

  if (!Number.isInteger(page) || page < 1) {
    return null;
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    return null;
  }

  return { page, pageSize };
}
