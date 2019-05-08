import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean = false;
  @Field()
  hasPreviousPage: boolean = false;
  @Field({ nullable: true })
  startCursor?: string;
  @Field({ nullable: true })
  endCursor?: string;

  setInfo(next: boolean, prev: boolean, start?: string, end?: string): PageInfo {
    this.startCursor = start;
    this.endCursor = end;
    this.hasNextPage = next;
    this.hasPreviousPage = prev;
    return this;
  }
}
