"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRelayMutationInput = void 0;
const type_graphql_1 = require("type-graphql");
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
function withRelayMutationInput(Base) {
    let RelayMutationInput = class RelayMutationInput extends Base {
    };
    __decorate([
        type_graphql_1.Field({ nullable: true }),
        __metadata("design:type", String)
    ], RelayMutationInput.prototype, "clientMutationId", void 0);
    RelayMutationInput = __decorate([
        type_graphql_1.InputType({ isAbstract: true })
    ], RelayMutationInput);
    return RelayMutationInput;
}
exports.withRelayMutationInput = withRelayMutationInput;
//# sourceMappingURL=with-relay-mutation-input.js.map