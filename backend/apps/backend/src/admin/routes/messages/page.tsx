import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

type ContactMessage = {
  id: string
  name: string
  email: string
  topic: string
  message: string
  handled: boolean
  created_at: string
}

const request = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

/** Admin -> Messages: contact-form messages sent from the website. */
const MessagesPage = () => {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: () => request<{ contact_messages: ContactMessage[]; count: number }>("/admin/contact-messages?limit=200"),
  })

  const toggle = useMutation({
    mutationFn: (m: ContactMessage) =>
      request(`/admin/contact-messages/${m.id}`, { method: "POST", body: JSON.stringify({ handled: !m.handled }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contact-messages"] }),
    onError: () => toast.error("Could not update the message"),
  })

  const messages = data?.contact_messages ?? []

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h1">Messages</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Sent from the Contact page on the website. Reply by email, then mark them handled.
        </Text>
      </div>
      {isLoading ? (
        <Text className="px-6 py-8 text-ui-fg-subtle">Loading messages...</Text>
      ) : isError ? (
        <Text className="px-6 py-8 text-ui-fg-error">Messages could not be loaded. Refresh to try again.</Text>
      ) : !messages.length ? (
        <Text className="px-6 py-8 text-ui-fg-subtle">No messages yet.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Received</Table.HeaderCell>
              <Table.HeaderCell>From</Table.HeaderCell>
              <Table.HeaderCell>Topic</Table.HeaderCell>
              <Table.HeaderCell>Message</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {messages.map((m) => (
              <Table.Row key={m.id}>
                <Table.Cell className="whitespace-nowrap">{new Date(m.created_at).toLocaleString("en-IN")}</Table.Cell>
                <Table.Cell>
                  <a className="text-ui-fg-interactive" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`}>
                    {m.name}
                  </a>
                  <Text size="small" className="text-ui-fg-subtle">{m.email}</Text>
                </Table.Cell>
                <Table.Cell>{m.topic}</Table.Cell>
                <Table.Cell className="max-w-md whitespace-pre-wrap py-3">{m.message}</Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Badge color={m.handled ? "green" : "orange"}>{m.handled ? "Handled" : "New"}</Badge>
                    <Button size="small" variant="secondary" isLoading={toggle.isPending && toggle.variables?.id === m.id} onClick={() => toggle.mutate(m)}>
                      {m.handled ? "Reopen" : "Mark handled"}
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Messages",
  icon: ChatBubbleLeftRight,
})

export default MessagesPage
