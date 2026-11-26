import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CONTACT_MODULE } from "../../modules/contact"
import ContactModuleService from "../../modules/contact/service"

export type CreateContactMessageInput = {
  name: string
  email: string
  topic: string
  message: string
}

const createContactMessageStep = createStep(
  "create-contact-message",
  async (input: CreateContactMessageInput, { container }) => {
    const service: ContactModuleService = container.resolve(CONTACT_MODULE)
    const created = await service.createContactMessages(input)
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: ContactModuleService = container.resolve(CONTACT_MODULE)
    await service.deleteContactMessages(id)
  }
)

export const createContactMessageWorkflow = createWorkflow(
  "create-contact-message",
  (input: CreateContactMessageInput) => {
    const message = createContactMessageStep(input)
    return new WorkflowResponse(message)
  }
)
