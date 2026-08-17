import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/purchases/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/purchases/new"!</div>
}
