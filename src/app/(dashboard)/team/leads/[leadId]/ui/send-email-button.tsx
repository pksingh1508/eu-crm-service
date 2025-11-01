'use client'

import { Button } from "@/components/ui/button"
import { useUiStore } from "@/stores/ui-store"

type SendEmailButtonProps = {
  leadId: string
  disabled?: boolean
}

const SendEmailButton = ({ leadId, disabled = false }: SendEmailButtonProps) => {
  const openEmailComposer = useUiStore((state) => state.openEmailComposer)

  return (
    <Button
      size="sm"
      onClick={() => openEmailComposer(leadId)}
      disabled={disabled}
    >
      Send email
    </Button>
  )
}

export default SendEmailButton

