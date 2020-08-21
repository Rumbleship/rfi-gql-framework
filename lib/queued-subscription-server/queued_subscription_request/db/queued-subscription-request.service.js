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
exports.QueuedSubscriptionRequestServiceSequelize = void 0;
const typedi_1 = require("typedi");
// tslint:disable-next-line: no-circular-imports
const sequelize_base_service_1 = require("../../../db/service/sequelize-base.service");
const rumbleship_context_1 = require("../../../app/rumbleship-context/rumbleship-context");
const relay_interface_1 = require("../../../gql/relay/relay.interface");
const queued_subscription_request_relay_1 = require("../gql/queued-subscription-request.relay");
const queued_subscription_request_model_1 = require("./queued-subscription-request.model");
const permissions_1 = require("../permissions");
let QueuedSubscriptionRequestServiceSequelize = class QueuedSubscriptionRequestServiceSequelize extends sequelize_base_service_1.SequelizeBaseService {
    constructor(context) {
        super(queued_subscription_request_relay_1.QueuedSubscriptionRequest, queued_subscription_request_relay_1.QueuedSubscriptionRequestEdge, queued_subscription_request_relay_1.QueuedSubscriptionRequestConnection, queued_subscription_request_model_1.QueuedSubscriptionRequestModel, context, {
            permissions: permissions_1.ServicePermissions.QueuedSubscriptionRequest
        });
    }
    async createAndCommit(queuedSubscriptionRequestInput) {
        const transaction = await this.newTransaction({
            isolation: relay_interface_1.NodeServiceIsolationLevel.READ_COMMITTED,
            autocommit: false
        });
        try {
            this.ctx.logger.info('QueuedSubscriptionRequest:create_and_commit:start', {
                QueuedSubscriptionRequestInput: queued_subscription_request_relay_1.QueuedSubscriptionRequestInput
            });
            const opts = {
                transaction,
                lockLevel: relay_interface_1.NodeServiceLock.UPDATE
            };
            await this.create(queuedSubscriptionRequestInput, opts);
            await transaction.commit();
            this.ctx.logger.info('QueuedSubscriptionRequest:create_and_commit:end', {
                QueuedSubscriptionRequestInput: queued_subscription_request_relay_1.QueuedSubscriptionRequestInput
            });
        }
        catch (e) {
            this.ctx.logger.error(e);
            this.ctx.logger.error('QueuedSubscriptionRequest:create_and_commit:exception', {
                QueuedSubscriptionRequestInput: queued_subscription_request_relay_1.QueuedSubscriptionRequestInput,
                exception: {
                    stack: e.stack,
                    message: e.message
                }
            });
            await transaction.rollback();
            throw e;
        }
    }
};
QueuedSubscriptionRequestServiceSequelize = __decorate([
    typedi_1.Service() // Each Request gets its own instance
    ,
    __metadata("design:paramtypes", [rumbleship_context_1.RumbleshipContext])
], QueuedSubscriptionRequestServiceSequelize);
exports.QueuedSubscriptionRequestServiceSequelize = QueuedSubscriptionRequestServiceSequelize;
//# sourceMappingURL=queued-subscription-request.service.js.map