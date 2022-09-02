import { Attribute } from '../attribute'
import { AttributeType } from '../types'
import { MemberAttributes } from './enums'

export const DiscordMemberAttributes: Attribute[] = [
  {
    name: MemberAttributes.ID.name,
    label: MemberAttributes.ID.label,
    type: AttributeType.STRING,
    canDelete: false,
    show: false,
  },
]
