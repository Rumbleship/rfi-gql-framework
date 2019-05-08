export interface PaginationQuery {
  first?: number; // max number to return
  after?: string; // opaque cursor -
  last?: number; // max number to return
  before?: string; // opaque cursor -
}
