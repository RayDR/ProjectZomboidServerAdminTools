import React from 'react'
import CollapsibleGroup from '../../../components/CollapsibleGroup'
import ButtonConfirm from '../../../components/ButtonConfirm'

export default function Actions() {
  return (
    <CollapsibleGroup title="⚙️ Acciones">
      <div className="pz-actions">
        <ButtonConfirm action="restart" label="🔁 Reiniciar servidor" />
        <ButtonConfirm action="backup" label="📦 Backup" />
        <ButtonConfirm action="fullupdate" label="🛠️ Full Update" />
      </div>
    </CollapsibleGroup>
  )
}