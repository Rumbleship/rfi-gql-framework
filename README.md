# @rumbleship/gql
Rumbleship's RelayAPI style framework for creating graphql/sequelize  services


# Upgrade from version 10 to 11 check list

1) Change package.json to point to latest framework and yarn
  1.1 make sure peer dependancies are fixed
<br>
2) Change all `@Subscription` in code to `@RumbleshipSubscription`
<br>
3) Model changes
  3.1 Check that db/*relay*.model.ts defines all the timestamp fields and that they are actually in the database named correctly with _ option <br>
  3.2 Make sure that for the Base relay class (@ObjectType) has withTimestamps mixin. and any explicit  timestamp attributes are removed. <br>
  This ensures that the timestamp attributes are correctly decorated with the @Watchable() decorator, and in future that they are decorated with other behavioural selectors eg whether an property can be used to order a return etc.
```Typescript
          @ObjectType({ implements: Node })
            export class MyRelay extends withTimeStamps(AttribType.Obj, MyRelayBuiltAttribs)
            implements Node<MyRelay> {
            _service!: MyRelayService;
            id!: Oid;
          }
```
 
3) 3.3 Change all Relay filter classes defined to remove explicit pagination, orderBy and time stamps and add the filter mixins as appropriate.<br>
  3.4 Add a new Filter for subscriptions using the withSubscriptionFilter(). Note we poass in the name to used in the graphQL scema for the generated watchlist enum.<br>
  3.5 Add `@Watchable` decorator to Fields in the class hierarchy of the SubscriptionFilter. Typically these will be in the baseAttribs plus any fields not present in the baseAttribs, but are present in the database model. This decorator is non-mutating, so it is harmless to add to any classes that are shared between the Filter and other classes (such as ObjectType's). Alternatively, an actual enum that has been registeered with the typeGraphQl maybe passed in to the withSubscriptionFilter to use. If the same enum is to be shared between different versions of a Filter, then it can be generated using the function  `buildSubscriptionWatchList()`.<br>
  3.6 **A note on Filters**.<br>
  Usually, the BaseAttribs builders define attributes as both required and optional as the business rules dictate for the business object.<br>
  However for Filters, these are always optional. The standard pattern we have adopted in the gql world of determining `nullable: boolean` using `!isInputOrObject(attribType)` takes care of that for the schema.    
  For the Typescript type system, we have to use type manipulation and create a type that converts all the properties to optional. This can eiterh be done by creating a alias type as below or using Partial<MyRelayFilterClass> in the methods that take a filter.

  While refactoring to use the SubscriptionFilter, it may be appropriate to also use this pattern. See the simple MyRelayResolver example below.<br>
  3.7 Replace the deprecated GQLEdge and GQLCOnnection with the prefered buildEdgeClass() and buildConnectionClass()
  
  Examples:<br>


```Typescript
    export function buildMyRelayBaseAttribs(
      attribType: AttribType
    ): ClassType<MyRelay> {
      @GqlBaseAttribs(attribType)
      class BaseMyRelayAttribs implements Node {
        @Watchable
        @AuthorizerTreatAs([Resource.User])
        @Field(type => ID, { nullable: true })
        authorized_user_id!: string;

        @Watchable
        @Field({ nullable: true })
        thing_to_watch_for_changes!: string;

        @Watchable
        @MaxLength(MAX_STRING_LENGTH)
        @Field({ nullable: !isInputOrObject(attribType) })
        amount!: string;

        @Watchable
        @Field(type => Boolean, { nullable: !isInputOrObject(attribType) })
        active!: boolean;
      }
      return BaseMyRelayAttribs;
    }
```
Example  Filter

```Typescript
    @ArgsType()
    class MyRelayFilterBaseAttribs extends withTimeStampsFilter(MyRelayBaseAttribs(AttribType.Arg))
      implements RelayFilterBase<MyRelayFilter> {
      //
      @Watchable
      @Field(type => ID, { nullable: true })
      some_attribute_not_in_base_but_in_relay_object?: string;
    }

    
    @ArgsType()
    export class GqlMyRelayFilter extends withOrderByFilter(
      withPaginationFilter(MyRelayFilterBaseAttribs)
    ) {}
    // create a partial interface for use in the resolvers and service method signatures
    export type MyRelayFilter = Partial<GqlMyRelayFilter>;

    @ArgsType()
    export class GqlMyRelayFilterForSubscriptions extends withSubscriptionFilter(
      MyRelayFilterBaseAttribs,
      `MyRelayFilterWatchList`
    ) {}
    export type MyRelayFilterForSubscriptions = Partial<GqlMyRelayFilterForSubscriptions>

```

Example of Resolver that shows correct use of filter class and type, in this case, an OrderEvent has an associated set of line items :- 

```Typescript
const OrderEventBaseResolver = createReadOnlyBaseResolver(
  'orderEvent',
  OrderEvent,
  OrderEventConnection,
  GqlOrderEventFilter, /* <-- The class passed into the generic. This allows the builder to use any metadata attached to the class */
  OrderEventNotification,
  OrderEventFilterForSubscriptions,
  Scopes.ORDERADMIN
);

@Service()
@Resolver(of => OrderEvent, { isAbstract: true })
export class OrderEventResolverBase extends OrderEventBaseResolver {
  constructor(
    // constructor injection of service
    @Inject('OrderEventService') readonly orderEventService: OrderEventServiceMixin
  ) {
    super(orderEventService);
  }

  @FieldResolver(type => LineItemConnection)
  async lineItems(
    @Root() anOrderEvent: OrderEvent,
    @Args(type => GqlLineItemFilter) filter: LineItemFilter /* <-- class to typeGraphql, type to typescript */
  ): Promise<LineItemConnection> {
    return anOrderEvent.getLineItems(filter);
  }

 
}
```



4) Look for Resolvers that use `createReadOnlyBaseResolver()` and `createBaseResolver()` both these fiunctions should be complaining that they dont have aenough arguments

Add the xxxxSubscriptionFilter class that you added as per above to the function as directed by the 'hover over'

5) Look for any custom resolvers and evaluate if the onXXXChange() subscription should be replaced with the withSubscriptionsResolver() mixin.