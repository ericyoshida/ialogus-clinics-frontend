import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MetaBusinessAccount, WhatsAppPhoneNumber } from '@/services/channels'

interface ChannelCreationFormData {
  selectedChannelType: 'whatsapp' | null
  selectedAgentIds: string[]
  selectedAgentsData?: Array<{
    botModelId: string
    departmentId: string
    departmentName: string
    botName: string
    companyId: string
  }>
  metaAuthData?: {
    accessToken?: string
    phoneNumberId?: string
    businessAccountId?: string
  }
  authCode?: string
  businessAccounts?: MetaBusinessAccount[]
  selectedBusinessAccountId?: string
  whatsappNumbers?: WhatsAppPhoneNumber[]
  selectedPhoneNumberId?: string
  selectedPhoneNumber?: string
  channelName?: string
  companyId?: string
  step: number
}

interface ChannelCreationFormStore extends ChannelCreationFormData {
  updateFormData: (data: Partial<ChannelCreationFormData>) => void
  clearFormData: () => void
  toggleAgentSelection: (agentId: string, agentData?: any) => void
}

const initialState: ChannelCreationFormData = {
  selectedChannelType: null,
  selectedAgentIds: [],
  selectedAgentsData: [],
  metaAuthData: undefined,
  authCode: undefined,
  businessAccounts: undefined,
  selectedBusinessAccountId: undefined,
  whatsappNumbers: undefined,
  selectedPhoneNumberId: undefined,
  selectedPhoneNumber: undefined,
  channelName: undefined,
  companyId: undefined,
  step: 0,
}

export const useChannelCreationForm = create(
  persist<ChannelCreationFormStore>(
    (set) => ({
      ...initialState,
      updateFormData: (data) => set((state) => ({ ...state, ...data })),
      clearFormData: () => set(initialState),
      toggleAgentSelection: (agentId, agentData) => set((state) => {
        const isSelected = state.selectedAgentIds.includes(agentId)
        
        if (isSelected) {
          // Remove agent
          return {
            ...state,
            selectedAgentIds: state.selectedAgentIds.filter(id => id !== agentId),
            selectedAgentsData: state.selectedAgentsData?.filter(
              agent => agent.botModelId !== agentId
            ),
          }
        } else {
          // Add agent
          return {
            ...state,
            selectedAgentIds: [...state.selectedAgentIds, agentId],
            selectedAgentsData: agentData 
              ? [...(state.selectedAgentsData || []), agentData]
              : state.selectedAgentsData,
          }
        }
      }),
    }),
    {
      name: 'channel-creation-form',
      partialize: (state) => ({
        selectedChannelType: state.selectedChannelType,
        selectedAgentIds: state.selectedAgentIds,
        selectedAgentsData: state.selectedAgentsData,
        channelName: state.channelName,
        companyId: state.companyId,
        step: state.step,
        // Dados de autenticação META são mantidos temporariamente
        metaAuthData: state.metaAuthData,
        authCode: state.authCode,
        businessAccounts: state.businessAccounts,
        selectedBusinessAccountId: state.selectedBusinessAccountId,
        whatsappNumbers: state.whatsappNumbers,
        selectedPhoneNumberId: state.selectedPhoneNumberId,
        selectedPhoneNumber: state.selectedPhoneNumber,
      }),
    }
  )
)