import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTACT_MODULE } from "../../modules/contact"
import ContactModuleService from "../../modules/contact/service"

type Input = { id: string; handled: boolean }

const setContactMessageHandledStep = createStep(
  "set-contact-message-handled",
  async (input: Input, { container }) => {
    const service: ContactModuleService = container.resolve(CONTACT_MODULE)
    const before = await service.retrieveContactMessage(input.id)
    const updated = await service.updateContactMessages({ id: input.id, handled: input.handled })
    return new StepResponse(updated, { id: input.id, handled: before.handled })
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }
    const service: ContactModuleService = container.resolve(CONTACT_MODULE)
    await service.updateContactMessages(previous)
  }
)

export const markContactMessageHandledWorkflow = createWorkflow(
  "mark-contact-message-handled",
  (input: Input) => {
    const message = setContactMessageHandledStep(input)
    return new WorkflowResponse(message)
  }
)
