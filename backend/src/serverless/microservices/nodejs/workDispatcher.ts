import { NodeWorkerMessage } from '../../types/workerTypes'
import { NodeMicroserviceMessage } from './messageTypes'
import workerFactory from './workerFactory'

export const processNodeMicroserviceMessage = async (msg: NodeWorkerMessage): Promise<void> => {
  const microserviceMsg = msg as any as NodeMicroserviceMessage
  await workerFactory(microserviceMsg)
}
