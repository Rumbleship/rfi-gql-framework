
// go into
// https://github.com/googleapis/nodejs-pubsub/blob/master/samples/topics.js
// and add retry logic to the below

// @ts-ignore
function payloadFromModel(model: Model): any{
  const fullClassName: string = model.constructor.name;
  const idx: number = fullClassName.toString().lastIndexOf('Model')
  const payloadClassName: string = fullClassName.substr(0, idx);
  // @ts-ignore: not sure how to tell it get returns a string
  const oid = Oid.create(payloadClassName, model.get('id')).toString();
  return {oid: oid, payload_class: payloadClassName, id: model.get('id')}
}

// note last known state changes based on the kind of update
// @ts-ignore
// FIXME 'any's
async function publishPayload(notification: any, rawPayload: Model, deltas: any): Promise<void> {
  // Get the relevant pubsub from the model to future proof against having more than one pubsub
  const pubSub = pubSubFrom(rawPayload.sequelize as Sequelize);
  //const payload: string = makePayload(rawPayload);

  var rval = payloadFromModel(rawPayload)
  rval.action = notification;
  rval.deltas = deltas;
  const payload = JSON.stringify(rval);

  const topicName: string = `${NODE_CHANGE_NOTIFICATION}_${rawPayload.constructor.name}`;
  await CreateTopic(topicName);
  if (!pubSub) {
    return;
  }

  console.log('Publishing', payload, 'to topic', NODE_CHANGE_NOTIFICATION);
  pubSub.publish(NODE_CHANGE_NOTIFICATION, payload);

  // Also publish the specific Model
  console.log('Publishing', payload, 'to topic', topicName);
  pubSub.publish(topicName, payload);
}


export async function initGooglePubSub() {
  await listAllTopics();
  await CreateTopic(NODE_CHANGE_NOTIFICATION);
  // await SubscribeToThings('BuilderApplicationModel', (data: any) => {
  //   console.log('got msg', data);
  // });
}

export publishPayloadToPubSub(){

}
